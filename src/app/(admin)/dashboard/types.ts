export interface TopVendor {
  _id: string;
  vendor_id: string;
  business_name: string;
  full_name: string;
  total_products: number;
  sell_products: number;
  rent_products: number;
}

export interface ChartDataPoint {
  label: string;
  amount: number;
  count: number;
}

export interface ChartVendorPoint {
  label: string;
  count: number;
}

export interface DashboardStats {
  vendors: {
    total: number;
    service: number;
    vendor: number;
    both: number;
    pending: number;
    approved: number;
    rejected: number;
    serviceApproved?: number;
    servicePending?: number;
    serviceRejected?: number;
    vendorApproved?: number;
    vendorPending?: number;
    vendorRejected?: number;
    bothApproved?: number;
    bothPending?: number;
    bothRejected?: number;
  };
  products: {
    total: number;
    sell: number;
    rent: number;
    pending: number;
    approved: number;
    rejected: number;
    sellApproved?: number;
    sellPending?: number;
    sellRejected?: number;
    rentApproved?: number;
    rentPending?: number;
    rentRejected?: number;
  };
  services: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  wallets: {
    totalBalance: number;
    totalCredited: number;
    totalDebited: number;
    vendorCount: number;
  };
  // New chart fields (range-aware)
  chartCredits: ChartDataPoint[];
  chartVendors: ChartVendorPoint[];
  // Legacy (kept for fallback)
  monthlyCredits?: ChartDataPoint[];
  monthlyVendors?: ChartVendorPoint[];
  revenueStats: {
    weekly: number;
    monthly: number;
    yearly: number;
  };
  extras: {
    totalQuotes: number;
    totalContacts: number;
    totalBlogs: number;
    totalPlans: number;
  };
  topVendors?: TopVendor[];
}
