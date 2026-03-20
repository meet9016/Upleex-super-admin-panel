export interface EndPointApi {
    sendOtp: string;
    login: string;
    register: string;
    logout: string;

    // Admin Auth
    adminLogin: string;
    adminRegister: string;
    getAllAdmins: string;
    getAvailablePages: string;
    assignPermissions: string;
    getMyPermissions: string;

    // Vendor Management
    getVendorList: string;
    updateVendorStatus: string;
    downloadVendorKycPdf: string;
    // Dropdowns
    getDropdowns: string;

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

    // Dynamic Plans (Definitions)
    getAllPlans: string;
    getPlanById: string;
    createPlan: string;
    updatePlan: string;
    deletePlan: string;
    // Priority Plans
    getAllPriorityPlans: string;
    createPriorityPlan: string;
    updatePriorityPlan: string;
    deletePriorityPlan: string;

    // Vendor Products Approval
    getAllVendors: string;
    getVendorProducts: string;
    approveProduct: string;
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
    releaseOrderPayment: string;
    releaseScheduledPayments: string;
    // Vendor Services Approval
    getAllServiceVendors: string;
    getVendorServices: string;
    approveService: string;
    bulkApproveServices: string;
    bulkRejectServices: string;
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
    getAvailablePages: 'admin/available-pages',
    assignPermissions: 'admin/assign-permissions',
    getMyPermissions: 'admin/my-permissions',

    // Vendor Management
    getVendorList: 'vendor-kyc',
    updateVendorStatus: 'change-status',
    downloadVendorKycPdf: 'vendor-kyc/:id/download-pdf',

    // Dropdowns
    getDropdowns: 'dropdowns',

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

    // Dynamic Plans (Definitions)
    getAllPlans: 'plans/getall',
    getPlanById: 'plans/getById',
    createPlan: 'plans/create',
    updatePlan: 'plans/update',
    deletePlan: 'plans/delete',
    // Priority Plans
    getAllPriorityPlans: 'priority-plans/getall',
    createPriorityPlan: 'priority-plans/create',
    updatePriorityPlan: 'priority-plans/update',
    deletePriorityPlan: 'priority-plans/delete',

    // Vendor Products Approval
    getAllVendors: 'products/vendors/getall',
    getVendorProducts: 'products/vendor',
    approveProduct: 'products/approve',
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
    releaseOrderPayment: 'vendor/payments/admin/order/:orderId/vendor/:vendorId/release',
    releaseScheduledPayments: 'vendor/payments/admin/release-scheduled'
    // Vendor Services Approval
    getAllServiceVendors: 'services/vendors/getall',
    getVendorServices: 'services/vendor',
    approveService: 'services/approve',
    bulkApproveServices: 'services/bulk-approve',
    bulkRejectServices: 'services/bulk-reject',
};

export default endPointApi;
