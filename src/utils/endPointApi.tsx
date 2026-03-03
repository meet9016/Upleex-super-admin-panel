export interface EndPointApi {
    sendOtp: string;
    login: string;
    register: string;
    logout: string;

    // Admin Auth
    adminLogin: string;
    adminRegister: string;

    // Vendor Management
    getVendorList: string;
    updateVendorStatus: string;

    // Dropdowns
    getDropdowns: string;

    // Categories CRUD
    getCategoryList: string;
    postCategoryList: string;
    updateCategory: string;
    deleteCategory: string;
    bulkDeleteCategory: string;

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
}

const endPointApi: EndPointApi = {
    sendOtp: 'vendor/auth/send-otp',
    login: 'vendor/auth/vendor-login',
    register: 'auth/register',
    logout: 'auth/logout',

    // Admin Auth
    adminLogin: 'admin/login',
    adminRegister: 'admin/register',

    // Vendor Management
    getVendorList: 'vendor-kyc',
    updateVendorStatus: 'change-status',

    // Dropdowns
    getDropdowns: 'dropdowns',

    // Categories CRUD
    getCategoryList: 'categories/getall',
    postCategoryList: 'categories/create-category',
    updateCategory: 'categories/update',
    deleteCategory: 'categories/delete',
    bulkDeleteCategory: 'categories/bulk-delete',

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
};

export default endPointApi;
