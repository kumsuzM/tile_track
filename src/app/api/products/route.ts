import { NextResponse } from "next/server";
import { db, products, orderProducts } from "@/db";
import { eq, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAnalytics = searchParams.get("analytics") === "true";

    if (includeAnalytics) {
      // Get products with analytics from orderProducts
      const productsWithAnalytics = await db
        .select({
          productId: products.productId,
          materialName: products.materialName,
          finishType: products.finishType,
          supplier: products.supplier,
          dimensions: products.dimensions,
          unitType: products.unitType,
          buyPricePerUnit: products.buyPricePerUnit,
          createdAt: products.createdAt,
          timesOrdered: sql<number>`count(distinct ${orderProducts.orderId})`.as("times_ordered"),
          totalCratesSold: sql<number>`coalesce(sum(${orderProducts.numberOfCrates}), 0)`.as("total_crates_sold"),
          totalUnitsSold: sql<number>`coalesce(sum(${orderProducts.numberOfCrates} * ${orderProducts.unitsPerCrate}), 0)`.as("total_units_sold"),
          totalRevenue: sql<number>`coalesce(sum(${orderProducts.numberOfCrates} * ${orderProducts.unitsPerCrate} * ${orderProducts.sellPricePerUnit}), 0)`.as("total_revenue"),
          totalCost: sql<number>`coalesce(sum(${orderProducts.numberOfCrates} * ${orderProducts.unitsPerCrate} * ${products.buyPricePerUnit}), 0)`.as("total_cost"),
        })
        .from(products)
        .leftJoin(orderProducts, eq(products.productId, orderProducts.productId))
        .groupBy(products.productId);

      const formattedProducts = productsWithAnalytics.map((p) => ({
        product_id: p.productId,
        material_name: p.materialName,
        finish_type: p.finishType,
        supplier: p.supplier,
        dimensions: p.dimensions,
        unit_type: p.unitType,
        buy_price_per_unit: p.buyPricePerUnit,
        created_at: p.createdAt,
        times_ordered: Number(p.timesOrdered) || 0,
        total_crates_sold: Number(p.totalCratesSold) || 0,
        total_units_sold: Number(p.totalUnitsSold) || 0,
        total_revenue: Number(p.totalRevenue) || 0,
        total_cost: Number(p.totalCost) || 0,
        total_profit: (Number(p.totalRevenue) || 0) - (Number(p.totalCost) || 0),
      }));

      return NextResponse.json(formattedProducts);
    }

    // Basic product list without analytics
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

    // Support both camelCase and snake_case
    const newProduct = await db
      .insert(products)
      .values({
        materialName: body.materialName || body.material_name,
        finishType: body.finishType || body.finish_type,
        supplier: body.supplier,
        dimensions: body.dimensions,
        unitType: body.unitType || body.unit_type,
        buyPricePerUnit: (body.buyPricePerUnit || body.buy_price_per_unit).toString(),
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
