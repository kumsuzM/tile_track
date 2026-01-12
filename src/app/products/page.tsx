"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil } from "lucide-react";
import { Button, Card, Input, Modal, Select } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import type { ProductWithAnalytics, CreateProductInput, UnitType } from "@/lib/types";

interface EditProductInput extends CreateProductInput {
  productId: number;
}

async function fetchProducts(): Promise<ProductWithAnalytics[]> {
  const res = await fetch("/api/products?analytics=true");
  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }
  const data = await res.json();
  return data.map((p: Record<string, unknown>) => ({
    productId: p.product_id as number,
    materialName: (p.material_name as string) || "",
    finishType: (p.finish_type as string) || "",
    supplier: (p.supplier as string) || "",
    dimensions: (p.dimensions as string) || "",
    unitType: (p.unit_type as string) || "m²",
    buyPricePerUnit: Number(p.buy_price_per_unit) || 0,
    timesOrdered: Number(p.times_ordered) || 0,
    totalCratesSold: Number(p.total_crates_sold) || 0,
    totalUnitsSold: Number(p.total_units_sold) || 0,
    totalRevenue: Number(p.total_revenue) || 0,
    totalCost: Number(p.total_cost) || 0,
    totalProfit: Number(p.total_profit) || 0,
    createdAt: p.created_at,
  }));
}

async function createProduct(product: CreateProductInput): Promise<void> {
  const res = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  if (!res.ok) {
    throw new Error("Failed to create product");
  }
}

async function updateProduct(product: EditProductInput): Promise<void> {
  const res = await fetch(`/api/products/${product.productId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  if (!res.ok) {
    throw new Error("Failed to update product");
  }
}

export default function ProductsPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form state for new product
  const [newProduct, setNewProduct] = useState<CreateProductInput>({
    materialName: "",
    finishType: "",
    supplier: "",
    dimensions: "",
    unitType: "m²",
    buyPricePerUnit: 0,
  });

  // Form state for editing product
  const [editProduct, setEditProduct] = useState<EditProductInput | null>(null);

  const {
    data: products = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsCreateModalOpen(false);
      setNewProduct({
        materialName: "",
        finishType: "",
        supplier: "",
        dimensions: "",
        unitType: "m²",
        buyPricePerUnit: 0,
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsEditModalOpen(false);
      setEditProduct(null);
    },
  });

  const handleCreateProduct = () => {
    if (!newProduct.materialName || !newProduct.finishType || !newProduct.supplier) {
      alert(t("validation.fillAllFields"));
      return;
    }
    createProductMutation.mutate(newProduct);
  };

  const handleEditProduct = (product: ProductWithAnalytics) => {
    setEditProduct({
      productId: product.productId,
      materialName: product.materialName,
      finishType: product.finishType,
      supplier: product.supplier,
      dimensions: product.dimensions,
      unitType: product.unitType as UnitType,
      buyPricePerUnit: product.buyPricePerUnit,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = () => {
    if (!editProduct) return;
    if (!editProduct.materialName || !editProduct.finishType || !editProduct.supplier) {
      alert(t("validation.fillAllFields"));
      return;
    }
    updateProductMutation.mutate(editProduct);
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (product.materialName || "").toLowerCase().includes(searchLower) ||
      (product.supplier || "").toLowerCase().includes(searchLower) ||
      (product.finishType || "").toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">{t("common.loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-400">{t("common.error")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-100">
            {t("product.products")}
          </h1>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={20} />
            {t("product.createNew")}
          </Button>
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
              className="w-full border border-gray-600 rounded-md pl-10 pr-4 py-2 bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </Card>

        {/* Products Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-300">
                    {t("product.materialName")}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-300">
                    {t("product.finishType")}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-300">
                    {t("product.supplier")}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-300">
                    {t("product.dimensions")}
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-300">
                    {t("product.buyPrice")}
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-300">
                    Orders
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-300">
                    {t("calculation.totalRevenue")}
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-300">
                    {t("calculation.profit")}
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-300">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.productId}
                    className="border-b border-gray-700 hover:bg-gray-700"
                  >
                    <td className="py-4 px-4 font-medium text-gray-100">
                      {product.materialName || <span className="text-gray-500 italic">No name</span>}
                    </td>
                    <td className="py-4 px-4 text-gray-300">
                      {product.finishType}
                    </td>
                    <td className="py-4 px-4 text-gray-300">
                      {product.supplier}
                    </td>
                    <td className="py-4 px-4 text-gray-300">
                      {product.dimensions}
                    </td>
                    <td className="py-4 px-4 text-right text-gray-300">
                      {formatCurrency(product.buyPricePerUnit)}/{product.unitType}
                    </td>
                    <td className="py-4 px-4 text-center text-gray-300">
                      {product.timesOrdered}
                    </td>
                    <td className="py-4 px-4 text-right text-green-400 font-medium">
                      {formatCurrency(product.totalRevenue)}
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-blue-400">
                      {formatCurrency(product.totalProfit)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-600 rounded-md transition-colors"
                        title={t("common.edit")}
                      >
                        <Pencil size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-400">
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

      {/* Edit Product Modal */}
      {editProduct && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditProduct(null);
          }}
          title={t("common.edit") + " " + t("product.title")}
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditProduct(null);
                }}
                className="flex-1"
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleUpdateProduct}
                className="flex-1"
                disabled={updateProductMutation.isPending}
              >
                {updateProductMutation.isPending ? t("common.loading") : t("common.save")}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label={t("product.materialName")}
              value={editProduct.materialName}
              onChange={(e) =>
                setEditProduct({ ...editProduct, materialName: e.target.value })
              }
              placeholder="e.g., HEX CARRARA"
            />
            <Input
              label={t("product.finishType")}
              value={editProduct.finishType}
              onChange={(e) =>
                setEditProduct({ ...editProduct, finishType: e.target.value })
              }
              placeholder="e.g., Matt, Glossy"
            />
            <Input
              label={t("product.supplier")}
              value={editProduct.supplier}
              onChange={(e) =>
                setEditProduct({ ...editProduct, supplier: e.target.value })
              }
              placeholder="e.g., Vitra"
            />
            <Input
              label={t("product.dimensions")}
              value={editProduct.dimensions}
              onChange={(e) =>
                setEditProduct({ ...editProduct, dimensions: e.target.value })
              }
              placeholder="e.g., 45x52"
            />
            <Select
              label={t("product.unitType")}
              value={editProduct.unitType}
              onChange={(e) =>
                setEditProduct({ ...editProduct, unitType: e.target.value as UnitType })
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
              value={editProduct.buyPricePerUnit || ""}
              onChange={(e) =>
                setEditProduct({
                  ...editProduct,
                  buyPricePerUnit: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="e.g., 8.50"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
