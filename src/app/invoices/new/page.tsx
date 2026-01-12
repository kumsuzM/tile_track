"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Package } from "lucide-react";
import { Button, Card, Input, Select } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import type { CreateInvoiceInput, InvoiceStatus } from "@/lib/types";

interface Product {
  product_id: number;
  material_name: string;
  finish_type: string;
  supplier: string;
  dimensions: string;
  unit_type: string;
  buy_price_per_unit: number;
}

interface OrderProduct {
  productId: number;
  materialName: string;
  dimensions: string;
  unitType: string;
  buyPricePerUnit: number;
  numberOfCrates: number;
  piecesPerCrate: number;
  unitsPerCrate: number;
  sellPricePerUnit: number;
}

interface Order {
  id: string;
  notes: string;
  products: OrderProduct[];
}

async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

async function createInvoiceWithOrders(data: {
  invoice: CreateInvoiceInput;
  orders: Order[];
}): Promise<{ invoiceNumber: string }> {
  // First create the invoice
  const invoiceRes = await fetch("/api/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data.invoice),
  });
  if (!invoiceRes.ok) throw new Error("Failed to create invoice");
  const invoiceData = await invoiceRes.json();

  // Then create each order with its products
  for (const order of data.orders) {
    // Create order
    const orderRes = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceNumber: invoiceData.invoiceNumber,
        notes: order.notes,
      }),
    });
    if (!orderRes.ok) throw new Error("Failed to create order");
    const orderData = await orderRes.json();

    // Add products to order
    for (const product of order.products) {
      const productRes = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.orderId,
          productId: product.productId,
          numberOfCrates: product.numberOfCrates,
          piecesPerCrate: product.piecesPerCrate,
          unitsPerCrate: product.unitsPerCrate,
          sellPricePerUnit: product.sellPricePerUnit,
        }),
      });
      if (!productRes.ok) throw new Error("Failed to add product to order");
    }
  }

  return invoiceData;
}

export default function NewInvoicePage() {
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [invoice, setInvoice] = useState<CreateInvoiceInput>({
    invoiceNumber: "",
    fob: 0,
    invoiceDate: new Date().toISOString().split("T")[0],
    client: "",
    status: "scheduled",
    deliveryLocation: "",
    estimatedDeliveryDate: "",
    actualDeliveryDate: null,
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [addingProductToOrder, setAddingProductToOrder] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    productId: 0,
    numberOfCrates: 1,
    piecesPerCrate: 1,
    unitsPerCrate: "1",
    sellPricePerUnit: "0",
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const createMutation = useMutation({
    mutationFn: createInvoiceWithOrders,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      router.push(`/invoices/${data.invoiceNumber}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoice.invoiceNumber || !invoice.client || !invoice.deliveryLocation) {
      alert(t("validation.fillAllFields"));
      return;
    }

    createMutation.mutate({ invoice, orders });
  };

  const addOrder = () => {
    setOrders([...orders, { id: crypto.randomUUID(), notes: "", products: [] }]);
  };

  const removeOrder = (orderId: string) => {
    setOrders(orders.filter((o) => o.id !== orderId));
  };

  const updateOrderNotes = (orderId: string, notes: string) => {
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, notes } : o)));
  };

  const addProductToOrder = (orderId: string) => {
    if (!newProduct.productId) {
      alert(t("validation.selectProduct"));
      return;
    }

    const product = products.find((p) => p.product_id === newProduct.productId);
    if (!product) return;

    const orderProduct: OrderProduct = {
      productId: product.product_id,
      materialName: product.material_name,
      dimensions: product.dimensions,
      unitType: product.unit_type,
      buyPricePerUnit: product.buy_price_per_unit,
      numberOfCrates: newProduct.numberOfCrates,
      piecesPerCrate: newProduct.piecesPerCrate,
      unitsPerCrate: parseFloat(newProduct.unitsPerCrate),
      sellPricePerUnit: parseFloat(newProduct.sellPricePerUnit),
    };

    setOrders(
      orders.map((o) =>
        o.id === orderId ? { ...o, products: [...o.products, orderProduct] } : o
      )
    );

    setAddingProductToOrder(null);
    setNewProduct({
      productId: 0,
      numberOfCrates: 1,
      piecesPerCrate: 1,
      unitsPerCrate: "1",
      sellPricePerUnit: "0",
    });
  };

  const removeProductFromOrder = (orderId: string, productIndex: number) => {
    setOrders(
      orders.map((o) =>
        o.id === orderId
          ? { ...o, products: o.products.filter((_, i) => i !== productIndex) }
          : o
      )
    );
  };

  const calculateProductRevenue = (product: OrderProduct) => {
    return product.numberOfCrates * product.unitsPerCrate * product.sellPricePerUnit;
  };

  const calculateProductCost = (product: OrderProduct) => {
    return product.numberOfCrates * product.unitsPerCrate * product.buyPricePerUnit;
  };

  const calculateOrderTotals = (order: Order) => {
    let revenue = 0;
    let cost = 0;
    order.products.forEach((p) => {
      revenue += calculateProductRevenue(p);
      cost += calculateProductCost(p);
    });
    return { revenue, cost, profit: revenue - cost };
  };

  const calculateTotals = () => {
    let totalRevenue = 0;
    let totalCost = 0;
    orders.forEach((order) => {
      const orderTotals = calculateOrderTotals(order);
      totalRevenue += orderTotals.revenue;
      totalCost += orderTotals.cost;
    });
    const totalExpense = totalCost + (invoice.fob || 0);
    return { totalRevenue, totalCost, totalExpense, profit: totalRevenue - totalExpense };
  };

  const statusOptions = [
    { value: "scheduled", label: t("status.scheduled") },
    { value: "in manufacturing", label: t("status.inManufacturing") },
    { value: "completed", label: t("status.completed") },
    { value: "booked", label: t("status.booked") },
    { value: "shipped", label: t("status.shipped") },
  ];

  const totals = calculateTotals();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-100">
            {t("invoice.createNew")}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Invoice Information */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-100">{t("invoice.information")}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t("invoice.invoiceNumber")}
                  value={invoice.invoiceNumber}
                  onChange={(e) =>
                    setInvoice({ ...invoice, invoiceNumber: e.target.value })
                  }
                  placeholder="e.g., JY02025000000001"
                  required
                />
                <Input
                  type="date"
                  label={t("invoice.date")}
                  value={invoice.invoiceDate}
                  onChange={(e) =>
                    setInvoice({ ...invoice, invoiceDate: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t("invoice.client")}
                  value={invoice.client}
                  onChange={(e) =>
                    setInvoice({ ...invoice, client: e.target.value })
                  }
                  placeholder="e.g., Ali Bey"
                  required
                />
                <Input
                  label={t("invoice.deliveryLocation")}
                  value={invoice.deliveryLocation}
                  onChange={(e) =>
                    setInvoice({ ...invoice, deliveryLocation: e.target.value })
                  }
                  placeholder="e.g., Ankara, Çankaya"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Select
                  label={t("invoice.status")}
                  value={invoice.status}
                  onChange={(e) =>
                    setInvoice({ ...invoice, status: e.target.value as InvoiceStatus })
                  }
                  options={statusOptions}
                />
                <Input
                  type="date"
                  label={t("invoice.estimatedDelivery")}
                  value={invoice.estimatedDeliveryDate}
                  onChange={(e) =>
                    setInvoice({ ...invoice, estimatedDeliveryDate: e.target.value })
                  }
                  required
                />
                <Input
                  type="number"
                  step="0.01"
                  label={t("invoice.fob")}
                  value={invoice.fob || ""}
                  onChange={(e) =>
                    setInvoice({ ...invoice, fob: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="e.g., 200.00"
                />
              </div>
            </div>
          </Card>

          {/* Orders Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-100">{t("invoice.ordersProducts")}</h2>
              <Button type="button" onClick={addOrder}>
                <Plus size={16} />
                {t("common.add")} {t("order.title")}
              </Button>
            </div>

            {orders.length === 0 ? (
              <Card className="p-8 text-center text-gray-400">
                <Package size={48} className="mx-auto mb-4 text-gray-500" />
                <p>{t("order.noOrders")}</p>
              </Card>
            ) : (
              orders.map((order, orderIndex) => {
                const orderTotals = calculateOrderTotals(order);
                return (
                  <Card key={order.id} className="mb-4">
                    {/* Order Header */}
                    <div className="p-4 border-b border-gray-700 bg-gray-900 rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <h3 className="font-semibold text-gray-100">{t("order.title")} #{orderIndex + 1}</h3>
                            <input
                              type="text"
                              value={order.notes}
                              onChange={(e) => updateOrderNotes(order.id, e.target.value)}
                              placeholder={t("invoice.notes") + "..."}
                              className="flex-1 px-2 py-1 text-sm border border-gray-600 rounded bg-gray-700 text-gray-100"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right text-sm">
                            <span className="text-green-400">{t("calculation.revenue")}: {formatCurrency(orderTotals.revenue)}</span>
                            <span className="mx-2 text-gray-500">|</span>
                            <span className={orderTotals.profit >= 0 ? "text-blue-400" : "text-red-400"}>
                              {t("calculation.profit")}: {formatCurrency(orderTotals.profit)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeOrder(order.id)}
                            className="p-1 text-gray-400 hover:text-red-400"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Products */}
                    <div className="p-4">
                      {order.products.length > 0 && (
                        <table className="w-full mb-4">
                          <thead>
                            <tr className="border-b border-gray-700 text-xs">
                              <th className="text-left py-2 px-2 font-medium text-gray-300">{t("product.title")}</th>
                              <th className="text-center py-2 px-2 font-medium text-gray-300">{t("product.crates")}</th>
                              <th className="text-center py-2 px-2 font-medium text-gray-300">{t("product.unitsPerCrate")}</th>
                              <th className="text-right py-2 px-2 font-medium text-gray-300">{t("product.buyPrice")}</th>
                              <th className="text-right py-2 px-2 font-medium text-gray-300">{t("product.sellPrice")}</th>
                              <th className="text-right py-2 px-2 font-medium text-gray-300">{t("calculation.revenue")}</th>
                              <th className="text-right py-2 px-2 font-medium text-gray-300">{t("calculation.profit")}</th>
                              <th className="w-10" />
                            </tr>
                          </thead>
                          <tbody>
                            {order.products.map((product, productIndex) => {
                              const revenue = calculateProductRevenue(product);
                              const cost = calculateProductCost(product);
                              const profit = revenue - cost;
                              return (
                                <tr key={productIndex} className="border-b border-gray-700 text-sm">
                                  <td className="py-2 px-2">
                                    <div className="font-medium text-gray-100">{product.materialName}</div>
                                    <div className="text-xs text-gray-400">{product.dimensions}</div>
                                  </td>
                                  <td className="text-center py-2 px-2 text-gray-300">{product.numberOfCrates}</td>
                                  <td className="text-center py-2 px-2 text-gray-300">{product.unitsPerCrate} {product.unitType}</td>
                                  <td className="text-right py-2 px-2 text-gray-300">{formatCurrency(product.buyPricePerUnit)}</td>
                                  <td className="text-right py-2 px-2 text-gray-300">{formatCurrency(product.sellPricePerUnit)}</td>
                                  <td className="text-right py-2 px-2 text-green-400">{formatCurrency(revenue)}</td>
                                  <td className={`text-right py-2 px-2 font-medium ${profit >= 0 ? "text-blue-400" : "text-red-400"}`}>
                                    {formatCurrency(profit)}
                                  </td>
                                  <td className="py-2 px-2">
                                    <button
                                      type="button"
                                      onClick={() => removeProductFromOrder(order.id, productIndex)}
                                      className="p-1 text-gray-400 hover:text-red-400"
                                    >
                                      <X size={14} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}

                      {/* Add Product Form */}
                      {addingProductToOrder === order.id ? (
                        <div className="bg-gray-900 p-4 rounded border border-gray-700">
                          <h5 className="font-medium mb-3 text-gray-100">{t("order.addProduct")}</h5>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div className="col-span-2 md:col-span-1">
                              <label className="block text-xs text-gray-400 mb-1">{t("product.title")}</label>
                              <select
                                value={newProduct.productId}
                                onChange={(e) => {
                                  const productId = parseInt(e.target.value);
                                  const selectedProduct = products.find((p) => p.product_id === productId);
                                  setNewProduct({
                                    ...newProduct,
                                    productId,
                                    sellPricePerUnit: selectedProduct
                                      ? (selectedProduct.buy_price_per_unit * 1.5).toFixed(2)
                                      : "0",
                                  });
                                }}
                                className="w-full px-2 py-1.5 text-sm border border-gray-600 rounded bg-gray-700 text-gray-100"
                              >
                                <option value={0}>{t("product.selectOrCreate")}</option>
                                {products.map((p) => (
                                  <option key={p.product_id} value={p.product_id}>
                                    {p.material_name} ({p.dimensions})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">{t("product.crates")}</label>
                              <input
                                type="number"
                                min="1"
                                value={newProduct.numberOfCrates}
                                onChange={(e) => setNewProduct({ ...newProduct, numberOfCrates: parseInt(e.target.value) || 1 })}
                                className="w-full px-2 py-1.5 text-sm border border-gray-600 rounded bg-gray-700 text-gray-100"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">{t("product.piecesPerCrate")}</label>
                              <input
                                type="number"
                                min="1"
                                value={newProduct.piecesPerCrate}
                                onChange={(e) => setNewProduct({ ...newProduct, piecesPerCrate: parseInt(e.target.value) || 1 })}
                                className="w-full px-2 py-1.5 text-sm border border-gray-600 rounded bg-gray-700 text-gray-100"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">
                                {t("product.unitsPerCrate")} {newProduct.productId ? `(${products.find(p => p.product_id === newProduct.productId)?.unit_type || ''})` : ''}
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={newProduct.unitsPerCrate}
                                onChange={(e) => setNewProduct({ ...newProduct, unitsPerCrate: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm border border-gray-600 rounded bg-gray-700 text-gray-100"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">
                                {t("product.sellPrice")} {newProduct.productId ? `(per ${products.find(p => p.product_id === newProduct.productId)?.unit_type || ''})` : ''}
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={newProduct.sellPricePerUnit}
                                onChange={(e) => setNewProduct({ ...newProduct, sellPricePerUnit: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm border border-gray-600 rounded bg-gray-700 text-gray-100"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-3">
                            <button
                              type="button"
                              onClick={() => setAddingProductToOrder(null)}
                              className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-100"
                            >
                              {t("common.cancel")}
                            </button>
                            <button
                              type="button"
                              onClick={() => addProductToOrder(order.id)}
                              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              {t("order.addProduct")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAddingProductToOrder(order.id)}
                          className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
                        >
                          <Plus size={14} />
                          {t("order.addProduct")}
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {/* Summary */}
          {orders.length > 0 && orders.some(o => o.products.length > 0) && (
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-100">{t("calculation.subtotal")}</h2>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-green-900/50 p-4 rounded">
                  <div className="text-sm text-green-400">{t("calculation.totalRevenue")}</div>
                  <div className="text-xl font-bold text-green-300">{formatCurrency(totals.totalRevenue)}</div>
                </div>
                <div className="bg-red-900/50 p-4 rounded">
                  <div className="text-sm text-red-400">{t("calculation.totalExpense")}</div>
                  <div className="text-xl font-bold text-red-300">{formatCurrency(totals.totalCost)}</div>
                </div>
                <div className="bg-orange-900/50 p-4 rounded">
                  <div className="text-sm text-orange-400">{t("invoice.fob")}</div>
                  <div className="text-xl font-bold text-orange-300">{formatCurrency(invoice.fob || 0)}</div>
                </div>
                <div className={`p-4 rounded ${totals.profit >= 0 ? "bg-blue-900/50" : "bg-red-900/50"}`}>
                  <div className={`text-sm ${totals.profit >= 0 ? "text-blue-400" : "text-red-400"}`}>{t("calculation.netProfit")}</div>
                  <div className={`text-xl font-bold ${totals.profit >= 0 ? "text-blue-300" : "text-red-300"}`}>
                    {formatCurrency(totals.profit)}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
              className="flex-1"
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
              {createMutation.isPending ? t("common.loading") : t("common.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
