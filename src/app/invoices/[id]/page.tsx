"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, X, Edit2, Save, Plus, Package, Check } from "lucide-react";

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
      return "bg-green-100 text-green-800";
    case "completed":
      return "bg-blue-100 text-blue-800";
    case "booked":
      return "bg-yellow-100 text-yellow-800";
    case "in manufacturing":
      return "bg-orange-100 text-orange-800";
    case "scheduled":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const STATUSES = ["scheduled", "in manufacturing", "booked", "shipped", "completed"];

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<InvoiceDetail>>({});
  const [addingProductToOrder, setAddingProductToOrder] = useState<number | null>(null);
  const [editingOrderNotes, setEditingOrderNotes] = useState<number | null>(null);
  const [orderNotesValue, setOrderNotesValue] = useState("");
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [productEditForm, setProductEditForm] = useState<{
    numberOfCrates: number;
    piecesPerCrate: number;
    unitsPerCrate: string;
    sellPricePerUnit: string;
  }>({ numberOfCrates: 0, piecesPerCrate: 0, unitsPerCrate: "0", sellPricePerUnit: "0" });
  const [newProduct, setNewProduct] = useState({
    productId: 0,
    numberOfCrates: 1,
    piecesPerCrate: 1,
    unitsPerCrate: "1",
    sellPricePerUnit: "0",
  });

  useEffect(() => {
    if (id) {
      fetchInvoice();
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
        setEditForm(data);
      }
    } catch (error) {
      console.error("Failed to fetch invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const handleSaveInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fob: editForm.fob,
          invoiceDate: editForm.invoiceDate,
          client: editForm.client,
          status: editForm.status,
          deliveryLocation: editForm.deliveryLocation,
          estimatedDeliveryDate: editForm.estimatedDeliveryDate,
          actualDeliveryDate: editForm.actualDeliveryDate,
        }),
      });

      if (res.ok) {
        setIsEditing(false);
        fetchInvoice();
      }
    } catch (error) {
      console.error("Failed to update invoice:", error);
    }
  };

  const handleAddOrder = async () => {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: id,
          notes: "",
        }),
      });

      if (res.ok) {
        fetchInvoice();
      }
    } catch (error) {
      console.error("Failed to add order:", error);
    }
  };

  const handleUpdateOrderNotes = async (orderId: number) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          notes: orderNotesValue,
        }),
      });

      if (res.ok) {
        setEditingOrderNotes(null);
        fetchInvoice();
      }
    } catch (error) {
      console.error("Failed to update order notes:", error);
    }
  };

  const handleAddProductToOrder = async (orderId: number) => {
    if (!newProduct.productId) {
      alert("Please select a product");
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          productId: newProduct.productId,
          numberOfCrates: newProduct.numberOfCrates,
          piecesPerCrate: newProduct.piecesPerCrate,
          unitsPerCrate: parseFloat(newProduct.unitsPerCrate),
          sellPricePerUnit: parseFloat(newProduct.sellPricePerUnit),
        }),
      });

      if (res.ok) {
        setAddingProductToOrder(null);
        setNewProduct({
          productId: 0,
          numberOfCrates: 1,
          piecesPerCrate: 1,
          unitsPerCrate: "1",
          sellPricePerUnit: "0",
        });
        fetchInvoice();
      }
    } catch (error) {
      console.error("Failed to add product:", error);
    }
  };

  const handleUpdateProduct = async (orderProductId: number) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderProductId,
          numberOfCrates: productEditForm.numberOfCrates,
          piecesPerCrate: productEditForm.piecesPerCrate,
          unitsPerCrate: parseFloat(productEditForm.unitsPerCrate),
          sellPricePerUnit: parseFloat(productEditForm.sellPricePerUnit),
        }),
      });

      if (res.ok) {
        setEditingProduct(null);
        fetchInvoice();
      }
    } catch (error) {
      console.error("Failed to update product:", error);
    }
  };

  const handleDeleteProduct = async (orderProductId: number) => {
    if (!confirm("Are you sure you want to remove this product?")) return;

    try {
      const res = await fetch(`/api/orders?orderProductId=${orderProductId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchInvoice();
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Invoice not found</div>
      </div>
    );
  }

  const totals = calculateInvoiceTotals();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={20} />
                Back
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h2 className="text-xl font-semibold">Invoice #{invoice.invoiceNumber}</h2>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                {invoice.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm(invoice);
                    }}
                    className="px-3 py-1.5 text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveInvoice}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Save size={16} />
                    Save
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50"
                >
                  <Edit2 size={16} />
                  Edit Invoice
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h3 className="text-lg font-semibold mb-4">Invoice Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Client</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.client || ""}
                  onChange={(e) => setEditForm({ ...editForm, client: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="font-medium">{invoice.client}</div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Invoice Date</label>
              {isEditing ? (
                <input
                  type="date"
                  value={editForm.invoiceDate || ""}
                  onChange={(e) => setEditForm({ ...editForm, invoiceDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="font-medium">{invoice.invoiceDate}</div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              {isEditing ? (
                <select
                  value={editForm.status || ""}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm text-gray-600 mb-1">Delivery Location</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.deliveryLocation || ""}
                  onChange={(e) => setEditForm({ ...editForm, deliveryLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="font-medium">{invoice.deliveryLocation}</div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">FOB (Shipping Cost)</label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.01"
                  value={editForm.fob || 0}
                  onChange={(e) => setEditForm({ ...editForm, fob: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="font-medium">{formatCurrency(invoice.fob)}</div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Est. Delivery</label>
              {isEditing ? (
                <input
                  type="date"
                  value={editForm.estimatedDeliveryDate || ""}
                  onChange={(e) => setEditForm({ ...editForm, estimatedDeliveryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="font-medium">{invoice.estimatedDeliveryDate}</div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Actual Delivery</label>
              {isEditing ? (
                <input
                  type="date"
                  value={editForm.actualDeliveryDate || ""}
                  onChange={(e) => setEditForm({ ...editForm, actualDeliveryDate: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="font-medium">{invoice.actualDeliveryDate || "Not delivered yet"}</div>
              )}
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Orders ({invoice.orders.length})</h3>
            <button
              onClick={handleAddOrder}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Plus size={16} />
              Add Order
            </button>
          </div>

          {invoice.orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <Package size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No orders yet. Click &quot;Add Order&quot; to create one.</p>
            </div>
          ) : (
            invoice.orders.map((order, orderIndex) => {
              const orderTotals = calculateOrderTotals(order);
              return (
                <div key={order.orderId} className="bg-white rounded-lg shadow mb-4">
                  {/* Order Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">Order #{orderIndex + 1}</h4>
                          {editingOrderNotes !== order.orderId && (
                            <button
                              onClick={() => {
                                setEditingOrderNotes(order.orderId);
                                setOrderNotesValue(order.notes || "");
                              }}
                              className="text-gray-400 hover:text-gray-600"
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
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                            <button
                              onClick={() => handleUpdateOrderNotes(order.orderId)}
                              className="p-1 text-green-600 hover:text-green-800"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setEditingOrderNotes(null)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : order.notes ? (
                          <p className="text-sm text-gray-600 mt-1">{order.notes}</p>
                        ) : (
                          <p className="text-sm text-gray-400 mt-1 italic">No notes</p>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-green-700">Revenue: {formatCurrency(orderTotals.revenue)}</div>
                        <div className="text-red-700">Cost: {formatCurrency(orderTotals.expense)}</div>
                        <div className={`font-semibold ${orderTotals.profit >= 0 ? "text-blue-700" : "text-red-700"}`}>
                          Profit: {formatCurrency(orderTotals.profit)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Products Table */}
                  <div className="p-4">
                    {order.products.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No products in this order</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full mb-4">
                          <thead>
                            <tr className="border-b border-gray-200 text-xs">
                              <th className="text-left py-2 px-2 font-medium text-gray-700">Product</th>
                              <th className="text-center py-2 px-2 font-medium text-gray-700">Crates</th>
                              <th className="text-center py-2 px-2 font-medium text-gray-700">Pcs/Crate</th>
                              <th className="text-center py-2 px-2 font-medium text-gray-700">Per Crate</th>
                              <th className="text-right py-2 px-2 font-medium text-gray-700">Buy Price</th>
                              <th className="text-right py-2 px-2 font-medium text-gray-700">Sell Price</th>
                              <th className="text-right py-2 px-2 font-medium text-gray-700">Revenue</th>
                              <th className="text-right py-2 px-2 font-medium text-gray-700">Cost</th>
                              <th className="text-right py-2 px-2 font-medium text-gray-700">Profit</th>
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
                                <tr key={product.orderProductId} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                                  <td className="py-2 px-2">
                                    <div className="font-medium">{product.materialName}</div>
                                    <div className="text-xs text-gray-500">
                                      {product.dimensions} - {product.finishType}
                                    </div>
                                  </td>
                                  <td className="text-center py-2 px-2">
                                    {isEditingThis ? (
                                      <input
                                        type="number"
                                        min="1"
                                        value={productEditForm.numberOfCrates}
                                        onChange={(e) => setProductEditForm({ ...productEditForm, numberOfCrates: parseInt(e.target.value) || 0 })}
                                        className="w-16 px-1 py-0.5 text-center text-sm border border-gray-300 rounded"
                                      />
                                    ) : (
                                      product.numberOfCrates
                                    )}
                                  </td>
                                  <td className="text-center py-2 px-2">
                                    {isEditingThis ? (
                                      <input
                                        type="number"
                                        min="1"
                                        value={productEditForm.piecesPerCrate}
                                        onChange={(e) => setProductEditForm({ ...productEditForm, piecesPerCrate: parseInt(e.target.value) || 0 })}
                                        className="w-16 px-1 py-0.5 text-center text-sm border border-gray-300 rounded"
                                      />
                                    ) : (
                                      product.piecesPerCrate
                                    )}
                                  </td>
                                  <td className="text-center py-2 px-2">
                                    {isEditingThis ? (
                                      <div className="flex items-center justify-center gap-1">
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={productEditForm.unitsPerCrate}
                                          onChange={(e) => setProductEditForm({ ...productEditForm, unitsPerCrate: e.target.value })}
                                          className="w-16 px-1 py-0.5 text-center text-sm border border-gray-300 rounded"
                                        />
                                        <span className="text-gray-500 text-xs">{product.unitType}</span>
                                      </div>
                                    ) : (
                                      <span>{product.unitsPerCrate} {product.unitType}</span>
                                    )}
                                  </td>
                                  <td className="text-right py-2 px-2">
                                    <span>{formatCurrency(product.buyPricePerUnit)}</span>
                                    <span className="text-gray-400 text-xs">/{product.unitType}</span>
                                  </td>
                                  <td className="text-right py-2 px-2">
                                    {isEditingThis ? (
                                      <div className="flex items-center justify-end gap-1">
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={productEditForm.sellPricePerUnit}
                                          onChange={(e) => setProductEditForm({ ...productEditForm, sellPricePerUnit: e.target.value })}
                                          className="w-20 px-1 py-0.5 text-right text-sm border border-gray-300 rounded"
                                        />
                                        <span className="text-gray-400 text-xs">/{product.unitType}</span>
                                      </div>
                                    ) : (
                                      <>
                                        <span>{formatCurrency(product.sellPricePerUnit)}</span>
                                        <span className="text-gray-400 text-xs">/{product.unitType}</span>
                                      </>
                                    )}
                                  </td>
                                  <td className="text-right py-2 px-2 text-green-700">{formatCurrency(revenue)}</td>
                                  <td className="text-right py-2 px-2 text-red-700">{formatCurrency(expense)}</td>
                                  <td className={`text-right py-2 px-2 font-medium ${profit >= 0 ? "text-blue-700" : "text-red-700"}`}>
                                    {formatCurrency(profit)}
                                  </td>
                                  <td className="py-2 px-2">
                                    <div className="flex items-center gap-1 justify-end">
                                      {isEditingThis ? (
                                        <>
                                          <button
                                            onClick={() => handleUpdateProduct(product.orderProductId)}
                                            className="p-1 text-green-600 hover:text-green-800"
                                          >
                                            <Check size={14} />
                                          </button>
                                          <button
                                            onClick={() => setEditingProduct(null)}
                                            className="p-1 text-gray-400 hover:text-gray-600"
                                          >
                                            <X size={14} />
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() => startEditingProduct(product)}
                                            className="p-1 text-gray-400 hover:text-blue-600"
                                          >
                                            <Edit2 size={14} />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteProduct(product.orderProductId)}
                                            className="p-1 text-gray-400 hover:text-red-600"
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
                      <div className="bg-gray-50 p-4 rounded border border-gray-200">
                        <h5 className="font-medium mb-3">Add Product to Order</h5>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs text-gray-600 mb-1">Product</label>
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
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                            >
                              <option value={0}>Select product...</option>
                              {products.map((p) => (
                                <option key={p.product_id} value={p.product_id}>
                                  {p.material_name} ({p.dimensions})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Crates</label>
                            <input
                              type="number"
                              min="1"
                              value={newProduct.numberOfCrates}
                              onChange={(e) => setNewProduct({ ...newProduct, numberOfCrates: parseInt(e.target.value) || 1 })}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Pcs/Crate</label>
                            <input
                              type="number"
                              min="1"
                              value={newProduct.piecesPerCrate}
                              onChange={(e) => setNewProduct({ ...newProduct, piecesPerCrate: parseInt(e.target.value) || 1 })}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Per Crate {newProduct.productId ? `(${products.find(p => p.product_id === newProduct.productId)?.unit_type || ''})` : ''}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={newProduct.unitsPerCrate}
                              onChange={(e) => setNewProduct({ ...newProduct, unitsPerCrate: e.target.value })}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Sell Price {newProduct.productId ? `(per ${products.find(p => p.product_id === newProduct.productId)?.unit_type || ''})` : ''}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={newProduct.sellPricePerUnit}
                              onChange={(e) => setNewProduct({ ...newProduct, sellPricePerUnit: e.target.value })}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                          <button
                            onClick={() => setAddingProductToOrder(null)}
                            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleAddProductToOrder(order.orderId)}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Add Product
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingProductToOrder(order.orderId)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Plus size={14} />
                        Add Product
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Invoice Totals Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Invoice Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded">
              <div className="text-sm text-green-700">Total Revenue</div>
              <div className="text-2xl font-bold text-green-800">{formatCurrency(totals.totalRevenue)}</div>
            </div>
            <div className="bg-red-50 p-4 rounded">
              <div className="text-sm text-red-700">Product Cost</div>
              <div className="text-2xl font-bold text-red-800">{formatCurrency(totals.totalProductCost)}</div>
            </div>
            <div className="bg-orange-50 p-4 rounded">
              <div className="text-sm text-orange-700">FOB (Shipping)</div>
              <div className="text-2xl font-bold text-orange-800">{formatCurrency(invoice.fob)}</div>
            </div>
            <div className={`p-4 rounded ${totals.profit >= 0 ? "bg-blue-50" : "bg-red-50"}`}>
              <div className={`text-sm ${totals.profit >= 0 ? "text-blue-700" : "text-red-700"}`}>Net Profit</div>
              <div className={`text-2xl font-bold ${totals.profit >= 0 ? "text-blue-800" : "text-red-800"}`}>
                {formatCurrency(totals.profit)}
              </div>
              <div className={`text-sm ${totals.profit >= 0 ? "text-blue-600" : "text-red-600"}`}>
                {totals.profitMargin.toFixed(1)}% margin
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
