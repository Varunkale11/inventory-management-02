import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api';
import { toast } from 'sonner';

// Types
export interface Item {
    id: string;
    name: string;
    quantity: number;
    price: number;
    category: string;
    hsnCode: string;
    categoryId: string;
}

export interface Product {
    _id: string;
    name: string;
    quantity: number;
    price: number;
    hsnCode: string;
    category: { _id: string; name: string };
}

export interface Category {
    _id: string;
    name: string;
}

export interface Customer {
    id: string;
    name: string;
    gstNumber: string;
    panNumber: string;
    address: string;
    phoneNumber?: string;
}

export interface CustomerRaw {
    _id: string;
    name: string;
    gstNumber: string;
    panNumber: string;
    address: string;
    phoneNumber?: string;
}

export interface InvoiceData {
    gstRate: number;
    customerBillTo: Customer;
    customerShipTo: Customer;
    invoiceNumber: string;
    invoiceDate: string;
    challanNo?: string;
    poNo?: string;
    eWayNo?: string;
    challanDate?: string;
    items: any[];
    companyDetails: any;
    subtotal: number;
    gstAmount: number;
    total: number;
    transportationAndOthers: number;
    packaging: number;
    template: string;
    showPcsInQty: boolean;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    createdAt: string;
    invoiceDate: string;
    challanNo?: string;
    poNo?: string;
    eWayNo?: string;
    challanDate?: string;
    customerBillTo: {
        name: string;
        address: string;
        gstNumber?: string;
        panNumber?: string;
    };
    customerShipTo: {
        name: string;
        address: string;
        gstNumber?: string;
        panNumber?: string;
    };
    companyDetails: {
        name: string;
        address: string;
        cityState: string;
        phone: string;
        email: string;
    };
    items: {
        id: string;
        productId: string;
        name: string;
        price: number;
        quantity: number;
        category: string;
        hsnCode: string;
    }[];
    subtotal: number;
    gstAmount: number;
    gstRate: number;
    total: number;
    qrCode: string;
    template: "modern" | "minimal" | "classic" | "professional";
    showPcsInQty: boolean;
}

// Query Keys
export const QUERY_KEYS = {
    ITEMS: ['items'],
    PRODUCTS: ['products'],
    CATEGORIES: ['categories'],
    CUSTOMERS: ['customers'],
    CUSTOMERS_RAW: ['customers-raw'],
    INVOICE_NUMBER: ['invoice-number'],
    INVOICES: ['invoices'],
    INVOICE: (id: string) => ['invoice', id],
    LOW_STOCK_ITEMS: ['low-stock-items'],
    DASHBOARD_STATS: ['dashboard-stats'],
} as const;

// ==================== ITEMS/PRODUCTS HOOKS ====================

export const useItems = () => {
    return useQuery<Item[]>({
        queryKey: QUERY_KEYS.ITEMS,
        queryFn: async () => {
            const response = await axiosInstance.get('/item', { withCredentials: true });

            const items = response.data.map((item: any) => {
                let categoryName = "Uncategorized";
                let categoryId = "";

                if (item.category && typeof item.category === 'object' && item.category.name) {
                    categoryName = item.category.name;
                    categoryId = item.category._id?.toString() || "";
                } else if (item.category) {
                    categoryName = item.category.toString();
                    categoryId = item.category.toString();
                }

                return {
                    id: item._id?.toString() || "",
                    name: item.name || "Unknown Product",
                    quantity: Number(item.quantity) || 0,
                    price: Number(item.price) || 0,
                    category: categoryName,
                    categoryId: categoryId,
                    hsnCode: item.hsnCode || "",
                };
            });

            return items;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useProducts = () => {
    return useQuery<Product[]>({
        queryKey: QUERY_KEYS.PRODUCTS,
        queryFn: async () => {
            const response = await axiosInstance.get('/item', { withCredentials: true });
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useLowStockItems = () => {
    return useQuery<Product[]>({
        queryKey: QUERY_KEYS.LOW_STOCK_ITEMS,
        queryFn: async () => {
            const response = await axiosInstance.get('/item', { withCredentials: true });
            return response.data.filter((item: Product) => item.quantity < 10);
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useCreateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (productData: {
            name: string;
            quantity: number;
            price: number;
            hsnCode: string;
            category: string;
        }) => {
            const response = await axiosInstance.post('/item', productData, {
                withCredentials: true
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ITEMS });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LOW_STOCK_ITEMS });
            toast.success('Product created successfully!');
        },
        onError: (error: any) => {
            console.error('Error creating product:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Unknown server error';
            toast.error(`Failed to create product: ${errorMessage}`);
        },
    });
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
            const response = await axiosInstance.put(`/item/${id}`, data, {
                withCredentials: true
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ITEMS });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LOW_STOCK_ITEMS });
            toast.success('Product updated successfully!');
        },
        onError: (error: any) => {
            console.error('Error updating product:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Unknown server error';
            toast.error(`Failed to update product: ${errorMessage}`);
        },
    });
};

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await axiosInstance.delete(`/item/${id}`, {
                withCredentials: true
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ITEMS });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LOW_STOCK_ITEMS });
            toast.success('Product deleted successfully!');
        },
        onError: (error: any) => {
            console.error('Error deleting product:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Unknown server error';
            toast.error(`Failed to delete product: ${errorMessage}`);
        },
    });
};

// ==================== CATEGORIES HOOKS ====================

export const useCategories = () => {
    return useQuery<Category[]>({
        queryKey: QUERY_KEYS.CATEGORIES,
        queryFn: async () => {
            const response = await axiosInstance.get('/category', { withCredentials: true });
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useCreateCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (categoryData: { name: string }) => {
            const response = await axiosInstance.post('/category', categoryData, {
                withCredentials: true
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ITEMS });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
            toast.success('Category created successfully!');
        },
        onError: (error: any) => {
            console.error('Error creating category:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Unknown server error';
            toast.error(`Failed to create category: ${errorMessage}`);
        },
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await axiosInstance.delete(`/category/${id}`, {
                withCredentials: true
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ITEMS });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
            toast.success('Category deleted successfully!');
        },
        onError: (error: any) => {
            console.error('Error deleting category:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Unknown server error';
            toast.error(`Failed to delete category: ${errorMessage}`);
        },
    });
};

// ==================== CUSTOMERS HOOKS ====================

export const useCustomers = () => {
    return useQuery<Customer[]>({
        queryKey: QUERY_KEYS.CUSTOMERS,
        queryFn: async () => {
            const response = await axiosInstance.get('/customer', { withCredentials: true });

            const customers = response.data.map((customer: any) => ({
                id: customer._id?.toString() || "",
                name: customer.name || "Unknown Customer",
                gstNumber: customer.gstNumber || "Unknown GST Number",
                panNumber: customer.panNumber || "Unknown Pan Number",
                address: customer.address || "Unknown Address",
                phoneNumber: customer.phoneNumber || "",
            }));

            return customers;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useCustomersRaw = () => {
    return useQuery<CustomerRaw[]>({
        queryKey: QUERY_KEYS.CUSTOMERS_RAW,
        queryFn: async () => {
            const response = await axiosInstance.get('/customer', { withCredentials: true });
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useCreateCustomer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (customerData: {
            name: string;
            gstNumber: string;
            panNumber: string;
            address: string;
            phoneNumber?: string;
        }) => {
            const response = await axiosInstance.post('/customer', customerData, {
                withCredentials: true
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CUSTOMERS });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CUSTOMERS_RAW });
            toast.success('Customer created successfully!');
        },
        onError: (error: any) => {
            console.error('Error creating customer:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Unknown server error';
            toast.error(`Failed to create customer: ${errorMessage}`);
        },
    });
};

export const useUpdateCustomer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<CustomerRaw> }) => {
            const response = await axiosInstance.put(`/customer/${id}`, data, {
                withCredentials: true
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CUSTOMERS });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CUSTOMERS_RAW });
            toast.success('Customer updated successfully!');
        },
        onError: (error: any) => {
            console.error('Error updating customer:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Unknown server error';
            toast.error(`Failed to update customer: ${errorMessage}`);
        },
    });
};

export const useDeleteCustomer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await axiosInstance.delete(`/customer/${id}`, {
                withCredentials: true
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CUSTOMERS });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CUSTOMERS_RAW });
            toast.success('Customer deleted successfully!');
        },
        onError: (error: any) => {
            console.error('Error deleting customer:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Unknown server error';
            toast.error(`Failed to delete customer: ${errorMessage}`);
        },
    });
};

// ==================== INVOICES HOOKS ====================

export const useInvoices = () => {
    return useQuery<Invoice[]>({
        queryKey: QUERY_KEYS.INVOICES,
        queryFn: async () => {
            const response = await axiosInstance.get('/invoice', { withCredentials: true });

            const invoicesWithIds = response.data.map((invoice: any) => ({
                ...invoice,
                id: invoice._id
            }));

            return invoicesWithIds.sort((a: any, b: any) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useInvoice = (id: string) => {
    return useQuery<Invoice>({
        queryKey: QUERY_KEYS.INVOICE(id),
        queryFn: async () => {
            const response = await axiosInstance.get(`/invoice/${id}`, { withCredentials: true });
            return {
                ...response.data,
                id: response.data._id
            };
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useInvoiceNumber = () => {
    return useQuery<string>({
        queryKey: QUERY_KEYS.INVOICE_NUMBER,
        queryFn: async () => {
            const response = await axiosInstance.get('/invoice/get-invoice-number', {
                withCredentials: true
            });
            return response.data.invoiceNumber;
        },
        staleTime: 1000 * 60 * 1, // 1 minute (more frequent updates for invoice numbers)
    });
};

export const useSaveInvoice = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (invoiceData: InvoiceData) => {
            const response = await axiosInstance.post('/invoice', invoiceData, {
                withCredentials: true
            });
            return response.data;
        },
        onSuccess: () => {
            // Invalidate and refetch invoice-related queries
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INVOICES });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INVOICE_NUMBER });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
            toast.success('Invoice saved successfully!');
        },
        onError: (error: any) => {
            console.error('Error saving invoice:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Unknown server error';
            toast.error(`Failed to save invoice: ${errorMessage}`);
        },
    });
};

export const useDeleteInvoice = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await axiosInstance.delete(`/invoice/${id}`, {
                withCredentials: true
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INVOICES });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS })
            toast.success('Invoice deleted successfully!');
        },
        onError: (error: any) => {
            console.error('Error deleting invoice:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Unknown server error';
            toast.error(`Failed to delete invoice: ${errorMessage}`);
        },
    });
};

// ==================== DASHBOARD HOOKS ====================

export const useDashboardStats = () => {
    const { data: invoices = [] } = useInvoices();

    return useQuery({
        queryKey: QUERY_KEYS.DASHBOARD_STATS,
        queryFn: async () => {
            // Process invoices for dashboard stats
            const totalBills = invoices.length;
            const totalAmount = invoices.reduce((sum, invoice) =>
                sum + invoice.items.reduce((itemSum, item) => itemSum + (item.quantity * item.price), 0), 0);

            // Monthly bills data
            const monthlyData = invoices.reduce((acc, invoice) => {
                const date = new Date(invoice.invoiceDate);
                const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
                acc[monthYear] = (acc[monthYear] || 0) + 1;
                return acc;
            }, {} as { [key: string]: number });

            const monthlyBills = Object.entries(monthlyData).map(([month, count]) => ({ month, count }));

            // Category sales data
            const categoryData = invoices.reduce((acc, invoice) => {
                invoice.items.forEach(item => {
                    const categoryName = item.category || 'Unknown';
                    acc[categoryName] = (acc[categoryName] || 0) + item.quantity;
                });
                return acc;
            }, {} as { [key: string]: number });

            const categorySales = Object.entries(categoryData).map(([categoryName, totalSold]) => ({
                categoryName,
                totalSold
            }));

            return {
                totalBills,
                totalAmount,
                monthlyBills,
                categorySales
            };
        },
        enabled: invoices.length > 0,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};