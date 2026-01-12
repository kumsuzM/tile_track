import {
  pgTable,
  serial,
  varchar,
  decimal,
  date,
  text,
  timestamp,
  integer,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const invoices = pgTable(
  "invoices",
  {
    invoiceNumber: varchar("invoice_number", { length: 50 }).primaryKey(),
    fob: decimal("fob", { precision: 10, scale: 2 }).notNull(),
    invoiceDate: date("invoice_date").notNull(),
    client: varchar("client", { length: 100 }).notNull(),
    status: varchar("status", { length: 20 }).notNull(),
    deliveryLocation: text("delivery_location").notNull(),
    estimatedDeliveryDate: date("estimated_delivery_date").notNull(),
    actualDeliveryDate: date("actual_delivery_date"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    statusCheck: check(
      "status_check",
      sql`${table.status} IN ('scheduled', 'in manufacturing', 'completed', 'booked', 'shipped')`
    ),
  })
);

export const orders = pgTable("orders", {
  orderId: serial("order_id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 50 })
    .notNull()
    .references(() => invoices.invoiceNumber),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const products = pgTable("products", {
  productId: serial("product_id").primaryKey(),
  materialName: varchar("material_name", { length: 100 }).notNull(),
  finishType: varchar("finish_type", { length: 50 }).notNull(),
  supplier: varchar("supplier", { length: 100 }).notNull(),
  dimensions: varchar("dimensions", { length: 50 }).notNull(),
  unitType: varchar("unit_type", { length: 20 }).notNull(),
  buyPricePerUnit: decimal("buy_price_per_unit", {
    precision: 10,
    scale: 2,
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderProducts = pgTable("order_products", {
  orderProductId: serial("order_product_id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.orderId),
  productId: integer("product_id")
    .notNull()
    .references(() => products.productId),
  numberOfCrates: integer("number_of_crates").notNull(),
  piecesPerCrate: integer("pieces_per_crate").notNull(),
  unitsPerCrate: decimal("units_per_crate", {
    precision: 10,
    scale: 2,
  }).notNull(),
  sellPricePerUnit: decimal("sell_price_per_unit", {
    precision: 10,
    scale: 2,
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Type exports
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type OrderProduct = typeof orderProducts.$inferSelect;
export type NewOrderProduct = typeof orderProducts.$inferInsert;

// Status type
export type InvoiceStatus =
  | "scheduled"
  | "in manufacturing"
  | "completed"
  | "booked"
  | "shipped";
