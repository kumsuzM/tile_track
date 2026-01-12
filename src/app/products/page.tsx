"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { Button, Card, Input, Modal, Select } from "@/components/ui";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { formatCurrency } from "@/lib/utils";
import type { ProductWithAnalytics, CreateProductInput, UnitType } from "@/lib/types";
import type { Locale } from "@/i18n/config";

export default function ProductsPage() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state for new product
  const [newProduct, setNewProduct] = useState<CreateProductInput>({
    materialName: "",
    finishType: "",
    supplier: "",
    dimensions: "",
    unitType: "m²",
    buyPricePerUnit: 0,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products?analytics=true");
      if (res.ok) {
        const data = await res.json();
        setProducts(
          data.map((p: Record<string, unknown>) => ({
            productId: p.product_id,
            materialName: p.material_name,
            finishType: p.finish_type,
            supplier: p.supplier,
            dimensions: p.dimensions,
            unitType: p.unit_type,
            buyPricePerUnit: parseFloat(p.buy_price_per_unit as string),
            timesOrdered: parseInt(p.times_ordered as string) || 0,
            totalCratesSold: parseInt(p.total_crates_sold as string) || 0,
            totalUnitsSold: parseFloat(p.total_units_sold as string) || 0,
            totalRevenue: parseFloat(p.total_revenue as string) || 0,
            totalCost: parseFloat(p.total_cost as string) || 0,
            totalProfit: parseFloat(p.total_profit as string) || 0,
            createdAt: p.created_at,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.materialName || !newProduct.finishType || !newProduct.supplier) {
      alert(t("validation.fillAllFields"));
      return;
    }

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        setNewProduct({
          materialName: "",
          finishType: "",
          supplier: "",
          dimensions: "",
          unitType: "m²",
          buyPricePerUnit: 0,
        });
        fetchProducts();
      }
    } catch (error) {
      console.error("Failed to create product:", error);
    }
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.materialName.toLowerCase().includes(searchLower) ||
      product.supplier.toLowerCase().includes(searchLower) ||
      product.finishType.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {t("product.products")}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher currentLocale={locale} />
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={20} />
              {t("product.createNew")}
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="p-4 mb-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder={t("common.search")}
              className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </Card>

        {/* Products Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    {t("product.materialName")}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    {t("product.finishType")}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    {t("product.supplier")}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    {t("product.dimensions")}
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">
                    {t("product.buyPrice")}
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">
                    Orders
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">
                    {t("calculation.totalRevenue")}
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">
                    {t("calculation.profit")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.productId}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-4 px-4 font-medium text-gray-900">
                      {product.materialName}
                    </td>
                    <td className="py-4 px-4 text-gray-700">
                      {product.finishType}
                    </td>
                    <td className="py-4 px-4 text-gray-700">
                      {product.supplier}
                    </td>
                    <td className="py-4 px-4 text-gray-700">
                      {product.dimensions}
                    </td>
                    <td className="py-4 px-4 text-right text-gray-700">
                      {formatCurrency(product.buyPricePerUnit)}/{product.unitType}
                    </td>
                    <td className="py-4 px-4 text-center text-gray-700">
                      {product.timesOrdered}
                    </td>
                    <td className="py-4 px-4 text-right text-green-700 font-medium">
                      {formatCurrency(product.totalRevenue)}
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-blue-700">
                      {formatCurrency(product.totalProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {t("search.noResults")}
            </div>
          )}
        </Card>
      </div>

      {/* Create Product Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={t("product.createNew")}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              className="flex-1"
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreateProduct} className="flex-1">
              {t("common.save")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t("product.materialName")}
            value={newProduct.materialName}
            onChange={(e) =>
              setNewProduct({ ...newProduct, materialName: e.target.value })
            }
            placeholder="e.g., HEX CARRARA"
          />
          <Input
            label={t("product.finishType")}
            value={newProduct.finishType}
            onChange={(e) =>
              setNewProduct({ ...newProduct, finishType: e.target.value })
            }
            placeholder="e.g., Matt, Glossy"
          />
          <Input
            label={t("product.supplier")}
            value={newProduct.supplier}
            onChange={(e) =>
              setNewProduct({ ...newProduct, supplier: e.target.value })
            }
            placeholder="e.g., Vitra"
          />
          <Input
            label={t("product.dimensions")}
            value={newProduct.dimensions}
            onChange={(e) =>
              setNewProduct({ ...newProduct, dimensions: e.target.value })
            }
            placeholder="e.g., 45x52"
          />
          <Select
            label={t("product.unitType")}
            value={newProduct.unitType}
            onChange={(e) =>
              setNewProduct({ ...newProduct, unitType: e.target.value as UnitType })
            }
            options={[
              { value: "m²", label: t("units.sqm") },
              { value: "pieces", label: t("units.pieces") },
            ]}
          />
          <Input
            type="number"
            step="0.01"
            label={t("product.buyPrice")}
            value={newProduct.buyPricePerUnit || ""}
            onChange={(e) =>
              setNewProduct({
                ...newProduct,
                buyPricePerUnit: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="e.g., 8.50"
          />
        </div>
      </Modal>
    </div>
  );
}
