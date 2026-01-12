import { NextResponse } from "next/server";
import { db, invoices, orders, orderProducts, products } from "@/db";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    // Get all invoices with calculated totals
    const invoiceList = await db.select().from(invoices);

    // Calculate revenue, expense, and profit for each invoice
    const invoicesWithTotals = await Promise.all(
      invoiceList.map(async (invoice) => {
        // Get all orders for this invoice
        const invoiceOrders = await db
          .select()
          .from(orders)
          .where(eq(orders.invoiceNumber, invoice.invoiceNumber));

        let totalRevenue = 0;
        let totalExpense = 0;

        // For each order, calculate totals from order products
        for (const order of invoiceOrders) {
          const orderProductList = await db
            .select({
              numberOfCrates: orderProducts.numberOfCrates,
              unitsPerCrate: orderProducts.unitsPerCrate,
              sellPricePerUnit: orderProducts.sellPricePerUnit,
              buyPricePerUnit: products.buyPricePerUnit,
            })
            .from(orderProducts)
            .innerJoin(
              products,
              eq(orderProducts.productId, products.productId),
            )
            .where(eq(orderProducts.orderId, order.orderId));

          for (const op of orderProductList) {
            const totalUnits =
              op.numberOfCrates * parseFloat(op.unitsPerCrate || "0");
            const revenue = totalUnits * parseFloat(op.sellPricePerUnit || "0");
            const expense = totalUnits * parseFloat(op.buyPricePerUnit || "0");

            totalRevenue += revenue;
            totalExpense += expense;
          }
        }

        const profit = totalRevenue - totalExpense - parseFloat(invoice.fob);
        const profitMargin =
          totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

        return {
          invoice_number: invoice.invoiceNumber,
          invoice_date: invoice.invoiceDate,
          client: invoice.client,
          status: invoice.status,
          delivery_location: invoice.deliveryLocation,
          estimated_delivery_date: invoice.estimatedDeliveryDate,
          actual_delivery_date: invoice.actualDeliveryDate,
          fob: parseFloat(invoice.fob),
          total_revenue: Math.round(totalRevenue * 100) / 100,
          total_expense: Math.round(totalExpense * 100) / 100,
          profit: Math.round(profit * 100) / 100,
          profit_margin: Math.round(profitMargin * 10) / 10,
        };
      }),
    );

    return NextResponse.json(invoicesWithTotals);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newInvoice = await db
      .insert(invoices)
      .values({
        invoiceNumber: body.invoice_number,
        fob: body.fob.toString(),
        invoiceDate: body.invoice_date,
        client: body.client,
        status: body.status,
        deliveryLocation: body.delivery_location,
        estimatedDeliveryDate: body.estimated_delivery_date,
        actualDeliveryDate: body.actual_delivery_date || null,
      })
      .returning();

    return NextResponse.json(newInvoice[0], { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 },
    );
  }
}
