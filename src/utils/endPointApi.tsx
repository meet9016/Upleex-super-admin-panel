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

    // Subcategories CRUD
    getSubCategoryList: string;
    createSubCategory: string;
    updateSubCategory: string;
    deleteSubCategory: string;

    // BLOG
    createBlog: string;
    getAllBlogs: string;
    getBlogById: string;
    updateBlog: string;
    deleteBlog: string;

    // FAQ
    createFAQ: string;
    getAllFAQs: string;
    getFAQById: string;
    updateFAQ: string;
    deleteFAQ: string;
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

    // Subcategories CRUD
    getSubCategoryList: 'subcategories/getall',
    createSubCategory: 'subcategories/create-subcategory',
    updateSubCategory: 'subcategories/update',
    deleteSubCategory: 'subcategories/delete',

    // BLOG
    createBlog: 'blogs/create-blogs',
    getAllBlogs: 'blogs/getall',
    getBlogById: 'blogs/getById',
    updateBlog: 'blogs/update',
    deleteBlog: 'blogs/delete',

    // FAQ
    createFAQ: 'faqs/create-faq',
    getAllFAQs: 'faqs/getall',
    getFAQById: 'faqs/getById',
    updateFAQ: 'faqs/update',
    deleteFAQ: 'faqs/delete',
};

export default endPointApi;