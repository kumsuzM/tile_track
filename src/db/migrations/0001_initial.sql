-- Create tables
CREATE TABLE IF NOT EXISTS invoices (
    invoice_number VARCHAR(50) PRIMARY KEY,
    fob DECIMAL(10, 2) NOT NULL,
    invoice_date DATE NOT NULL,
    client VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('scheduled', 'in manufacturing', 'completed', 'booked', 'shipped')),
    delivery_location TEXT NOT NULL,
    estimated_delivery_date DATE NOT NULL,
    actual_delivery_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_number) REFERENCES invoices(invoice_number) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
    product_id SERIAL PRIMARY KEY,
    material_name VARCHAR(100) NOT NULL,
    finish_type VARCHAR(50) NOT NULL,
    supplier VARCHAR(100) NOT NULL,
    dimensions VARCHAR(50) NOT NULL,
    unit_type VARCHAR(20) NOT NULL CHECK (unit_type IN ('pieces', 'm²')),
    buy_price_per_unit DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (material_name, finish_type, dimensions, unit_type)
);

CREATE TABLE IF NOT EXISTS order_products (
    order_product_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    number_of_crates INTEGER NOT NULL,
    pieces_per_crate INTEGER NOT NULL,
    units_per_crate DECIMAL(10, 2) NOT NULL,
    sell_price_per_unit DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_orders_invoice ON orders(invoice_number);
CREATE INDEX IF NOT EXISTS idx_order_products_order ON order_products(order_id);
CREATE INDEX IF NOT EXISTS idx_order_products_product ON order_products(product_id);

-- Materialized view for invoice summary with calculated totals
CREATE MATERIALIZED VIEW IF NOT EXISTS invoice_summary AS
SELECT
    i.invoice_number,
    i.invoice_date,
    i.client,
    i.status,
    i.delivery_location,
    i.estimated_delivery_date,
    i.actual_delivery_date,
    i.fob,
    COALESCE(totals.total_revenue, 0) AS total_revenue,
    COALESCE(totals.total_product_cost, 0) + i.fob AS total_expense,
    COALESCE(totals.total_revenue, 0) - (COALESCE(totals.total_product_cost, 0) + i.fob) AS profit,
    CASE
        WHEN COALESCE(totals.total_revenue, 0) > 0
        THEN ((COALESCE(totals.total_revenue, 0) - (COALESCE(totals.total_product_cost, 0) + i.fob)) / COALESCE(totals.total_revenue, 0)) * 100
        ELSE 0
    END AS profit_margin,
    COALESCE(totals.total_crates, 0) AS total_crates,
    COALESCE(totals.total_units, 0) AS total_units,
    COALESCE(totals.product_count, 0) AS product_count,
    i.created_at,
    i.updated_at
FROM invoices i
LEFT JOIN (
    SELECT
        o.invoice_number,
        SUM(op.sell_price_per_unit * op.units_per_crate * op.number_of_crates) AS total_revenue,
        SUM(p.buy_price_per_unit * op.units_per_crate * op.number_of_crates) AS total_product_cost,
        SUM(op.number_of_crates) AS total_crates,
        SUM(op.units_per_crate * op.number_of_crates) AS total_units,
        COUNT(DISTINCT op.product_id) AS product_count
    FROM orders o
    JOIN order_products op ON o.order_id = op.order_id
    JOIN products p ON op.product_id = p.product_id
    GROUP BY o.invoice_number
) totals ON i.invoice_number = totals.invoice_number;

-- Create unique index on materialized view for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_summary_invoice_number ON invoice_summary(invoice_number);

-- Materialized view for product performance analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS product_analytics AS
SELECT
    p.product_id,
    p.material_name,
    p.finish_type,
    p.supplier,
    p.dimensions,
    p.unit_type,
    p.buy_price_per_unit,
    COUNT(DISTINCT o.invoice_number) AS times_ordered,
    SUM(op.number_of_crates) AS total_crates_sold,
    SUM(op.units_per_crate * op.number_of_crates) AS total_units_sold,
    SUM(op.sell_price_per_unit * op.units_per_crate * op.number_of_crates) AS total_revenue,
    SUM(p.buy_price_per_unit * op.units_per_crate * op.number_of_crates) AS total_cost,
    SUM(op.sell_price_per_unit * op.units_per_crate * op.number_of_crates) -
        SUM(p.buy_price_per_unit * op.units_per_crate * op.number_of_crates) AS total_profit,
    AVG(op.sell_price_per_unit) AS avg_sell_price,
    p.created_at
FROM products p
LEFT JOIN order_products op ON p.product_id = op.product_id
LEFT JOIN orders o ON op.order_id = o.order_id
GROUP BY p.product_id, p.material_name, p.finish_type, p.supplier, p.dimensions, p.unit_type, p.buy_price_per_unit, p.created_at;

-- Create unique index on product analytics materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_analytics_product_id ON product_analytics(product_id);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY invoice_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY product_analytics;
END;
$$ LANGUAGE plpgsql;
