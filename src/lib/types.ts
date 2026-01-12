// Invoice status type
export type InvoiceStatus =
  | "scheduled"
  | "in manufacturing"
  | "completed"
  | "booked"
  | "shipped";

// Unit type for products
export type UnitType = "pieces" | "m²";

// Full invoice with orders and products for detail view
export interface InvoiceWithDetails {
  invoiceNumber: string;
  fob: number;
  invoiceDate: string;
  client: string;
  status: InvoiceStatus;
  deliveryLocation: string;
  estimatedDeliveryDate: string;
  actualDeliveryDate: string | null;
  createdAt: string;
  updatedAt: string;
  orders: OrderWithProducts[];
}

export interface OrderWithProducts {
  orderId: number;
  invoiceNumber: string;
  notes: string | null;
  products: OrderProductWithDetails[];
}

export interface OrderProductWithDetails {
  orderProductId: number;
  orderId: number;
  productId: number;
  numberOfCrates: number;
  piecesPerCrate: number;
  unitsPerCrate: number;
  sellPricePerUnit: number;
  // Product details
  materialName: string;
  finishType: string;
  supplier: string;
  dimensions: string;
  unitType: UnitType;
  buyPricePerUnit: number;
}

// Invoice summary from materialized view
export interface InvoiceSummary {
  invoiceNumber: string;
  invoiceDate: string;
  client: string;
  status: InvoiceStatus;
  deliveryLocation: string;
  estimatedDeliveryDate: string;
  actualDeliveryDate: string | null;
  fob: number;
  totalRevenue: number;
  totalExpense: number;
  profit: number;
  profitMargin: number;
  totalCrates: number;
  totalUnits: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

// Product with analytics from materialized view
export interface ProductWithAnalytics {
  productId: number;
  materialName: string;
  finishType: string;
  supplier: string;
  dimensions: string;
  unitType: UnitType;
  buyPricePerUnit: number;
  timesOrdered: number;
  totalCratesSold: number;
  totalUnitsSold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  avgSellPrice: number;
  createdAt: string;
}

// Basic product type
export interface Product {
  productId: number;
  materialName: string;
  finishType: string;
  supplier: string;
  dimensions: string;
  unitType: UnitType;
  buyPricePerUnit: number;
  createdAt: string;
  updatedAt: string;
}

// Form types for creating/editing
export interface CreateInvoiceInput {
  invoiceNumber: string;
  fob: number;
  invoiceDate: string;
  client: string;
  status: InvoiceStatus;
  deliveryLocation: string;
  estimatedDeliveryDate: string;
  actualDeliveryDate?: string | null;
}

export interface CreateProductInput {
  materialName: string;
  finishType: string;
  supplier: string;
  dimensions: string;
  unitType: UnitType;
  buyPricePerUnit: number;
}

export interface AddProductToOrderInput {
  productId: number;
  numberOfCrates: number;
  piecesPerCrate: number;
  unitsPerCrate: number;
  sellPricePerUnit: number;
}

// Dashboard stats
export interface DashboardStats {
  activeOrders: number;
  totalRevenue: number;
  totalProfit: number;
  avgProfitMargin: number;
}
