export interface EndPointApi {
    sendOtp: string;
    login: string;
    register: string;
    logout: string;

    // Admin Auth
    adminLogin: string;
    adminRegister: string;
    getAllAdmins: string;
    getAllUsers: string;
    exportUsersExcel: string;
    exportUsersPDF: string;
    getAvailablePages: string;
    assignPermissions: string;
    getMyPermissions: string;
    uploadMetadataCsv: string;
    getMetadataJson: string;

    // Vendor Management
    getVendorList: string;
    updateVendorStatus: string;
    downloadVendorKycPdf: string;
    exportVendorsExcel: string;
    exportVendorsPDF: string;
    // Dropdowns
    getDropdowns: string;
    postDropdowns: string;
    updateDropdowns: string;
    deleteDropdowns: string;

    // Categories CRUD
    getCategoryList: string;
    postCategoryList: string;
    updateCategory: string;
    deleteCategory: string;
    bulkDeleteCategory: string;

    // Service Categories CRUD
    getServiceCategoryList: string;
    postServiceCategoryList: string;
    updateServiceCategory: string;
    deleteServiceCategory: string;
    bulkDeleteServiceCategory: string;

    // Subcategories CRUD
    getSubCategoryList: string;
    createSubCategory: string;
    updateSubCategory: string;
    deleteSubCategory: string;
    bulkDeleteSubCategory: string;

    // BLOG
    createBlog: string;
    getAllBlogs: string;
    getBlogById: string;
    updateBlog: string;
    deleteBlog: string;
    bulkDeleteBlog: string;

    // FAQ
    createFAQ: string;
    getAllFAQs: string;
    getFAQById: string;
    updateFAQ: string;
    deleteFAQ: string;
    bulkDeleteFAQ: string;

    // Listing Plan Purchases
    getAllListingPlans: string;
    getListingPlanById: string;
    createListingPlan: string;
    updateListingPlan: string;
    deleteListingPlan: string;
    getListingPlanOptions: string;
    exportAllPlansExcel: string;
    exportAllPlansPDF: string;
    getAllListingPurchases: string;
    exportListingPurchasesExcel: string;
    exportListingPurchasesPDF: string;

    // Dynamic Plans (Definitions)
    getAllPlans: string;
    getPlanById: string;
    createPlan: string;
    updatePlan: string;
    deletePlan: string;
    // Service Plans
    getAllServicePlans: string;
    createServicePlan: string;
    updateServicePlan: string;
    deleteServicePlan: string;
    getAllServiceListingPurchases: string;
    exportServiceListingPurchasesExcel: string;
    exportServiceListingPurchasesPDF: string;
    // Priority Plans
    getAllPriorityPlans: string;
    createPriorityPlan: string;
    updatePriorityPlan: string;
    deletePriorityPlan: string;
    getAllPriorityPurchases: string;
    exportPriorityPurchasesExcel: string;
    exportPriorityPurchasesPDF: string;
    // Service Priority Plans
    getAllServicePriorityPlans: string;
    createServicePriorityPlan: string;
    updateServicePriorityPlan: string;
    deleteServicePriorityPlan: string;
    getAllServicePriorityPurchases: string;
    exportServicePriorityPurchasesExcel: string;
    exportServicePriorityPurchasesPDF: string;
    // Rental Boost Plans
    getAllRentalBoostPlans: string;
    createRentalBoostPlan: string;
    updateRentalBoostPlan: string;
    deleteRentalBoostPlan: string;
    getAllRentalBoostPurchases: string;
    getAllGeneralPlanPurchases: string;
    exportRentalBoostPurchasesExcel: string;
    exportRentalBoostPurchasesPDF: string;

    // General Plans
    getAllGeneralPlans: string;
    createGeneralPlan: string;
    updateGeneralPlan: string;
    deleteGeneralPlan: string;


    // Vendor Products Approval
    getAllVendors: string;
    getVendorProducts: string;
    approveProduct: string;
    rejectProduct: string;
    bulkApproveProducts: string;
    bulkRejectProducts: string;

    // Quotes
    postAllQuotes: string;
    getQuoteById: string;
    updateQuote: string;
    changeQuoteStatus: string;
    getQuoteStatuses: string;

    // Vendor Payments
    getAllVendorPayments: string;
    getVendorPaymentStats: string;
    releasePayment: string;
    cancelPayment: string;
    releaseOrderPayment: string;
    releaseBulkPayments: string;
    releaseScheduledPayments: string;
    // Vendor Services Approval
    getAllServiceVendors: string;
    getVendorServices: string;
    approveService: string;
    bulkApproveServices: string;
    bulkRejectServices: string;
    
    // Vendor Wallets
    getAllVendorWallets: string;
    getVendorWalletDetails: string;
    getVendorWalletTransactions: string;
    exportVendorWalletsExcel: string;
    exportVendorWalletsPDF: string;
    // BANNERS
    createBanner: string;
    getAllBanners: string;
    getBannerById: string;
    updateBanner: string;
    deleteBanner: string;
    bulkDeleteBanner: string;

    // CONTACT US
    getAllContacts: string;
    getContactById: string;
    updateContactStatus: string;
    deleteContact: string;
    bulkDeleteContacts: string;

    // Dashboard Stats
    getDashboardStats: string;

    // Admin Orders
    adminRentOrders: string;
    adminSellOrders: string;
    exportWalletTransactionsPDF: string;

    // Vendor Reports
    getVendorReport: string;
    exportVendorReportExcel: string;
    exportVendorReportPDF: string;
    getVendorPlansReport: string;
    exportVendorPlansReportExcel: string;
    exportVendorPlansReportPDF: string;

    // Dynamic Pages
    getDynamicPageBySlug: string;
    upsertDynamicPage: string;

    // Settings
    getSetting: string;
    updateSetting: string;
}

const endPointApi: EndPointApi = {
    sendOtp: 'vendor/auth/send-otp',
    login: 'vendor/auth/vendor-login',
    register: 'auth/register',
    logout: 'auth/logout',

    // Admin Auth
    adminLogin: 'admin/login',
    adminRegister: 'admin/register',
    getAllAdmins: 'admin/all-admins',
    getAllUsers: 'admin/users',
    exportUsersExcel: 'export/users/excel',
    exportUsersPDF: 'export/users/pdf',
    getAvailablePages: 'admin/available-pages',
    assignPermissions: 'admin/assign-permissions',
    getMyPermissions: 'admin/my-permissions',
    uploadMetadataCsv: 'admin/metadata/upload-csv',
    getMetadataJson: 'admin/metadata/json',

    // Vendor Management
    getVendorList: 'vendor-kyc',
    updateVendorStatus: 'change-status',
    downloadVendorKycPdf: 'vendor-kyc/:id/download-pdf',
    exportVendorsExcel: 'export/vendors/excel',
    exportVendorsPDF: 'export/vendors/pdf',

    // Dropdowns
    getDropdowns: 'dropdowns',
    postDropdowns: 'dropdowns',
    updateDropdowns: 'dropdowns',
    deleteDropdowns: 'dropdowns',

    // Categories CRUD
    getCategoryList: 'categories/getall',
    postCategoryList: 'categories/create-category',
    updateCategory: 'categories/update',
    deleteCategory: 'categories/delete',
    bulkDeleteCategory: 'categories/bulk-delete',

    // Service Categories CRUD
    getServiceCategoryList: 'service-categories/getall',
    postServiceCategoryList: 'service-categories/create-category',
    updateServiceCategory: 'service-categories/update',
    deleteServiceCategory: 'service-categories/delete',
    bulkDeleteServiceCategory: 'service-categories/bulk-delete',

    // Subcategories CRUD
    getSubCategoryList: 'subcategories/getall',
    createSubCategory: 'subcategories/create-subcategory',
    updateSubCategory: 'subcategories/update',
    deleteSubCategory: 'subcategories/delete',
    bulkDeleteSubCategory: 'subcategories/bulk-delete',

    // BLOG
    createBlog: 'blogs/create-blogs',
    getAllBlogs: 'blogs/getall',
    getBlogById: 'blogs/getById',
    updateBlog: 'blogs/update',
    deleteBlog: 'blogs/delete',
    bulkDeleteBlog: 'blogs/bulk-delete',

    // FAQ
    createFAQ: 'faqs/create-faq',
    getAllFAQs: 'faqs/getall',
    getFAQById: 'faqs/getById',
    updateFAQ: 'faqs/update',
    deleteFAQ: 'faqs/delete',
    bulkDeleteFAQ: 'faqs/bulk-delete',

    // Listing Plan Purchases
    getAllListingPlans: 'listing-plans/getall',
    getListingPlanById: 'listing-plans/getById',
    createListingPlan: 'listing-plans/create',
    updateListingPlan: 'listing-plans/update',
    deleteListingPlan: 'listing-plans/delete',
    getListingPlanOptions: 'listing-plans/options',
    exportAllPlansExcel: 'export/all-plan-purchases/excel',
    exportAllPlansPDF: 'export/all-plan-purchases/pdf',
    getAllListingPurchases: 'listing-plans/purchases/getall',
    exportListingPurchasesExcel: 'export/listing-purchases/excel',
    exportListingPurchasesPDF: 'export/listing-purchases/pdf',

    // Dynamic Plans (Definitions)
    getAllPlans: 'plans/getall',
    getPlanById: 'plans/getById',
    createPlan: 'plans/create',
    updatePlan: 'plans/update',
    deletePlan: 'plans/delete',
    // Service Plans
    getAllServicePlans: 'service-plans/getall',
    createServicePlan: 'service-plans/create',
    updateServicePlan: 'service-plans/update',
    deleteServicePlan: 'service-plans/delete',
    getAllServiceListingPurchases: 'service-listing-plans/purchases/getall',
    exportServiceListingPurchasesExcel: 'export/service-listing-purchases/excel',
    exportServiceListingPurchasesPDF: 'export/service-listing-purchases/pdf',
    // Priority Plans
    getAllPriorityPlans: 'priority-plans/getall',
    createPriorityPlan: 'priority-plans/create',
    updatePriorityPlan: 'priority-plans/update',
    deletePriorityPlan: 'priority-plans/delete',
    getAllPriorityPurchases: 'priority-plans/purchases/getall',
    exportPriorityPurchasesExcel: 'export/priority-purchases/excel',
    exportPriorityPurchasesPDF: 'export/priority-purchases/pdf',
    // Service Priority Plans
    getAllServicePriorityPlans: 'service-priority-plans/getall',
    createServicePriorityPlan: 'service-priority-plans/create',
    updateServicePriorityPlan: 'service-priority-plans/update',
    deleteServicePriorityPlan: 'service-priority-plans/delete',
    getAllServicePriorityPurchases: 'service-priority-purchases/getall',
    exportServicePriorityPurchasesExcel: 'export/service-priority-purchases/excel',
    exportServicePriorityPurchasesPDF: 'export/service-priority-purchases/pdf',
    // Rental Boost Plans
    getAllRentalBoostPlans: 'rental-boost-plans/getall',
    createRentalBoostPlan: 'rental-boost-plans/create',
    updateRentalBoostPlan: 'rental-boost-plans/update',
    deleteRentalBoostPlan: 'rental-boost-plans/delete',
    getAllRentalBoostPurchases: 'rental-boost-plans/purchases/getall',
    getAllGeneralPlanPurchases: 'general-plans/getall-purchases',
    exportRentalBoostPurchasesExcel: 'export/rental-boost-purchases/excel',
    exportRentalBoostPurchasesPDF: 'export/rental-boost-purchases/pdf',
    
    // General Plans
    getAllGeneralPlans: 'general-plans/getall',
    createGeneralPlan: 'general-plans/create',
    updateGeneralPlan: 'general-plans/update',
    deleteGeneralPlan: 'general-plans/delete',


    // Vendor Products Approval
    getAllVendors: 'products/vendors/getall',
    getVendorProducts: 'products/vendor',
    approveProduct: 'products/approve',
    rejectProduct: 'products/approve', // Same endpoint, different approval_status
    bulkApproveProducts: 'products/bulk-approve',
    bulkRejectProducts: 'products/bulk-reject',

    // Quotes
    postAllQuotes: 'quote/getallforadmin',
    getQuoteById: 'quote/getById',
    updateQuote: 'quote/update',
    changeQuoteStatus: 'quote/change-status',
    getQuoteStatuses: 'quote/status-dropdown',

    // Vendor Payments
    getAllVendorPayments: 'vendor/payments/admin',
    getVendorPaymentStats: 'vendor/payments/admin/stats',
    releasePayment: 'vendor/payments/admin/:paymentId/release',
    cancelPayment: 'vendor/payments/admin/:paymentId/cancel',
    releaseOrderPayment: 'vendor/payments/admin/order/:orderId/vendor/:vendorId/release',
    releaseBulkPayments: 'vendor/payments/admin/release-bulk',
    releaseScheduledPayments: 'vendor/payments/admin/release-scheduled',
    // Vendor Services Approval
    getAllServiceVendors: 'services/vendors/getall',
    getVendorServices: 'services/vendor',
    approveService: 'services/approve',
    bulkApproveServices: 'services/bulk-approve',
    bulkRejectServices: 'services/bulk-reject',
    
    // Vendor Wallets
    getAllVendorWallets: 'admin/vendor-wallets',
    getVendorWalletDetails: 'admin/vendor-wallets/:vendorId',
    getVendorWalletTransactions: 'admin/vendor-wallets/:vendorId/transactions',
    exportVendorWalletsExcel: 'export/vendor-wallets/excel',
    exportVendorWalletsPDF: 'export/vendor-wallets/pdf',
    // BANNERS
    createBanner: 'banners/create-banner',
    getAllBanners: 'banners/getall',
    getBannerById: 'banners/getById',
    updateBanner: 'banners/update',
    deleteBanner: 'banners/delete',
    bulkDeleteBanner: 'banners/bulk-delete',

    // CONTACT US
    getAllContacts: 'contacts/getall',
    getContactById: 'contacts/getById',
    updateContactStatus: 'contacts/add-notes',
    deleteContact: 'contacts/delete',
    bulkDeleteContacts: 'contacts/bulk-delete',

    // Dashboard Stats
    getDashboardStats: 'admin/dashboard-stats',

    // Admin Orders
    adminRentOrders: 'admin/orders/rent',
    adminSellOrders: 'admin/orders/sell',
    exportWalletTransactionsPDF: 'export/wallet-transactions/pdf',

    // Vendor Reports
    getVendorReport: 'admin/vendor-report',
    exportVendorReportExcel: 'export/vendor-report/excel',
    exportVendorReportPDF: 'export/vendor-report/pdf',
    getVendorPlansReport: 'admin/vendor-plans-report',
    exportVendorPlansReportExcel: 'export/vendor-plans-report/excel',
    exportVendorPlansReportPDF: 'export/vendor-plans-report/pdf',

    // Dynamic Pages
    getDynamicPageBySlug: 'dynamic-pages/:slug',
    upsertDynamicPage: 'dynamic-pages',

    // Settings
    getSetting: 'settings/:key',
    updateSetting: 'settings/:key',
};

export default endPointApi;
