export interface VendorPayment {
  _id: string;
  order_id: {
    _id: string;
    order_id: string;
    total_amount: number;
    user_name: string;
  } | null;
  vendor_id: string;
  vendor_amount: number;
  payment_status: 'pending' | 'released' | 'failed' | 'cancelled';
  delivered_at: string;
  release_date: string;
  released_at?: string;
  released_by?: 'admin' | 'system';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  vendor_info?: {
    full_name: string;
    business_name: string;
    email: string;
    number: string;
  };
}

// Helper interface for safe order info handling
export interface SafeOrderInfo {
  order_id: string;
  user_name: string;
  total_amount: number;
}

export interface VendorPaymentStats {
  pending: {
    count: number;
    amount: number;
  };
  released: {
    count: number;
    amount: number;
  };
  failed: {
    count: number;
    amount: number;
  };
  cancelled: {
    count: number;
    amount: number;
  };
}

export interface VendorPaymentResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    payments: VendorPayment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface VendorPaymentStatsResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    stats: VendorPaymentStats;
  };
}

export interface ReleasePaymentResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    payment?: VendorPayment;
    releasedCount?: number;
    payments?: any[];
  };
}

// Tree table data structure for display
export interface VendorPaymentTreeData {
  id: string;
  name: string;
  type: 'vendor' | 'payment';
  vendorId?: string;
  vendorName?: string;
  orderNumber?: string;
  customerName?: string;
  totalAmount?: number;
  vendorAmount?: number;
  paymentStatus?: string;
  deliveredAt?: string;
  releaseDate?: string;
  releasedAt?: string;
  releasedBy?: string;
  notes?: string;
  formattedAmount?: string;
  formattedVendorAmount?: string;
  originalData?: VendorPayment;
  children?: VendorPaymentTreeData[];
  path?: string[];
  vendorTotalAmount?: number;
  vendorPaymentCount?: number;
}