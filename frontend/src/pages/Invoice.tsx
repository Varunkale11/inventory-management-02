import { DatePicker } from "@/components/date-range";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronUpIcon } from "lucide-react";
import { Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import InvoiceClassic from "@/components/invoice-templates/template-classic";
import ModernInvoiceTemplate from "@/components/invoice-templates/template-Modern";
import PremiumMinimalInvoice from "@/components/invoice-templates/template-minimal";
import ProfessionalInvoiceTemplate from "@/components/invoice-templates/template-professional";
import TemplateCarousel from "@/components/invoice-templates/TemplateCarousel";
import { toast } from "sonner";
import { useNavigate } from "react-router";

// React Query hooks
import {
  useItems,
  useCustomers,
  useInvoiceNumber,
  useSaveInvoice,
  type Item,
  type Customer
} from "@/hooks/useApi";

function Invoice() {
  // React Query hooks
  const { data: inventoryItems = [], isLoading: isLoadingItems, error: itemsError } = useItems();
  const { data: customers = [], isLoading: isLoadingCustomers, error: customersError } = useCustomers();
  const { data: fetchedInvoiceNumber = "", isLoading: isLoadingInvoiceNumber } = useInvoiceNumber();
  const saveInvoiceMutation = useSaveInvoice();

  const [open, setOpen] = useState(false);
  const [showPcsInQty, setShowPcsInQty] = useState(false);
  const [showSqFeet, setShowSqFeet] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    category: string;
    hsnCode: string;
    sqFeet?: number;
  }>({
    id: "",
    name: "",
    quantity: 0,
    price: 0,
    category: "",
    hsnCode: "",
    sqFeet: 0,
  });
  const [gstRate, setGstRate] = useState(18);
  const [invoiceItems, setInvoiceItems] = useState<
    {
      id: string;
      name: string;
      quantity: number;
      price: number;
      category: string;
      hsnCode: string;
      categoryId: string;
      sqFeet?: number;
    }[]
  >([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [companyDetails, setCompanyDetails] = useState({
    name: "Dynamic Enterprises",
    address: "Gogalwadi Phata, Jijabai Nagar, Near Katraj Tunnel NH4, Shindewadi, Tal- Bhor",
    cityState: "Pune, Maharashtra 412205",
    phone: "9820132560, 9637831717",
    email: "dyn.enterprises@gmail.com",
  });

  const [selectedTemplate, setSelectedTemplate] = useState("professional");
  const [selectedCustomerBillTo, setSelectedCustomerBillTo] = useState<Customer>({
    id: "",
    name: "",
    gstNumber: "",
    panNumber: "",
    address: "",
  });
  const [selectedCustomerShipTo, setSelectedCustomerShipTo] = useState<Customer>({
    id: "",
    name: "",
    gstNumber: "",
    panNumber: "",
    address: "",
  });
  const [quantity, setQuantity] = useState(0);

  const [transportationValue, setTransportationValue] = useState(0);
  const [packagingValue, setPackagingValue] = useState(0);
  const [billToOpen, setBillToOpen] = useState(false);
  const [shipToOpen, setShipToOpen] = useState(false);
  const navigate = useNavigate();

  const [challanNo, setChallanNo] = useState("");
  const [poNo, setPoNo] = useState("");
  const [eWayNo, setEWayNo] = useState("");
  const [challanDate, setChallanDate] = useState("");
  const [formErrors, setFormErrors] = useState<{ challanNo?: string, poNo?: string, eWayNo?: string }>({});

  // Set invoice number when fetched
  useEffect(() => {
    if (fetchedInvoiceNumber && !invoiceNumber) {
      setInvoiceNumber(fetchedInvoiceNumber);
    }
  }, [fetchedInvoiceNumber, invoiceNumber]);

  // Handle loading and error states
  if (isLoadingItems || isLoadingCustomers || isLoadingInvoiceNumber) {
    return (
      <div className="container p-4 pt-6 md:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-lg">Loading invoice data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (itemsError || customersError) {
    return (
      <div className="container p-4 pt-6 md:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-lg text-red-600 mb-4">Error loading data</p>
            <p className="text-sm text-gray-600">
              {itemsError?.message || customersError?.message || "Unknown error occurred"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const templates = [
    {
      id: "modern",
      name: "Modern Template",
      preview: "/templates/modern.png",
      component: ModernInvoiceTemplate,
    },
    {
      id: "professional",
      name: "Professional Template",
      preview: "/templates/professional.png",
      component: ProfessionalInvoiceTemplate,
    },

    {
      id: "classic",
      name: "Classic Template",
      preview: "/templates/classic.png",
      component: InvoiceClassic,
    },
    {
      id: "minimal",
      name: "Minimal Template",
      preview: "/templates/minimal.png",
      component: PremiumMinimalInvoice,
    },
  ];

  const SelectedTemplate =
    templates.find((t) => t.id === selectedTemplate)?.component ||
    ModernInvoiceTemplate;

  const handleAddProduct = () => {
    if (
      !selectedProduct.id ||
      !selectedProduct.name ||
      !Number.isFinite(selectedProduct.quantity) ||
      selectedProduct.quantity < 1 ||
      !Number.isFinite(selectedProduct.price) ||
      selectedProduct.price <= 0 ||
      !selectedProduct.category
    ) {
      toast.error(
        "Please select a valid product with quantity >= 1, price > 0, and a valid category."
      );
      return;
    }

    const inventoryItem = inventoryItems.find((inv) => inv.id === selectedProduct.id);
    if (!inventoryItem) {
      console.error("No matching inventory item found for:", selectedProduct);
      toast.error("Error: Invalid product. Please try again.");
      return;
    }
    if (!inventoryItem.category || inventoryItem.category === "Uncategorized") {
      console.warn("Category for selected product is invalid:", inventoryItem);
    }
    const category = inventoryItem.category;

    const newProduct = {
      id: selectedProduct.id,
      name: selectedProduct.name,
      quantity: Math.floor(Number(selectedProduct.quantity)),
      price: Number(selectedProduct.price),
      category,
      hsnCode: selectedProduct.hsnCode,
      categoryId: inventoryItem.categoryId,
      sqFeet: showSqFeet ? Number(selectedProduct.sqFeet) : undefined,
    };

    console.log("Adding product:", JSON.stringify(newProduct, null, 2));
    console.log("Current invoiceItems:", JSON.stringify(invoiceItems, null, 2));

    const existingProductIndex = invoiceItems.findIndex(
      (item) => item.id === newProduct.id
    );

    if (existingProductIndex !== -1) {
      setInvoiceItems((prevItems) =>
        prevItems.map((item, index) =>
          index === existingProductIndex
            ? { ...item, quantity: item.quantity + newProduct.quantity, hsnCode: newProduct.hsnCode }
            : item
        )
      );
    } else {
      setInvoiceItems((prevItems) => [...prevItems, newProduct]);
    }

    setSelectedProduct({
      id: "",
      name: "",
      quantity: 0,
      price: 0,
      category: "",
      hsnCode: "",
    });

    setOpen(false);

    console.log("Updated invoiceItems:", JSON.stringify(invoiceItems, null, 2));
  };

  const handleProductDelete = (id: string) => {
    console.log("Deleting product with id:", id);
    const newProducts = invoiceItems.filter((product) => product.id !== id);
    setInvoiceItems(newProducts);
  };

  const validateFields = () => {
    const errors: { challanNo?: string, poNo?: string, eWayNo?: string } = {};
    if (challanNo && !/^\d+$/.test(challanNo)) {
      errors.challanNo = "Challan No. must be a number";
    }
    if (poNo && !/^\d+$/.test(poNo)) {
      errors.poNo = "P.O. No. must be a number";
    }
    if (eWayNo && (!/^[a-zA-Z0-9]+$/.test(eWayNo) || eWayNo.length > 11)) {
      errors.eWayNo = "E-Way No. must be alphanumeric and max 11 characters";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveInvoice = async () => {
    if (!validateFields()) {
      toast.error("Please fix the form errors before saving.");
      return;
    }
    if (!selectedCustomerBillTo.id || invoiceItems.length === 0) {
      toast.error("Please provide customer name, email, address, invoice number, and at least one item.");
      return;
    }
    if (invoiceItems.some(item => !item.category || item.category === "Uncategorized")) {
      toast.error("All items must have a valid category (not 'Uncategorized').");
      return;
    }
    try {
      console.log("Saving invoice with data:", JSON.stringify(invoiceData, null, 2));
      console.log("after", invoiceData.gstAmount)
      await saveInvoiceMutation.mutateAsync(invoiceData);
      navigate("/billing");
    } catch (error) {
      // Error handling is done in the mutation
      console.error('Error in handleSaveInvoice:', error);
    }
  };

  // Calculate invoice summary for preview and template
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gstAmount = subtotal * (gstRate / 100);
  console.log("Before gstAmount", gstAmount)
  const total = subtotal + gstAmount + transportationValue + packagingValue;

  const invoiceData = {
    gstRate,
    customerBillTo: selectedCustomerBillTo,
    customerShipTo: selectedCustomerShipTo,
    invoiceNumber,
    invoiceDate,
    challanNo,
    poNo,
    eWayNo,
    challanDate,
    items: invoiceItems.map(item => ({
      ...item,
      category: item.categoryId,
    })),
    companyDetails,
    subtotal,
    gstAmount,
    total,
    transportationAndOthers: transportationValue,
    packaging: packagingValue,
    template: selectedTemplate,
    showPcsInQty,
    showSqFeet,
  };
  console.log("invoiceData", invoiceData)

  return (
    <div className="container p-4 pt-6 md:p-8 ">
      <h1 className="text-3xl mb-8 font-serif font-bold tracking-tight">Create Invoice</h1>
      <div className="flex flex-col lg:flex-row flex-wrap gap-4 min-w-0">
        <Card className="flex-1 min-w-0 w-full lg:w-1/2">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Invoice Form</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">Company Details</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="my-2">Company Name</Label>
                    <Input
                      className="w-full"
                      value={companyDetails.name}
                      onChange={(e) =>
                        setCompanyDetails({
                          ...companyDetails,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="my-2">Address</Label>
                    <Input
                      className="w-full"
                      value={companyDetails.address}
                      onChange={(e) =>
                        setCompanyDetails({
                          ...companyDetails,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="my-2">City, State ZIP</Label>
                    <Input
                      className="w-full"
                      value={companyDetails.cityState}
                      onChange={(e) =>
                        setCompanyDetails({
                          ...companyDetails,
                          cityState: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="my-2">Phone</Label>
                    <Input
                      className="w-full"
                      value={companyDetails.phone}
                      onChange={(e) =>
                        setCompanyDetails({
                          ...companyDetails,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="my-2">Email</Label>
                    <Input
                      className="w-full"
                      value={companyDetails.email}
                      onChange={(e) =>
                        setCompanyDetails({
                          ...companyDetails,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">Customer Details</h3>
                <div className="flex gap-8 flex-wrap">
                  <div id="bill-to container ">
                    <h3 className="mb-1">Bill To : </h3>
                    <div className="space-y-4">
                      <div>
                        <Popover open={billToOpen} onOpenChange={setBillToOpen} modal={true}  >
                          <PopoverTrigger className="w-full border p-2 rounded-md text-left pl-4 font-medium flex justify-between items-center">
                            {selectedCustomerBillTo.name !== "" ? selectedCustomerBillTo.name : "Select customer..."} {" "}
                            <div className="inline-flex h-6 flex-col">
                              <ChevronUpIcon /> <ChevronDown />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-[90vw] max-w-[300px]">
                            <Command>
                              <CommandInput placeholder="Search customer..." />
                              <CommandList>
                                <CommandEmpty>No customers found.</CommandEmpty>
                                <CommandGroup heading="Customers">
                                  <ScrollArea className="h-[200px]">
                                    {customers.map((c) => (
                                      <CommandItem
                                        key={c.id}
                                        value={c.name}
                                        onSelect={() => {
                                          setSelectedCustomerBillTo({
                                            id: c.id,
                                            name: c.name,
                                            gstNumber: c.gstNumber,
                                            panNumber: c.panNumber,
                                            address: c.address,
                                            phoneNumber: c.phoneNumber,
                                          });
                                          setBillToOpen(false);
                                        }}
                                      >
                                        <div className="flex flex-col gap-1">
                                          <span className="font-medium">{c.name}</span>
                                          {/* <span className="text-sm text-muted-foreground">{c.email}</span> */}
                                          <span className="text-sm text-muted-foreground">{c.address}</span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </ScrollArea>
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {selectedCustomerBillTo.id && (
                        <div className="space-y-2 p-4 border rounded-md bg-muted/50">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Name:</span>
                            <span>{selectedCustomerBillTo.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">GST:</span>
                            <span>{selectedCustomerBillTo.gstNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Pan Number:</span>
                            <span>{selectedCustomerBillTo.panNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Address:</span>
                            <span>{selectedCustomerBillTo.address}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Phone Number:</span>
                            <span>{selectedCustomerBillTo.phoneNumber || '-'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div id="ship-to container">
                    <h3 className="mb-1">Ship To :</h3>
                    <div className="space-y-4">
                      <div>
                        <Popover open={shipToOpen} onOpenChange={setShipToOpen} modal={true}>
                          <PopoverTrigger className="w-full border p-2 rounded-md text-left pl-4 font-medium flex justify-between items-center">
                            {selectedCustomerShipTo.name !== "" ? selectedCustomerShipTo.name : "Select customer..."} {" "}
                            <div className="inline-flex h-6 flex-col">
                              <ChevronUpIcon /> <ChevronDown />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-[90vw] max-w-[300px]">
                            <Command>
                              <CommandInput placeholder="Search customer..." />
                              <CommandList>
                                <CommandEmpty>No customers found.</CommandEmpty>
                                <CommandGroup heading="Customers ">
                                  <ScrollArea className="h-[200px]">
                                    {customers.map((b) => (
                                      <CommandItem
                                        key={b.id}
                                        value={b.name}
                                        onSelect={() => {
                                          setSelectedCustomerShipTo({
                                            id: b.id,
                                            name: b.name,
                                            gstNumber: b.gstNumber,
                                            panNumber: b.panNumber,
                                            address: b.address,
                                            phoneNumber: b.phoneNumber,
                                          });
                                          setShipToOpen(false);
                                        }}
                                      >
                                        <div className="flex flex-col gap-1">
                                          <span className="font-medium">{b.name}</span>
                                          {/* <span className="text-sm text-muted-foreground">{b.email}</span> */}
                                          <span className="text-sm text-muted-foreground">{b.address}</span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </ScrollArea>
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {selectedCustomerShipTo.id && (
                        <div className="space-y-2 p-4 border rounded-md bg-muted/50">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Name:</span>
                            <span>{selectedCustomerShipTo.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">GST:</span>
                            <span>{selectedCustomerShipTo.gstNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Pan Number:</span>
                            <span>{selectedCustomerShipTo.panNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Address:</span>
                            <span>{selectedCustomerShipTo.address}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Phone Number:</span>
                            <span>{selectedCustomerShipTo.phoneNumber || '-'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 flex flex-col gap-4">Invoice Details</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="min-w-0 flex-2">
                      <Label className="mb-2"># Invoice Number</Label>
                      <Input
                        className="w-full"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                      />
                    </div>
                    <div className="min-w-0 flex-1 mb-4">
                      <Label className="mb-2">GST Rate</Label>
                      <Input
                        className="w-full"
                        value={gstRate}
                        onChange={(e) => setGstRate(Number(e.target.value))}
                        type="number"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Label className="mb-2">Challan No.</Label>
                      <Input
                        className="w-full"
                        value={challanNo}
                        onChange={(e) => setChallanNo(e.target.value)}
                        placeholder="Enter Challan No."
                        type="text"
                      />
                      {formErrors.challanNo && <span className="text-red-600 text-xs">{formErrors.challanNo}</span>}
                    </div>
                    <div className="flex-1">
                      <Label className="mb-2">P.O. No.</Label>
                      <Input
                        className="w-full"
                        value={poNo}
                        onChange={(e) => setPoNo(e.target.value)}
                        placeholder="Enter P.O. No."
                        type="text"
                      />
                      {formErrors.poNo && <span className="text-red-600 text-xs">{formErrors.poNo}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Label className="mb-2">E-Way No.</Label>
                      <Input
                        className="w-full"
                        value={eWayNo}
                        onChange={(e) => setEWayNo(e.target.value)}
                        placeholder="Enter E-Way No."
                        type="text"
                        maxLength={11}
                      />
                      {formErrors.eWayNo && <span className="text-red-600 text-xs">{formErrors.eWayNo}</span>}
                    </div>
                    <div className="flex-1">
                      <Label className="mb-2">Challan Date</Label>
                      <Input
                        className="w-full"
                        value={challanDate}
                        onChange={(e) => setChallanDate(e.target.value)}
                        placeholder="Enter Challan Date"
                        type="date"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-col lg:md:flex-row sm:flex-row gap-4 mb-4">
                    <div className="flex flex-col flex-1 gap-2">
                      <Label className="mb-0">Transportation & Others</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">₹</span>
                        <Input
                          className="w-full ml-0"
                          value={transportationValue}
                          onChange={(e) => setTransportationValue(Number(e.target.value) || 0)}
                          type="number"
                          min="0"
                          placeholder="Enter amount"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">Enter extra transportation or miscellaneous charges</span>
                    </div>
                    <div className="flex flex-col flex-1 gap-2">
                      <Label className="mb-0">Packaging</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">₹</span>
                        <Input
                          className="w-full ml-0"
                          value={packagingValue}
                          onChange={(e) => setPackagingValue(Number(e.target.value) || 0)}
                          type="number"
                          min="0"
                          placeholder="Enter amount"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">Enter packaging charges</span>
                    </div>
                  </div>
                  <div className="">
                    <Label className="mb-2">Invoice Date</Label>
                    <DatePicker value={invoiceDate} onChange={setInvoiceDate} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="flex-2 min-w-0 w-full lg:w-1/2">
          <CardHeader className="flex flex-col sm:flex-row gap-2 justify-between">
            <div className="flex flex-col gap-2">
              <CardTitle className="text-2xl font-semibold">
                Product Details
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showPcsInQty"
                    checked={showPcsInQty}
                    onChange={(e) => setShowPcsInQty(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="showPcsInQty" className="text-sm font-medium">
                    Show "Pcs" in Quantity Column
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showSqFeet"
                    checked={showSqFeet}
                    onChange={(e) => setShowSqFeet(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="showSqFeet" className="text-sm font-medium">
                    Enable Sq.Feet
                  </Label>
                </div>
              </div>
            </div>
            <Button onClick={handleAddProduct} className="w-full sm:w-32 py-4">
              Add
            </Button>
          </CardHeader>
          <CardContent>
            <div>
              <div className="flex flex-col justify-start items-center sm:flex-row gap-4 flex-wrap min-w-0">
                <div className="w-full sm:w-auto min-w-0">
                  <h2 className="font-medium mb-2">Product</h2>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger className="w-full sm:w-56 border p-2 rounded-md text-left pl-4 font-medium flex justify-between items-center">
                      {selectedProduct.name !== ""
                        ? selectedProduct.name
                        : "select product..."} {" "}
                      <div className="inline-flex h-6 flex-col">
                        <ChevronUpIcon /> <ChevronDown />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-[90vw] max-w-[300px] sm:w-auto">
                      <Command>
                        <CommandInput placeholder="search product..." />
                        <CommandList>
                          <CommandEmpty>No results found.</CommandEmpty>
                          <CommandGroup heading="Suggestions">
                            <ScrollArea className="h-[200px]">
                              {inventoryItems?.map((product) => {
                                return (
                                  <CommandItem
                                    id={product.id}
                                    value={product.name}
                                    key={product.id}
                                    onSelect={() => {
                                      console.log("Selected product:", JSON.stringify(product, null, 2));
                                      setQuantity(product.quantity);
                                      setSelectedProduct({
                                        id: product.id,
                                        name: product.name,
                                        quantity: product.quantity,
                                        price: product.price,
                                        category: product.category,
                                        hsnCode: product.hsnCode,
                                      });
                                      console.log(product)
                                      setOpen(false);
                                    }}
                                  >
                                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition">
                                      <div className="flex flex-col">
                                        <span className="font-semibold text-base">{product.name}</span>
                                        <div className="flex items-center gap-2 mr-2 mt-1">
                                          <Badge className="bg-gray-200 dark:bg-zinc-700 dark:text-white text-gray-700 border-none px-2 py-1 text-xs">
                                            {product.category}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground ">Stock: {product.quantity}</span>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end">
                                        <span className="font-bold text-lg text-primary">₹{product.price}</span>
                                        <span className="text-xs text-muted-foreground">per unit</span>
                                      </div>
                                    </div>
                                  </CommandItem>
                                );
                              })}
                            </ScrollArea>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="w-full sm:w-auto min-w-0">
                  <h2 className="font-semibold mb-2">Quantity</h2>
                  <div className="flex border rounded-md w-fit max-w-xs">
                    <Button
                      variant="secondary"
                      className="max-w-8 rounded-r-none rounded-l-md "
                      onClick={() =>
                        setSelectedProduct({
                          ...selectedProduct,
                          quantity: Math.max(0, selectedProduct.quantity - 1),
                        })
                      }
                    >
                      -
                    </Button>
                    <input
                      onChange={(e) => {
                        const val = Math.min(Number(e.target.value) || 0, quantity);
                        setSelectedProduct({
                          ...selectedProduct,
                          quantity: val,
                        })
                      }
                      }
                      value={Math.max(0, selectedProduct.quantity)}
                      className="w-24 text-center rounded-none border-r border-l border-b-0 border-t-0"
                      type="number"
                      min="0"
                    />
                    <Button
                      variant="secondary"
                      className="rounded-l-none rounded-r-md "
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.preventDefault();
                        setSelectedProduct({
                          ...selectedProduct,
                          quantity: Math.min(quantity, selectedProduct.quantity + 1),
                        })
                      }}
                    >
                      +
                    </Button>
                  </div>
                </div>
                {showSqFeet && (
                  <div className="w-full sm:w-auto min-w-0">
                    <h2 className="font-semibold mb-2">Sq.Feet</h2>
                    <Input
                      className="w-24 h-9"
                      value={selectedProduct.sqFeet || 0}
                      onChange={(e) =>
                        setSelectedProduct({
                          ...selectedProduct,
                          sqFeet: Number(e.target.value) || 0,
                        })
                      }
                      type="number"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
                <div className="w-full sm:w-auto min-w-0">
                  <Label className="text-[17px] mb-2">Price</Label>
                  <Input
                    className="w-fit h-9"
                    value={selectedProduct.price || 0}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        price: Number(e.target.value) || 0,
                      })
                    }
                    type="number"
                    min="0"
                  />
                </div>
              </div>
              <div className="mt-6 w-full overflow-x-auto rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="p-6">Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      {showSqFeet && <TableHead>Sq.Feet</TableHead>}
                      <TableHead>Price</TableHead>
                      <TableHead>Item Price</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceItems.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium pl-6 p-6 text-[16px]">
                          {product.name}
                        </TableCell>
                        <TableCell>
                          <span className="border dark:border-gray-700 dark:text-white rounded-lg text-black text-sm px-2 py-1">
                            {product.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-[16px]">
                          {product.quantity}{showPcsInQty ? " Pcs" : ""}
                        </TableCell>
                        {showSqFeet && (
                          <TableCell className="text-[16px]">
                            {product.sqFeet?.toFixed(2) || "0.00"}
                          </TableCell>
                        )}
                        <TableCell className="text-start text-[16px]">
                          ₹{product.price * product.quantity}
                        </TableCell>
                        <TableCell className="text-start text-[16px]">
                          ₹{product.price}
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <button
                            onClick={() => handleProductDelete(product.id)}
                            className="hover:rounded-md hover:bg-red-700 px-4 py-2"
                            title="Delete item"
                          >
                            <Trash2 width={16} />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 w-full">
        <CardContent>
          <TemplateCarousel
            templates={templates}
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
            invoiceData={invoiceData}
          />
        </CardContent>
      </Card>

      <div className="container relative mt-8 w-full overflow-x-auto ">
        {/* @ts-ignore */}
        <SelectedTemplate invoiceData={invoiceData} />
      </div>

      <div className="container mt-12 w-full flex justify-center">
        <Button
          onClick={handleSaveInvoice}
          disabled={saveInvoiceMutation.isPending}
          className="w-full max-w-md h-16  p-5 px-12 text-lg font-bold bg-gray-800 border border-gray-700 text-white shadow-lg rounded-xl hover:scale-[1.02] hover:bg-black transition-all duration-200 focus:ring-4 cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saveInvoiceMutation.isPending ? "Saving..." : "Save Invoice"}
        </Button>
      </div>
    </div>
  );
}

export default Invoice;