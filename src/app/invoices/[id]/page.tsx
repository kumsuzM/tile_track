"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Edit2, Save, Plus, Package, Check } from "lucide-react";

interface OrderProduct {
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
}

interface Order {
  orderId: number;
  invoiceNumber: string;
  notes: string | null;
  products: OrderProduct[];
}

interface InvoiceDetail {
  invoiceNumber: string;
  fob: number;
  invoiceDate: string;
  client: string;
  status: string;
  deliveryLocation: string;
  estimatedDeliveryDate: string;
  actualDeliveryDate: string | null;
  orders: Order[];
}

interface Product {
  product_id: number;
  material_name: string;
  finish_type: string;
  supplier: string;
  dimensions: string;
  unit_type: string;
  buy_price_per_unit: number;
}

const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

const getStatusColor = (status: string) => {
  switch (status) {
    case "shipped":
      return "bg-green-900 text-green-300";
    case "completed":
      return "bg-blue-900 text-blue-300";
    case "booked":
      return "bg-yellow-900 text-yellow-300";
    case "in manufacturing":
      return "bg-orange-900 text-orange-300";
    case "scheduled":
      return "bg-gray-700 text-gray-300";
    default:
      return "bg-gray-700 text-gray-300";
  }
};

const STATUSES = ["scheduled", "in manufacturing", "booked", "shipped", "completed"];

// API functions
const fetchInvoice = async (id: string): Promise<InvoiceDetail> => {
  const res = await fetch(`/api/invoices/${id}`);
  if (!res.ok) throw new Error("Failed to fetch invoice");
  return res.json();
};

const fetchProducts = async (): Promise<Product[]> => {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
};

export default function InvoiceDetailPage() {
  const t = useTranslations();
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();

  // Queries
  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => fetchInvoice(id),
    enabled: !!id,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  // Local state for UI
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<InvoiceDetail>>({});
  const [addingProductToOrder, setAddingProductToOrder] = useState<number | null>(null);
  const [editingOrderNotes, setEditingOrderNotes] = useState<number | null>(null);
  const [orderNotesValue, setOrderNotesValue] = useState("");
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [productEditForm, setProductEditForm] = useState({
    numberOfCrates: 0,
    piecesPerCrate: 0,
    unitsPerCrate: "0",
    sellPricePerUnit: "0",
  });
  const [newProduct, setNewProduct] = useState({
    productId: 0,
    numberOfCrates: 1,
    piecesPerCrate: 1,
    unitsPerCrate: "1",
    sellPricePerUnit: "0",
  });

  // Mutations
  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: Partial<InvoiceDetail>) => {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update invoice");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setIsEditing(false);
    },
  });

  const addOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceNumber: id, notes: "" }),
      });
      if (!res.ok) throw new Error("Failed to add order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
    },
  });

  const updateOrderNotesMutation = useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: number; notes: string }) => {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, notes }),
      });
      if (!res.ok) throw new Error("Failed to update order notes");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      setEditingOrderNotes(null);
    },
  });

  const addProductToOrderMutation = useMutation({
    mutationFn: async (data: {
      orderId: number;
      productId: number;
      numberOfCrates: number;
      piecesPerCrate: number;
      unitsPerCrate: number;
      sellPricePerUnit: number;
    }) => {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setAddingProductToOrder(null);
      setNewProduct({
        productId: 0,
        numberOfCrates: 1,
        piecesPerCrate: 1,
        unitsPerCrate: "1",
        sellPricePerUnit: "0",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: {
      orderProductId: number;
      numberOfCrates: number;
      piecesPerCrate: number;
      unitsPerCrate: number;
      sellPricePerUnit: number;
    }) => {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setEditingProduct(null);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (orderProductId: number) => {
      const res = await fetch(`/api/orders?orderProductId=${orderProductId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  // Handlers
  const handleSaveInvoice = () => {
    updateInvoiceMutation.mutate({
      fob: editForm.fob,
      invoiceDate: editForm.invoiceDate,
      client: editForm.client,
      status: editForm.status,
      deliveryLocation: editForm.deliveryLocation,
      estimatedDeliveryDate: editForm.estimatedDeliveryDate,
      actualDeliveryDate: editForm.actualDeliveryDate,
    });
  };

  const handleAddProductToOrder = (orderId: number) => {
    if (!newProduct.productId) {
      alert("Please select a product");
      return;
    }
    addProductToOrderMutation.mutate({
      orderId,
      productId: newProduct.productId,
      numberOfCrates: newProduct.numberOfCrates,
      piecesPerCrate: newProduct.piecesPerCrate,
      unitsPerCrate: parseFloat(newProduct.unitsPerCrate),
      sellPricePerUnit: parseFloat(newProduct.sellPricePerUnit),
    });
  };

  const handleUpdateProduct = (orderProductId: number) => {
    updateProductMutation.mutate({
      orderProductId,
      numberOfCrates: productEditForm.numberOfCrates,
      piecesPerCrate: productEditForm.piecesPerCrate,
      unitsPerCrate: parseFloat(productEditForm.unitsPerCrate),
      sellPricePerUnit: parseFloat(productEditForm.sellPricePerUnit),
    });
  };

  const handleDeleteProduct = (orderProductId: number) => {
    if (!confirm("Are you sure you want to remove this product?")) return;
    deleteProductMutation.mutate(orderProductId);
  };

  const startEditingProduct = (product: OrderProduct) => {
    setEditingProduct(product.orderProductId);
    setProductEditForm({
      numberOfCrates: product.numberOfCrates,
      piecesPerCrate: product.piecesPerCrate,
      unitsPerCrate: product.unitsPerCrate.toString(),
      sellPricePerUnit: product.sellPricePerUnit.toString(),
    });
  };

  const startEditingInvoice = () => {
    if (invoice) {
      setEditForm(invoice);
      setIsEditing(true);
    }
  };

  // Calculations
  const calculateProductRevenue = (product: OrderProduct) => {
    return product.numberOfCrates * product.unitsPerCrate * product.sellPricePerUnit;
  };

  const calculateProductExpense = (product: OrderProduct) => {
    return product.numberOfCrates * product.unitsPerCrate * product.buyPricePerUnit;
  };

  const calculateOrderTotals = (order: Order) => {
    let revenue = 0;
    let expense = 0;
    order.products.forEach((p) => {
      revenue += calculateProductRevenue(p);
      expense += calculateProductExpense(p);
    });
    return { revenue, expense, profit: revenue - expense };
  };

  const calculateInvoiceTotals = () => {
    if (!invoice) return { totalRevenue: 0, totalExpense: 0, profit: 0, profitMargin: 0, totalProductCost: 0 };

    let totalRevenue = 0;
    let totalProductCost = 0;

    invoice.orders.forEach((order) => {
      order.products.forEach((product) => {
        totalRevenue += calculateProductRevenue(product);
        totalProductCost += calculateProductExpense(product);
      });
    });

    const totalExpense = totalProductCost + invoice.fob;
    const profit = totalRevenue - totalExpense;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalExpense, profit, profitMargin, totalProductCost };
  };

  if (invoiceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">{t("common.loading")}</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">{t("invoice.notFound")}</div>
      </div>
    );
  }

  const totals = calculateInvoiceTotals();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg shadow p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-100">{t("invoice.title")} #{invoice.invoiceNumber}</h2>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                {t(`status.${invoice.status === "in manufacturing" ? "inManufacturing" : invoice.status}`)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-gray-400 hover:text-gray-100"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={handleSaveInvoice}
                    disabled={updateInvoiceMutation.isPending}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save size={16} />
                    {updateInvoiceMutation.isPending ? t("common.loading") : t("common.save")}
                  </button>
                </>
              ) : (
                <button
                  onClick={startEditingInvoice}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-600 rounded text-gray-300 hover:bg-gray-700"
                >
                  <Edit2 size={16} />
                  {t("common.edit")} {t("invoice.title")}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Information */}
        <div className="bg-gray-800 rounded-lg shadow p-6 mb-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-100">{t("invoice.information")}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("invoice.client")}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.client || ""}
                  onChange={(e) => setEditForm({ ...editForm, client: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="font-medium text-gray-100">{invoice.client}</div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("invoice.date")}</label>
              {isEditing ? (
                <input
                  type="date"
                  value={editForm.invoiceDate || ""}
                  onChange={(e) => setEditForm({ ...editForm, invoiceDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="font-medium text-gray-100">{invoice.invoiceDate}</div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("invoice.status")}</label>
              {isEditing ? (
                <select
                  value={editForm.status || ""}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                  {invoice.status}
                </span>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("invoice.deliveryLocation")}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.deliveryLocation || ""}
                  onChange={(e) => setEditForm({ ...editForm, deliveryLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="font-medium text-gray-100">{invoice.deliveryLocation}</div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("invoice.fob")}</label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.01"
                  value={editForm.fob || 0}
                  onChange={(e) => setEditForm({ ...editForm, fob: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="font-medium text-gray-100">{formatCurrency(invoice.fob)}</div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("invoice.estimatedDelivery")}</label>
              {isEditing ? (
                <input
                  type="date"
                  value={editForm.estimatedDeliveryDate || ""}
                  onChange={(e) => setEditForm({ ...editForm, estimatedDeliveryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="font-medium text-gray-100">{invoice.estimatedDeliveryDate}</div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("invoice.actualDelivery")}</label>
              {isEditing ? (
                <input
                  type="date"
                  value={editForm.actualDeliveryDate || ""}
                  onChange={(e) => setEditForm({ ...editForm, actualDeliveryDate: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="font-medium text-gray-100">{invoice.actualDeliveryDate || t("invoice.notDelivered")}</div>
              )}
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-100">{t("invoice.ordersProducts")} ({invoice.orders.length})</h3>
            <button
              onClick={() => addOrderMutation.mutate()}
              disabled={addOrderMutation.isPending}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus size={16} />
              {addOrderMutation.isPending ? t("common.loading") : t("common.add") + " " + t("order.title")}
            </button>
          </div>

          {invoice.orders.length === 0 ? (
            <div className="bg-gray-800 rounded-lg shadow p-8 text-center text-gray-400">
              <Package size={48} className="mx-auto mb-4 text-gray-500" />
              <p>{t("order.noOrders")}</p>
            </div>
          ) : (
            invoice.orders.map((order, orderIndex) => {
              const orderTotals = calculateOrderTotals(order);
              return (
                <div key={order.orderId} className="bg-gray-800 rounded-lg shadow mb-4">
                  {/* Order Header */}
                  <div className="p-4 border-b border-gray-700 bg-gray-900 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-100">Order #{orderIndex + 1}</h4>
                          {editingOrderNotes !== order.orderId && (
                            <button
                              onClick={() => {
                                setEditingOrderNotes(order.orderId);
                                setOrderNotesValue(order.notes || "");
                              }}
                              className="text-gray-400 hover:text-gray-200"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                        </div>
                        {editingOrderNotes === order.orderId ? (
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="text"
                              value={orderNotesValue}
                              onChange={(e) => setOrderNotesValue(e.target.value)}
                              placeholder="Order notes..."
                              className="flex-1 px-2 py-1 text-sm border border-gray-600 rounded bg-gray-700 text-gray-100"
                            />
                            <button
                              onClick={() => updateOrderNotesMutation.mutate({ orderId: order.orderId, notes: orderNotesValue })}
                              disabled={updateOrderNotesMutation.isPending}
                              className="p-1 text-green-400 hover:text-green-300"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setEditingOrderNotes(null)}
                              className="p-1 text-gray-400 hover:text-gray-200"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : order.notes ? (
                          <p className="text-sm text-gray-400 mt-1">{order.notes}</p>
                        ) : (
                          <p className="text-sm text-gray-500 mt-1 italic">{t("invoice.noNotes")}</p>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-green-400">{t("calculation.revenue")}: {formatCurrency(orderTotals.revenue)}</div>
                        <div className="text-red-400">{t("calculation.expense")}: {formatCurrency(orderTotals.expense)}</div>
                        <div className={`font-semibold ${orderTotals.profit >= 0 ? "text-blue-400" : "text-red-400"}`}>
                          {t("calculation.profit")}: {formatCurrency(orderTotals.profit)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Products Table */}
                  <div className="p-4">
                    {order.products.length === 0 ? (
                      <p className="text-gray-400 text-center py-4">{t("order.noProducts")}</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full mb-4">
                          <thead>
                            <tr className="border-b border-gray-700 text-xs">
                              <th className="text-left py-2 px-2 font-medium text-gray-300">{t("product.title")}</th>
                              <th className="text-center py-2 px-2 font-medium text-gray-300">{t("product.crates")}</th>
                              <th className="text-center py-2 px-2 font-medium text-gray-300">{t("product.piecesPerCrate")}</th>
                              <th className="text-center py-2 px-2 font-medium text-gray-300">{t("product.unitsPerCrate")}</th>
                              <th className="text-right py-2 px-2 font-medium text-gray-300">{t("product.buyPrice")}</th>
                              <th className="text-right py-2 px-2 font-medium text-gray-300">{t("product.sellPrice")}</th>
                              <th className="text-right py-2 px-2 font-medium text-gray-300">{t("calculation.revenue")}</th>
                              <th className="text-right py-2 px-2 font-medium text-gray-300">{t("calculation.expense")}</th>
                              <th className="text-right py-2 px-2 font-medium text-gray-300">{t("calculation.profit")}</th>
                              <th className="w-16" />
                            </tr>
                          </thead>
                          <tbody>
                            {order.products.map((product) => {
                              const isEditingThis = editingProduct === product.orderProductId;
                              const revenue = isEditingThis
                                ? parseFloat(productEditForm.numberOfCrates.toString()) *
                                  parseFloat(productEditForm.unitsPerCrate) *
                                  parseFloat(productEditForm.sellPricePerUnit)
                                : calculateProductRevenue(product);
                              const expense = isEditingThis
                                ? parseFloat(productEditForm.numberOfCrates.toString()) *
                                  parseFloat(productEditForm.unitsPerCrate) *
                                  product.buyPricePerUnit
                                : calculateProductExpense(product);
                              const profit = revenue - expense;

                              return (
                                <tr key={product.orderProductId} className="border-b border-gray-700 hover:bg-gray-700 text-sm">
                                  <td className="py-2 px-2">
                                    <div className="font-medium text-gray-100">{product.materialName}</div>
                                    <div className="text-xs text-gray-400">
                                      {product.dimensions} - {product.finishType}
                                    </div>
                                  </td>
                                  <td className="text-center py-2 px-2 text-gray-300">
                                    {isEditingThis ? (
                                      <input
                                        type="number"
                                        min="1"
                                        value={productEditForm.numberOfCrates}
                                        onChange={(e) => setProductEditForm({ ...productEditForm, numberOfCrates: parseInt(e.target.value) || 0 })}
                                        className="w-16 px-1 py-0.5 text-center text-sm border border-gray-600 rounded bg-gray-700 text-gray-100"
                                      />
                                    ) : (
                                      product.numberOfCrates
                                    )}
                                  </td>
                                  <td className="text-center py-2 px-2 text-gray-300">
                                    {isEditingThis ? (
                                      <input
                                        type="number"
                                        min="1"
                                        value={productEditForm.piecesPerCrate}
                                        onChange={(e) => setProductEditForm({ ...productEditForm, piecesPerCrate: parseInt(e.target.value) || 0 })}
                                        className="w-16 px-1 py-0.5 text-center text-sm border border-gray-600 rounded bg-gray-700 text-gray-100"
                                      />
                                    ) : (
                                      product.piecesPerCrate
                                    )}
                                  </td>
                                  <td className="text-center py-2 px-2 text-gray-300">
                                    {isEditingThis ? (
                                      <div className="flex items-center justify-center gap-1">
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={productEditForm.unitsPerCrate}
                                          onChange={(e) => setProductEditForm({ ...productEditForm, unitsPerCrate: e.target.value })}
                                          className="w-16 px-1 py-0.5 text-center text-sm border border-gray-600 rounded bg-gray-700 text-gray-100"
                                        />
                                        <span className="text-gray-400 text-xs">{product.unitType}</span>
                                      </div>
                                    ) : (
                                      <span>{product.unitsPerCrate} {product.unitType}</span>
                                    )}
                                  </td>
                                  <td className="text-right py-2 px-2 text-gray-300">
                                    <span>{formatCurrency(product.buyPricePerUnit)}</span>
                                    <span className="text-gray-500 text-xs">/{product.unitType}</span>
                                  </td>
                                  <td className="text-right py-2 px-2 text-gray-300">
                                    {isEditingThis ? (
                                      <div className="flex items-center justify-end gap-1">
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={productEditForm.sellPricePerUnit}
                                          onChange={(e) => setProductEditForm({ ...productEditForm, sellPricePerUnit: e.target.value })}
                                          className="w-20 px-1 py-0.5 text-right text-sm border border-gray-600 rounded bg-gray-700 text-gray-100"
                                        />
                                        <span className="text-gray-500 text-xs">/{product.unitType}</span>
                                      </div>
                                    ) : (
                                      <>
                                        <span>{formatCurrency(product.sellPricePerUnit)}</span>
                                        <span className="text-gray-500 text-xs">/{product.unitType}</span>
                                      </>
                                    )}
                                  </td>
                                  <td className="text-right py-2 px-2 text-green-400">{formatCurrency(revenue)}</td>
                                  <td className="text-right py-2 px-2 text-red-400">{formatCurrency(expense)}</td>
                                  <td className={`text-right py-2 px-2 font-medium ${profit >= 0 ? "text-blue-400" : "text-red-400"}`}>
                                    {formatCurrency(profit)}
                                  </td>
                                  <td className="py-2 px-2">
                                    <div className="flex items-center gap-1 justify-end">
                                      {isEditingThis ? (
                                        <>
                                          <button
                                            onClick={() => handleUpdateProduct(product.orderProductId)}
                                            disabled={updateProductMutation.isPending}
                                            className="p-1 text-green-400 hover:text-green-300"
                                          >
                                            <Check size={14} />
                                          </button>
                                          <button
                                            onClick={() => setEditingProduct(null)}
                                            className="p-1 text-gray-400 hover:text-gray-200"
                                          >
                                            <X size={14} />
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() => startEditingProduct(product)}
                                            className="p-1 text-gray-400 hover:text-blue-400"
                                          >
                                            <Edit2 size={14} />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteProduct(product.orderProductId)}
                                            disabled={deleteProductMutation.isPending}
                                            className="p-1 text-gray-400 hover:text-red-400"
                                          >
                                            <X size={14} />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Add Product Form */}
                    {addingProductToOrder === order.orderId ? (
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
                              Per Crate {newProduct.productId ? `(${products.find(p => p.product_id === newProduct.productId)?.unit_type || ''})` : ''}
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
                              Sell Price {newProduct.productId ? `(per ${products.find(p => p.product_id === newProduct.productId)?.unit_type || ''})` : ''}
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
                            onClick={() => setAddingProductToOrder(null)}
                            className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-100"
                          >
                            {t("common.cancel")}
                          </button>
                          <button
                            onClick={() => handleAddProductToOrder(order.orderId)}
                            disabled={addProductToOrderMutation.isPending}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            {addProductToOrderMutation.isPending ? t("common.loading") : t("order.addProduct")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingProductToOrder(order.orderId)}
                        className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
                      >
                        <Plus size={14} />
                        {t("order.addProduct")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Invoice Totals Summary */}
        <div className="bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-100">{t("calculation.subtotal")}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-900/50 p-4 rounded">
              <div className="text-sm text-green-400">{t("calculation.totalRevenue")}</div>
              <div className="text-2xl font-bold text-green-300">{formatCurrency(totals.totalRevenue)}</div>
            </div>
            <div className="bg-red-900/50 p-4 rounded">
              <div className="text-sm text-red-400">{t("calculation.totalExpense")}</div>
              <div className="text-2xl font-bold text-red-300">{formatCurrency(totals.totalProductCost)}</div>
            </div>
            <div className="bg-orange-900/50 p-4 rounded">
              <div className="text-sm text-orange-400">{t("invoice.fob")}</div>
              <div className="text-2xl font-bold text-orange-300">{formatCurrency(invoice.fob)}</div>
            </div>
            <div className={`p-4 rounded ${totals.profit >= 0 ? "bg-blue-900/50" : "bg-red-900/50"}`}>
              <div className={`text-sm ${totals.profit >= 0 ? "text-blue-400" : "text-red-400"}`}>{t("calculation.netProfit")}</div>
              <div className={`text-2xl font-bold ${totals.profit >= 0 ? "text-blue-300" : "text-red-300"}`}>
                {formatCurrency(totals.profit)}
              </div>
              <div className={`text-sm ${totals.profit >= 0 ? "text-blue-400" : "text-red-400"}`}>
                {totals.profitMargin.toFixed(1)}% {t("calculation.profitMargin").toLowerCase()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
