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
  monthlyCredits: {
    month: string;
    year: number;
    amount: number;
    count: number;
  }[];
  monthlyVendors: {
    month: string;
    year: number;
    count: number;
  }[];
  extras: {
    totalQuotes: number;
    totalContacts: number;
    totalBlogs: number;
    totalPlans: number;
  };
}
