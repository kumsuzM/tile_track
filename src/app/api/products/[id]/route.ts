import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, products } from "@/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);
    const product = await db
      .select()
      .from(products)
      .where(eq(products.productId, productId))
      .limit(1);

    if (product.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const p = product[0];
    return NextResponse.json({
      product_id: p.productId,
      material_name: p.materialName,
      finish_type: p.finishType,
      supplier: p.supplier,
      dimensions: p.dimensions,
      unit_type: p.unitType,
      buy_price_per_unit: parseFloat(p.buyPricePerUnit),
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);
    const body = await request.json();

    const updatedProduct = await db
      .update(products)
      .set({
        materialName: body.materialName,
        finishType: body.finishType,
        supplier: body.supplier,
        dimensions: body.dimensions,
        unitType: body.unitType,
        buyPricePerUnit: body.buyPricePerUnit.toString(),
        updatedAt: new Date(),
      })
      .where(eq(products.productId, productId))
      .returning();

    if (updatedProduct.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const p = updatedProduct[0];
    return NextResponse.json({
      product_id: p.productId,
      material_name: p.materialName,
      finish_type: p.finishType,
      supplier: p.supplier,
      dimensions: p.dimensions,
      unit_type: p.unitType,
      buy_price_per_unit: parseFloat(p.buyPricePerUnit),
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);
    const deleted = await db
      .delete(products)
      .where(eq(products.productId, productId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
