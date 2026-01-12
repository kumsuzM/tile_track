import { NextResponse } from "next/server";
import { db, invoices } from "@/db";
import { eq, sql } from "drizzle-orm";

// GET /api/invoices/[id] - Get invoice with full details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceNumber } = await params;

    // Get invoice
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.invoiceNumber, invoiceNumber),
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Get orders with products
    const ordersWithProducts = await db.execute(sql`
      SELECT
        o.order_id,
        o.invoice_number,
        o.notes,
        o.created_at as order_created_at,
        op.order_product_id,
        op.number_of_crates,
        op.pieces_per_crate,
        op.units_per_crate,
        op.sell_price_per_unit,
        p.product_id,
        p.material_name,
        p.finish_type,
        p.supplier,
        p.dimensions,
        p.unit_type,
        p.buy_price_per_unit
      FROM orders o
      LEFT JOIN order_products op ON o.order_id = op.order_id
      LEFT JOIN products p ON op.product_id = p.product_id
      WHERE o.invoice_number = ${invoiceNumber}
      ORDER BY o.order_id, op.order_product_id
    `);

    // Group products by order
    const ordersMap = new Map<number, {
      orderId: number;
      invoiceNumber: string;
      notes: string | null;
      products: Array<{
        orderProductId: number;
        productId: number;
        materialName: string;
        finishType: string;
        supplier: string;
        dimensions: string;
        unitType: string;
        buyPricePerUnit: number;
        numberOfCrates: number;
        piecesPerCrate: number;
        unitsPerCrate: number;
        sellPricePerUnit: number;
      }>;
    }>();

    for (const row of ordersWithProducts.rows as Array<Record<string, unknown>>) {
      const orderId = row.order_id as number;

      if (!ordersMap.has(orderId)) {
        ordersMap.set(orderId, {
          orderId,
          invoiceNumber: row.invoice_number as string,
          notes: row.notes as string | null,
          products: [],
        });
      }

      if (row.product_id) {
        ordersMap.get(orderId)!.products.push({
          orderProductId: row.order_product_id as number,
          productId: row.product_id as number,
          materialName: row.material_name as string,
          finishType: row.finish_type as string,
          supplier: row.supplier as string,
          dimensions: row.dimensions as string,
          unitType: row.unit_type as string,
          buyPricePerUnit: parseFloat(row.buy_price_per_unit as string),
          numberOfCrates: row.number_of_crates as number,
          piecesPerCrate: row.pieces_per_crate as number,
          unitsPerCrate: parseFloat(row.units_per_crate as string),
          sellPricePerUnit: parseFloat(row.sell_price_per_unit as string),
        });
      }
    }

    return NextResponse.json({
      ...invoice,
      fob: parseFloat(invoice.fob),
      orders: Array.from(ordersMap.values()),
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

// PUT /api/invoices/[id] - Update invoice
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceNumber } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(invoices)
      .set({
        fob: body.fob?.toString(),
        invoiceDate: body.invoiceDate,
        client: body.client,
        status: body.status,
        deliveryLocation: body.deliveryLocation,
        estimatedDeliveryDate: body.estimatedDeliveryDate,
        actualDeliveryDate: body.actualDeliveryDate || null,
        updatedAt: new Date(),
      })
      .where(eq(invoices.invoiceNumber, invoiceNumber))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices/[id] - Delete invoice
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceNumber } = await params;

    const [deleted] = await db
      .delete(invoices)
      .where(eq(invoices.invoiceNumber, invoiceNumber))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
