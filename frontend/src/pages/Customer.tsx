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
import { Edit, Plus, Trash2, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ErrorMessage, GeneralError } from "@/components/ui/error-message";
import { extractFieldErrors, validateForm, ValidationSchema } from "@/lib/form-utils";
import { useNavigate } from "react-router-dom";

// React Query hooks
import {
    useCustomersRaw,
    useCreateCustomer,
    useUpdateCustomer,
    useDeleteCustomer,
    type CustomerRaw
} from "@/hooks/useApi";

const handleApiError = (err: unknown) => {
    console.error("API Error:", err);
    return err instanceof Error ? err.message : "An unknown error occurred";
};

// Validation schema for customer creation
const customerValidationSchema: ValidationSchema = {
    name: {
        required: true,
        minLength: 2,
        maxLength: 100,
    },
    gstNumber: {
        required: true,
        minLength: 15,
        maxLength: 15,
        pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    },
    address: {
        required: true,
        minLength: 6,
        maxLength: 200,
    },
    panNumber: {
        required: false,
        pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    },
    phoneNumber: {
        required: false,
        pattern: /^\d{10}$/,
    },
};

export default function CustomerPage() {
    const {  isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();

    // React Query hooks
    const { data: customers = [], isLoading: isLoadingCustomers, error: customersError } = useCustomersRaw();
    const createCustomerMutation = useCreateCustomer();
    const updateCustomerMutation = useUpdateCustomer();
    const deleteCustomerMutation = useDeleteCustomer();

    const [isAddCustomerDialogOpen, setisAddCustomerDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [currentCustomer, setCurrentCustomer] = useState<CustomerRaw | null>(null)
    const [newCustomer, setNewCustomer] = useState({
        name: "",
        address: '',
        gstNumber: '',
        panNumber: '',
        phoneNumber: '',
    })

    // Form error states
    const [customerErrors, setCustomerErrors] = useState<Record<string, string>>({});

    // Authentication check
    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            toast.error('Please log in to access this page');
            navigate('/login');
            return;
        }
    }, [isAuthenticated, isAuthLoading, navigate]);

    // Clear errors when field values change
    const handleFieldChange = (field: string, value: string) => {
        setNewCustomer({ ...newCustomer, [field]: value });
        if (customerErrors[field]) {
            setCustomerErrors({ ...customerErrors, [field]: '' });
        }
    };

    // Handle loading and error states
    if (isAuthLoading || isLoadingCustomers) {
        return (
            <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                        <p className="text-lg">Loading customer data...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (customersError) {
        return (
            <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <p className="text-lg text-red-600 mb-4">Error loading customer data</p>
                        <p className="text-sm text-gray-600">
                            {customersError?.message || "Unknown error occurred"}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Add new customer
    const handleAddProduct = async () => {
        // Clear previous errors
        setCustomerErrors({});

        // Client-side validation
        const validationErrors = validateForm(newCustomer, customerValidationSchema);
        if (Object.keys(validationErrors).length > 0) {
            setCustomerErrors(validationErrors);
            return;
        }

        try {
            await createCustomerMutation.mutateAsync(newCustomer);
            setNewCustomer({ name: "", gstNumber: '', address: '', panNumber: '', phoneNumber: '' });
            setisAddCustomerDialogOpen(false);
        } catch (error: any) {
            console.error('Add customer error:', error);
            const fieldErrors = extractFieldErrors(error);
            setCustomerErrors(fieldErrors);

            if (fieldErrors.general) {
                toast.error(fieldErrors.general);
            }
        }
    };

    // Edit customer
    const handleEditCustomer = async () => {
        if (!currentCustomer) return;

        // Clear previous errors
        setCustomerErrors({});

        // Client-side validation
        const validationErrors = validateForm(currentCustomer, customerValidationSchema);
        if (Object.keys(validationErrors).length > 0) {
            setCustomerErrors(validationErrors);
            return;
        }

        try {
            await updateCustomerMutation.mutateAsync({
                id: currentCustomer._id,
                data: currentCustomer
            });
            setIsEditDialogOpen(false);
            setCurrentCustomer(null);
        } catch (error: any) {
            console.error('Edit customer error:', error);
            const fieldErrors = extractFieldErrors(error);
            setCustomerErrors(fieldErrors);

            if (fieldErrors.general) {
                toast.error(fieldErrors.general);
            }
        }
    };

    // Delete customer
    const handleDeleteCustomer = async (id: string) => {
        try {
            await deleteCustomerMutation.mutateAsync(id);
        } catch (error) {
            // Error handling is done in the mutation
        }
    };

    // Open edit dialog
    const openEditDialog = (customer: CustomerRaw) => {
        setCurrentCustomer(customer);
        setIsEditDialogOpen(true);
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            {/* Loading state for authentication check */}
            {isAuthLoading && (
                <div className="flex items-center justify-center min-h-[200px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading...</span>
                </div>
            )}

            {/* Early return if not authenticated (while not loading) */}
            {!isAuthLoading && !isAuthenticated && (
                <div className="flex items-center justify-center min-h-[200px]">
                    <div className="flex flex-col items-center space-y-2">
                        <AlertCircle className="h-8 w-8 text-destructive" />
                        <p className="text-muted-foreground">Please log in to access this page</p>
                    </div>
                </div>
            )}

            {/* Main content - only show when authenticated */}
            {!isAuthLoading && isAuthenticated && (
                <>
                    {customersError && <div className="text-red-500">Error loading customers</div>}
                    {isLoadingCustomers && <div>Loading customers...</div>}

                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
                        <div>
                            {/* Add Customer Dialog */}
                            <Dialog open={isAddCustomerDialogOpen} onOpenChange={setisAddCustomerDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button><Plus className="mr-2 h-4 w-4" /> Add Customer</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Customer</DialogTitle>
                                        <DialogDescription>Add a new customer to your database.</DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                value={newCustomer.name}
                                                onChange={(e) => handleFieldChange('name', e.target.value)}
                                            />
                                            {customerErrors.name && <ErrorMessage error={customerErrors.name} />}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="gstNumber">GST Number</Label>
                                            <Input
                                                id="gstNumber"
                                                value={newCustomer.gstNumber}
                                                onChange={(e) => handleFieldChange('gstNumber', e.target.value)}
                                                placeholder="27ABCDE1234F1Z5"
                                            />
                                            {customerErrors.gstNumber && <ErrorMessage error={customerErrors.gstNumber} />}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="address">Address</Label>
                                            <Input
                                                id="address"
                                                value={newCustomer.address}
                                                onChange={(e) => handleFieldChange('address', e.target.value)}
                                            />
                                            {customerErrors.address && <ErrorMessage error={customerErrors.address} />}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="panNumber">PAN Number (Optional)</Label>
                                            <Input
                                                id="panNumber"
                                                value={newCustomer.panNumber}
                                                onChange={(e) => handleFieldChange('panNumber', e.target.value)}
                                                placeholder="ABCDE1234F"
                                            />
                                            {customerErrors.panNumber && <ErrorMessage error={customerErrors.panNumber} />}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="phoneNumber">Phone Number</Label>
                                            <Input
                                                id="phoneNumber"
                                                value={newCustomer.phoneNumber}
                                                type="tel"
                                                pattern="^[0-9]{10}$"
                                                maxLength={10}
                                                minLength={10}
                                                onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                                                placeholder="9876543210"
                                            />
                                            {customerErrors.phoneNumber && <ErrorMessage error={customerErrors.phoneNumber} />}
                                        </div>
                                        {customerErrors.general && <GeneralError error={customerErrors.general} />}
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setisAddCustomerDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={handleAddProduct} disabled={createCustomerMutation.isPending}>
                                            {createCustomerMutation.isPending ? 'Adding Customer...' : 'Add Customer'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* Customers Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="text-left">GST Number</TableHead>
                                    <TableHead className="text-left">Address</TableHead>
                                    <TableHead className="text-left">PAN Number</TableHead>
                                    <TableHead className="text-left">Phone Number</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.map((customer) => (
                                    <TableRow key={customer._id}>
                                        <TableCell>{customer.name.toUpperCase()}</TableCell>
                                        <TableCell className="text-left">{customer.gstNumber}</TableCell>
                                        <TableCell className="text-left truncate min-w-24 max-w-44">{customer.address}</TableCell>
                                        <TableCell className="text-left">{customer.panNumber}</TableCell>
                                        <TableCell className="text-left">{customer.phoneNumber || '-'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditDialog(customer)}
                                                    disabled={updateCustomerMutation.isPending}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteCustomer(customer._id)}
                                                    disabled={deleteCustomerMutation.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Edit Customer Dialog */}
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Customer</DialogTitle>
                                <DialogDescription>Make changes to the customer details.</DialogDescription>
                            </DialogHeader>
                            {currentCustomer && (
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-name">Name</Label>
                                        <Input
                                            id="edit-name"
                                            value={currentCustomer.name}
                                            onChange={(e) => setCurrentCustomer({ ...currentCustomer, name: e.target.value })}
                                        />
                                        {customerErrors.name && <ErrorMessage error={customerErrors.name} />}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-gstNumber">GST Number</Label>
                                        <Input
                                            id="edit-gstNumber"
                                            value={currentCustomer.gstNumber}
                                            onChange={(e) => setCurrentCustomer({ ...currentCustomer, gstNumber: e.target.value })}
                                        />
                                        {customerErrors.gstNumber && <ErrorMessage error={customerErrors.gstNumber} />}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-address">Address</Label>
                                        <Input
                                            id="edit-address"
                                            value={currentCustomer.address}
                                            onChange={(e) => setCurrentCustomer({ ...currentCustomer, address: e.target.value })}
                                        />
                                        {customerErrors.address && <ErrorMessage error={customerErrors.address} />}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-panNumber">PAN Number</Label>
                                        <Input
                                            id="edit-panNumber"
                                            value={currentCustomer.panNumber}
                                            onChange={(e) => setCurrentCustomer({ ...currentCustomer, panNumber: e.target.value })}
                                        />
                                        {customerErrors.panNumber && <ErrorMessage error={customerErrors.panNumber} />}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-phoneNumber">Phone Number</Label>
                                        <Input
                                            id="edit-phoneNumber"
                                            value={currentCustomer.phoneNumber}
                                            type="tel"
                                            pattern="^[0-9]{10}$"
                                            maxLength={10}
                                            minLength={10}
                                            onChange={(e) => setCurrentCustomer({ ...currentCustomer, phoneNumber: e.target.value })}
                                            placeholder="9876543210"
                                        />
                                        {customerErrors.phoneNumber && <ErrorMessage error={customerErrors.phoneNumber} />}
                                    </div>
                                    {customerErrors.general && <GeneralError error={customerErrors.general} />}
                                </div>
                            )}
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={handleEditCustomer}
                                    disabled={updateCustomerMutation.isPending}
                                >
                                    {updateCustomerMutation.isPending ? "Updating..." : "Update Customer"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </div>
    )
}