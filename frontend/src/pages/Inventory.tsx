"use client"

const handleApiError = (err: unknown) => {
    console.error("API Error:", err);
    return err instanceof Error ? err.message : "An unknown error occurred";
};

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, FolderPlus, PackagePlus, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner";

// React Query hooks
import {
    useProducts,
    useCategories,
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct,
    useCreateCategory,
    useDeleteCategory,
    type Product,
    type Category
} from "@/hooks/useApi";

export default function InventoryPage() {
    // React Query hooks
    const { data: products = [], isLoading: isLoadingProducts, error: productsError } = useProducts();
    const { data: categories = [], isLoading: isLoadingCategories, error: categoriesError } = useCategories();

    const createProductMutation = useCreateProduct();
    const updateProductMutation = useUpdateProduct();
    const deleteProductMutation = useDeleteProduct();
    const createCategoryMutation = useCreateCategory();
    const deleteCategoryMutation = useDeleteCategory();

    const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false)
    const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
    const [newProduct, setNewProduct] = useState({
        name: "",
        quantity: 0,
        price: 0,
        hsnCode: "",
        category: ""
    })
    const [newCategory, setNewCategory] = useState("")
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

    // Handle loading and error states
    const isLoading = isLoadingProducts || isLoadingCategories;
    const error = productsError || categoriesError;

    // Debounce search term to avoid excessive filtering
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Filter products based on search term
    useEffect(() => {
        const filterProducts = () => {
            if (!debouncedSearchTerm?.trim()) {
                return products;
            }

            const searchTermLower = debouncedSearchTerm.toLowerCase().trim();

            return products.filter(product => {
                const searchableFields = [
                    product?.name,
                    product?.category?.name,
                    product?.hsnCode
                ].filter(Boolean); // Remove null/undefined values

                return searchableFields.some(field =>
                    field?.toLowerCase().includes(searchTermLower)
                );
            });
        };

        setFilteredProducts(filterProducts());
        setCurrentPage(1); // Reset to first page when filtering
    }, [products, debouncedSearchTerm]);

    // Calculate paginated products
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    // Reset to first page if products change and current page is out of range
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [filteredProducts, totalPages, currentPage]);

    // Add new product
    const handleAddProduct = async () => {
        try {
            await createProductMutation.mutateAsync(newProduct);
            setNewProduct({ name: "", quantity: 0, price: 0, hsnCode: "", category: "" });
            setIsAddProductDialogOpen(false);
        } catch (error) {
            // Error handling is done in the mutation
        }
    }

    // Add new category
    const handleAddCategory = async () => {
        try {
            await createCategoryMutation.mutateAsync({ name: newCategory });
            setNewCategory("");
            setIsAddCategoryDialogOpen(false);
        } catch (error) {
            // Error handling is done in the mutation
        }
    }

    // Edit product
    const handleEditProduct = async () => {
        if (!currentProduct) return;
        try {
            await updateProductMutation.mutateAsync({
                id: currentProduct._id,
                data: currentProduct
            });
            setIsEditDialogOpen(false);
            setCurrentProduct(null);
        } catch (error) {
            // Error handling is done in the mutation
        }
    }

    // Delete product
    const handleDeleteProduct = async (id: string) => {
        try {
            await deleteProductMutation.mutateAsync(id);
        } catch (error) {
            // Error handling is done in the mutation
        }
    }

    // Delete category
    const handleDeleteCategory = async (id: string) => {
        try {
            await deleteCategoryMutation.mutateAsync(id);
        } catch (error) {
            // Error handling is done in the mutation
        }
    }

    // Open edit dialog
    const openEditDialog = (product: Product) => {
        setCurrentProduct(product)
        setIsEditDialogOpen(true)
    }

    if (isLoading) {
        return (
            <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                        <p className="text-lg">Loading inventory data...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <p className="text-lg text-red-600 mb-4">Error loading inventory data</p>
                        <p className="text-sm text-gray-600">
                            {error?.message || "Unknown error occurred"}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
                <div className="flex gap-2">
                    {/* Add Product Dialog */}
                    <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><PackagePlus className="md:mr-2 h-4 w-4" /> <span className="hidden md:block ">Add Product</span></Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Product</DialogTitle>
                                <DialogDescription>Add a new product to your inventory.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="hsnCode">HSN Code</Label>
                                    <Input
                                        id="hsnCode"
                                        value={newProduct.hsnCode}
                                        onChange={(e) => setNewProduct({ ...newProduct, hsnCode: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        value={newProduct.quantity}
                                        onChange={(e) => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="price">Price</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        value={newProduct.price}
                                        onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddProductDialogOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={handleAddProduct}
                                    disabled={createProductMutation.isPending}
                                >
                                    {createProductMutation.isPending ? "Adding..." : "Add Product"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Add Category Dialog */}
                    <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><FolderPlus className="md:mr-2 h-4 w-4 " /> <span className="hidden md:block">Add Category</span></Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Category</DialogTitle>
                                <DialogDescription>Add a new category to your inventory.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2 ">
                                    <Label htmlFor="name">Name</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="name"
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value)}
                                        />
                                        <Button
                                            onClick={handleAddCategory}
                                            disabled={createCategoryMutation.isPending}
                                        >
                                            {createCategoryMutation.isPending ? "Adding..." : "Add Category"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <ScrollArea className="h-72 rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="">Sr.No</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Delete</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categories.map((c) => (
                                            <TableRow key={c._id}>
                                                <TableCell className="">{categories.indexOf(c) + 1}</TableCell>
                                                <TableCell>{c.name}</TableCell>
                                                <TableCell>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                disabled={deleteCategoryMutation.isPending}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Delete Category</DialogTitle>
                                                                <DialogDescription>
                                                                    If you delete this category, it will be <span className="underline underline-offset-2 text-black">removed from all invoice bill items </span> as well.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <DialogFooter>
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        // Close dialog by clicking cancel
                                                                        const dialog = document.activeElement as HTMLElement;
                                                                        dialog?.blur();
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    onClick={() => handleDeleteCategory(c._id)}
                                                                    disabled={deleteCategoryMutation.isPending}
                                                                >
                                                                    {deleteCategoryMutation.isPending ? "Deleting..." : "Delete"}
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddCategoryDialogOpen(false)}>Cancel</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Input
                                type="text"
                                placeholder="Search by name, category, or HSN code..."
                                className="w-64 pr-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && searchTerm !== debouncedSearchTerm && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>HSN Code</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedProducts.map((product) => (
                            <TableRow key={product._id}>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>{product.hsnCode}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {product.category?.name || "Uncategorized"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">{product.quantity}</TableCell>
                                <TableCell className="text-right">₹{product.price.toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditDialog(product)}
                                            disabled={updateProductMutation.isPending}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteProduct(product._id)}
                                            disabled={deleteProductMutation.isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Pagination Controls */}
                <div className="flex justify-between items-center p-4">
                    <Button
                        variant="outline"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    >
                        Previous
                    </Button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <Button
                        variant="outline"
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    >
                        Next
                    </Button>
                </div>
            </div>

            {/* Edit Product Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                        <DialogDescription>Make changes to the product details.</DialogDescription>
                    </DialogHeader>
                    {currentProduct && (
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Name</Label>
                                <Input
                                    id="edit-name"
                                    value={currentProduct.name}
                                    onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-hsnCode">HSN Code</Label>
                                <Input
                                    id="edit-hsnCode"
                                    value={currentProduct.hsnCode}
                                    onChange={(e) => setCurrentProduct({ ...currentProduct, hsnCode: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-quantity">Quantity</Label>
                                <Input
                                    id="edit-quantity"
                                    type="number"
                                    value={currentProduct.quantity}
                                    onChange={(e) => setCurrentProduct({ ...currentProduct, quantity: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-price">Price</Label>
                                <Input
                                    id="edit-price"
                                    type="number"
                                    step="0.01"
                                    value={currentProduct.price}
                                    onChange={(e) => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-category">Category</Label>
                                <Select
                                    value={currentProduct.category?._id}
                                    onValueChange={(value) => {
                                        const selectedCategory = categories.find(c => c._id === value);
                                        setCurrentProduct({
                                            ...currentProduct,
                                            category: selectedCategory || currentProduct.category
                                        });
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleEditProduct}
                            disabled={updateProductMutation.isPending}
                        >
                            {updateProductMutation.isPending ? "Updating..." : "Update Product"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}