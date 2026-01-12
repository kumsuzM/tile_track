import { NextResponse } from "next/server";
import { db, orders, orderProducts } from "@/db";
import { eq } from "drizzle-orm";

// POST /api/orders - Create a new order for an invoice
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const [newOrder] = await db
      .insert(orders)
      .values({
        invoiceNumber: body.invoiceNumber,
        notes: body.notes || null,
      })
      .returning();

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

// PUT /api/orders - Add product to order
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const [newOrderProduct] = await db
      .insert(orderProducts)
      .values({
        orderId: body.orderId,
        productId: body.productId,
        numberOfCrates: body.numberOfCrates,
        piecesPerCrate: body.piecesPerCrate,
        unitsPerCrate: body.unitsPerCrate.toString(),
        sellPricePerUnit: body.sellPricePerUnit.toString(),
      })
      .returning();

    return NextResponse.json(newOrderProduct);
  } catch (error) {
    console.error("Error adding product to order:", error);
    return NextResponse.json(
      { error: "Failed to add product to order" },
      { status: 500 }
    );
  }
}

// PATCH /api/orders - Update order or order product
export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    // Update order notes
    if (body.orderId && body.notes !== undefined) {
      const [updated] = await db
        .update(orders)
        .set({ notes: body.notes, updatedAt: new Date() })
        .where(eq(orders.orderId, body.orderId))
        .returning();

      return NextResponse.json(updated);
    }

    // Update order product
    if (body.orderProductId) {
      const updateData: Record<string, unknown> = { updatedAt: new Date() };

      if (body.numberOfCrates !== undefined) updateData.numberOfCrates = body.numberOfCrates;
      if (body.piecesPerCrate !== undefined) updateData.piecesPerCrate = body.piecesPerCrate;
      if (body.unitsPerCrate !== undefined) updateData.unitsPerCrate = body.unitsPerCrate.toString();
      if (body.sellPricePerUnit !== undefined) updateData.sellPricePerUnit = body.sellPricePerUnit.toString();

      const [updated] = await db
        .update(orderProducts)
        .set(updateData)
        .where(eq(orderProducts.orderProductId, body.orderProductId))
        .returning();

      return NextResponse.json(updated);
    }

    return NextResponse.json(
      { error: "orderId or orderProductId is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

// DELETE /api/orders - Remove product from order
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderProductId = searchParams.get("orderProductId");

    if (!orderProductId) {
      return NextResponse.json(
        { error: "orderProductId is required" },
        { status: 400 }
      );
    }

    await db
      .delete(orderProducts)
      .where(eq(orderProducts.orderProductId, parseInt(orderProductId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing product from order:", error);
    return NextResponse.json(
      { error: "Failed to remove product from order" },
      { status: 500 }
    );
  }
}
