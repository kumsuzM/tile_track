import { NextResponse } from "next/server";
import { db, products } from "@/db";

export async function GET() {
  try {
    const productList = await db.select().from(products);

    const formattedProducts = productList.map((p) => ({
      product_id: p.productId,
      material_name: p.materialName,
      finish_type: p.finishType,
      supplier: p.supplier,
      dimensions: p.dimensions,
      unit_type: p.unitType,
      buy_price_per_unit: parseFloat(p.buyPricePerUnit),
    }));

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newProduct = await db
      .insert(products)
      .values({
        materialName: body.material_name,
        finishType: body.finish_type,
        supplier: body.supplier,
        dimensions: body.dimensions,
        unitType: body.unit_type,
        buyPricePerUnit: body.buy_price_per_unit.toString(),
      })
      .returning();

    return NextResponse.json(
      {
        product_id: newProduct[0].productId,
        material_name: newProduct[0].materialName,
        finish_type: newProduct[0].finishType,
        supplier: newProduct[0].supplier,
        dimensions: newProduct[0].dimensions,
        unit_type: newProduct[0].unitType,
        buy_price_per_unit: parseFloat(newProduct[0].buyPricePerUnit),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
