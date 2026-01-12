import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import { invoices, orders, products, orderProducts } from "./schema";

dotenv.config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  console.log("Clearing existing data...");
  await db.delete(orderProducts);
  await db.delete(orders);
  await db.delete(products);
  await db.delete(invoices);

  // Insert sample products
  const sampleProducts = [
    {
      materialName: "HEX CARRARA",
      finishType: "Matt",
      supplier: "Vitra",
      dimensions: "45x52",
      unitType: "m²" as const,
      buyPricePerUnit: "8.50",
    },
    {
      materialName: "METRO",
      finishType: "Glossy",
      supplier: "Kale",
      dimensions: "7.5x15",
      unitType: "m²" as const,
      buyPricePerUnit: "6.00",
    },
    {
      materialName: "ARABESCO",
      finishType: "Glossy",
      supplier: "Ege Seramik",
      dimensions: "60x60",
      unitType: "m²" as const,
      buyPricePerUnit: "9.00",
    },
    {
      materialName: "HEXAGON MARBLE",
      finishType: "Polished",
      supplier: "Vitra",
      dimensions: "30x30",
      unitType: "pieces" as const,
      buyPricePerUnit: "2.50",
    },
  ];

  console.log("Inserting products...");
  const insertedProducts = await db.insert(products).values(sampleProducts).returning();
  console.log(`Inserted ${insertedProducts.length} products`);

  // Insert sample invoices
  const sampleInvoices = [
    {
      invoiceNumber: "INV-001",
      invoiceDate: "2024-12-15",
      client: "Ali Bey",
      status: "shipped" as const,
      deliveryLocation: "Ankara, Çankaya",
      estimatedDeliveryDate: "2024-12-20",
      actualDeliveryDate: "2024-12-19",
      fob: "180.00",
    },
    {
      invoiceNumber: "INV-002",
      invoiceDate: "2024-12-18",
      client: "Mehmet Yılmaz",
      status: "booked" as const,
      deliveryLocation: "İzmir, Karşıyaka",
      estimatedDeliveryDate: "2025-01-10",
      actualDeliveryDate: null,
      fob: "220.00",
    },
    {
      invoiceNumber: "INV-003",
      invoiceDate: "2024-12-20",
      client: "Ayşe Hanım",
      status: "in manufacturing" as const,
      deliveryLocation: "Istanbul, Kadıköy",
      estimatedDeliveryDate: "2025-01-15",
      actualDeliveryDate: null,
      fob: "250.00",
    },
  ];

  console.log("Inserting invoices...");
  const insertedInvoices = await db.insert(invoices).values(sampleInvoices).returning();
  console.log(`Inserted ${insertedInvoices.length} invoices`);

  // Insert orders for each invoice
  console.log("Inserting orders...");
  const insertedOrders = await db
    .insert(orders)
    .values(
      insertedInvoices.map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        notes: inv.invoiceNumber === "INV-003" ? "Customer requested rush delivery" : null,
      }))
    )
    .returning();
  console.log(`Inserted ${insertedOrders.length} orders`);

  // Insert order products
  const orderProductsData = [
    // INV-001 products
    {
      orderId: insertedOrders[0].orderId,
      productId: insertedProducts[0].productId,
      numberOfCrates: 40,
      piecesPerCrate: 16,
      unitsPerCrate: "1.44",
      sellPricePerUnit: "12.00",
    },
    {
      orderId: insertedOrders[0].orderId,
      productId: insertedProducts[1].productId,
      numberOfCrates: 25,
      piecesPerCrate: 50,
      unitsPerCrate: "1.12",
      sellPricePerUnit: "9.50",
    },
    // INV-002 products
    {
      orderId: insertedOrders[1].orderId,
      productId: insertedProducts[2].productId,
      numberOfCrates: 30,
      piecesPerCrate: 16,
      unitsPerCrate: "1.20",
      sellPricePerUnit: "13.50",
    },
    // INV-003 products
    {
      orderId: insertedOrders[2].orderId,
      productId: insertedProducts[0].productId,
      numberOfCrates: 50,
      piecesPerCrate: 16,
      unitsPerCrate: "1.44",
      sellPricePerUnit: "12.00",
    },
    {
      orderId: insertedOrders[2].orderId,
      productId: insertedProducts[2].productId,
      numberOfCrates: 30,
      piecesPerCrate: 16,
      unitsPerCrate: "1.20",
      sellPricePerUnit: "13.50",
    },
  ];

  console.log("Inserting order products...");
  await db.insert(orderProducts).values(orderProductsData);
  console.log("Inserted order products");

  console.log("✅ Seed completed successfully!");

  await pool.end();
  process.exit(0);
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
