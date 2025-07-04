import React, { useRef, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { formatCurrency } from '@/lib/formatCurrency';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import { Button } from '../ui/button';
import { Printer } from 'lucide-react';

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  invoiceDate: string;
  customerBillTo: {
    name: string;
    address: string;
    gstNumber?: string;
    panNumber?: string;
    phoneNumber?: string;
  };
  customerShipTo: {
    name: string;
    address: string;
    gstNumber?: string;
    panNumber?: string;
    phoneNumber?: string;
  };
  companyDetails: {
    name: string;
    address: string;
    cityState: string;
    phone: string;
    email: string;
    gstin: string;
  };
  items: {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    sqFeet?: number;
    hsnCode: string;
    taxableValue?: number;
    igstPercent?: number;
    amount?: number;
  }[];
  subtotal: number;
  gstAmount: number;
  gstRate: number;
  total: number;
  template: "modern" | "minimal" | "classic" | "professional";
  packaging?: number;
  transportationAndOthers?: number;
  challanNo?: string;
  challanDate?: string;
  poNo?: string;
  eWayNo?: string;
  showPcsInQty?: boolean;
  showSqFeet?: boolean;
};

const PremiumMinimalInvoice: React.FC<{ invoiceData: InvoiceData }> = ({ invoiceData }) => {
  const { customerBillTo, customerShipTo, invoiceNumber, invoiceDate, items, companyDetails } = invoiceData;
  const contentRef = useRef<HTMLDivElement>(null);
  const url = window.location.href;
  const [loading, setLoading] = useState(false);

  const calculateTotals = (items: InvoiceData['items']) => {
    return items.reduce((acc, item) => {
      const taxableValue = item.price * item.quantity;
      const igstAmount = taxableValue * ((item.igstPercent || 0) / 100);
      const totalAmount = taxableValue + igstAmount;

      return {
        quantity: acc.quantity + item.quantity,
        taxableValue: acc.taxableValue + taxableValue,
        igstAmount: acc.igstAmount + igstAmount,
        totalAmount: acc.totalAmount + totalAmount,
        totalTax: acc.totalTax + igstAmount
      };
    }, { quantity: 0, taxableValue: 0, igstAmount: 0, totalAmount: 0, totalTax: 0 });
  };

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      if (contentRef.current) {
        await html2canvas(contentRef.current, { scale: 2 }).then((canvas) => {
          const imgWidth = 210;
          const pageHeight = 297;
          const margin = 10;
          const usableWidth = imgWidth - 2 * margin;
          const usablePageHeight = pageHeight - 2 * margin;
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
          });

          const imgData = canvas.toDataURL('image/png');
          const imgProps = pdf.getImageProperties(imgData);
          const pdfHeight = (imgProps.height * usableWidth) / imgProps.width;

          if (pdfHeight <= usablePageHeight) {
            pdf.addImage(imgData, 'PNG', margin, margin, usableWidth, pdfHeight);
          } else {
            let position = 0;
            let remainingHeight = imgProps.height;
            while (remainingHeight > 0) {
              const sliceHeight = Math.min(canvas.height - position, (usablePageHeight * canvas.width) / usableWidth);
              if (sliceHeight <= 0 || canvas.width <= 0) break;

              const pageCanvas = document.createElement('canvas');
              pageCanvas.width = canvas.width;
              pageCanvas.height = sliceHeight;

              const ctx = pageCanvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = "#fff";
                ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
                ctx.drawImage(
                  canvas,
                  0,
                  position,
                  canvas.width,
                  sliceHeight,
                  0,
                  0,
                  canvas.width,
                  sliceHeight
                );
              }

              if (pageCanvas.width > 0 && pageCanvas.height > 0) {
                const pageImgData = pageCanvas.toDataURL('image/png');
                if (
                  pageImgData &&
                  pageImgData.startsWith('data:image/png;base64,') &&
                  pageImgData.length > 'data:image/png;base64,'.length
                ) {
                  if (position > 0) pdf.addPage();
                  pdf.addImage(pageImgData, 'PNG', margin, margin, usableWidth, (sliceHeight * usableWidth) / canvas.width);
                }
              }

              position += sliceHeight;
              remainingHeight -= sliceHeight;
            }
          }

          pdf.save(`minimal_invoice_${invoiceNumber}.pdf`);
        });
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: contentRef,
    documentTitle: `Minimal-Invoice-${invoiceNumber}`,
  });

  const renderItemsTable = () => (
    <div className="overflow-x-auto border text-black border-black rounded-none mb-6">
      <Table className="w-full">
        <TableHeader>
          <TableRow className="bg-white border-b border-black">
            <TableHead className="p-2 text-black font-semibold text-xs w-[40px]">Sr. No.</TableHead>
            <TableHead className="p-2 text-black font-semibold text-xs flex-[2.2]">Name of Product / Service</TableHead>
            <TableHead className="p-2 text-black font-semibold text-xs flex-[0.8]">HSN / SAC</TableHead>
            <TableHead className="p-2 text-black font-semibold text-xs text-center w-[40px]">Qty</TableHead>
            {invoiceData.showSqFeet && (
              <TableHead className="p-2 text-black font-semibold text-xs text-center w-[60px]">Sq.Feet</TableHead>
            )}
            <TableHead className="p-2 text-black font-semibold text-xs text-right w-[80px]">Rate</TableHead>
            <TableHead className="p-2 text-black font-semibold text-xs text-right flex-1">Taxable Value</TableHead>
            <TableHead className="p-2 text-black font-semibold text-xs text-center w-[40px]">IGST %</TableHead>
            <TableHead className="p-2 text-black font-semibold text-xs text-right w-[80px]">Tax Amount</TableHead>
            <TableHead className="p-2 text-black font-semibold text-xs text-right flex-1">Total Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index} className="border-b text-black border-black">
              <TableCell className="p-2 text-xs">{index + 1}</TableCell>
              <TableCell className="p-2 text-xs font-bold">{item.name}</TableCell>
              <TableCell className="p-2 text-xs">{item.hsnCode}</TableCell>
              <TableCell className="p-2 text-xs text-center">
                {item.quantity}{invoiceData.showPcsInQty ? " Pcs" : ""}
              </TableCell>
              {invoiceData.showSqFeet && (
                <TableCell className="p-2 text-xs text-center">
                  {item.sqFeet && item.sqFeet > 0 ? item.sqFeet.toFixed(2) : "-"}
                </TableCell>
              )}
              <TableCell className="p-2 text-xs text-right">{formatCurrency(item.price)}</TableCell>
              <TableCell className="p-2 text-xs text-right">{formatCurrency(item.price * item.quantity)}</TableCell>
              <TableCell className="p-2 text-xs text-center">{invoiceData.gstRate || 0}%</TableCell>
              <TableCell className="p-2 text-xs text-right">
                {formatCurrency((item.price * item.quantity) * ((invoiceData.gstRate || 0) / 100))}
              </TableCell>
              <TableCell className="p-2 text-xs text-right">
                {formatCurrency((item.price * item.quantity) * (1 + (invoiceData.gstRate || 0) / 100))}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="font-bold border-black">
            <TableCell className="p-2 text-xs">Total</TableCell>
            <TableCell className="p-2 text-xs"></TableCell>
            <TableCell className="p-2 text-xs"></TableCell>
            <TableCell className="p-2 text-xs text-center">{calculateTotals(items).quantity}</TableCell>
            {invoiceData.showSqFeet && (
              <TableCell className="p-2 text-xs text-center"></TableCell>
            )}
            <TableCell className="p-2 text-xs text-right"></TableCell>
            <TableCell className="p-2 text-xs text-right">{formatCurrency(calculateTotals(items).taxableValue)}</TableCell>
            <TableCell className="p-2 text-xs text-center"></TableCell>
            <TableCell className="p-2 text-xs text-right">{formatCurrency(invoiceData.gstAmount)}</TableCell>
            <TableCell className="p-2 text-xs text-right">{formatCurrency(invoiceData.total)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );

  const renderCustomerDetails = () => (
    <div className="border border-black mb-6 text-black bg-white">
      <div className="grid grid-cols-4 divide-x divide-black">
        {/* Invoice Details */}
        <div className="col-span-2 p-3">
          <div className="text-center font-bold border-b border-black pb-2 mb-3">TAX INVOICE</div>
          <div className="grid grid-cols-2 divide-x divide-black">
            <div className="pr-2 space-y-2">
              <div>
                <div className="text-[11px]">Invoice No:</div>
                <div className="text-xs font-bold">{invoiceData.invoiceNumber}</div>
              </div>
              <div>
                <div className="text-[11px]">Challan No:</div>
                <div className="text-xs font-bold">{invoiceData.challanNo || '-'}</div>
              </div>
              <div>
                <div className="text-[11px]">DELIVERY DATE:</div>
                <div className="text-xs font-bold">{invoiceData.invoiceDate}</div>
              </div>
              <div>
                <div className="text-[11px]">P.O. No:</div>
                <div className="text-xs font-bold">{invoiceData.poNo || '-'}</div>
              </div>
            </div>
            <div className="pl-2 space-y-2">
              <div>
                <div className="text-[11px]">Invoice Date:</div>
                <div className="text-xs font-bold">{invoiceData.invoiceDate}</div>
              </div>
              <div>
                <div className="text-[11px]">Challan Date:</div>
                <div className="text-xs font-bold">{invoiceData.challanDate || '-'}</div>
              </div>
              <div>
                <div className="text-[11px]">Reverse Charge:</div>
                <div className="text-xs font-bold">No</div>
              </div>
              <div>
                <div className="text-[11px]">E-Way No:</div>
                <div className="text-xs font-bold">{invoiceData.eWayNo || '-'}</div>
              </div>
            </div>
          </div>
        </div>
        {/* Bill To */}
        <div className="p-3">
          <div className="text-center font-bold border-b border-black pb-2 mb-3">BILL TO</div>
          <div className="space-y-2">
            <div className="flex gap-1">
              <span className="text-[11px] w-12">Name:</span>
              <span className="text-xs font-bold flex-1">{customerBillTo.name}</span>
            </div>
            <div className="flex gap-1">
              <span className="text-[11px] w-12">Address:</span>
              <span className="text-xs flex-1">{customerBillTo.address}</span>
            </div>
            <div className="flex gap-1">
              <span className="text-[11px] w-12">PHONE:</span>
              <span className="text-xs flex-1">{customerBillTo.phoneNumber || '-'}</span>
            </div>
            <div className="flex gap-1">
              <span className="text-[11px] w-12">GSTIN:</span>
              <span className="text-xs font-bold flex-1">{customerBillTo.gstNumber || '-'}</span>
            </div>
          </div>
        </div>
        {/* Ship To */}
        <div className="p-3">
          <div className="text-center font-bold border-b border-black pb-2 mb-3">SHIP TO</div>
          <div className="space-y-2">
            <div className="flex gap-1">
              <span className="text-[11px] w-12">Name:</span>
              <span className="text-xs font-bold flex-1">{customerShipTo.name}</span>
            </div>
            <div className="flex gap-1">
              <span className="text-[11px] w-12">Address:</span>
              <span className="text-xs flex-1">{customerShipTo.address}</span>
            </div>
            <div className="flex gap-1">
              <span className="text-[11px] w-12">PHONE:</span>
              <span className="text-xs flex-1">{customerShipTo.phoneNumber || '-'}</span>
            </div>
            <div className="flex gap-1">
              <span className="text-[11px] w-12">GSTIN:</span>
              <span className="text-xs font-bold flex-1">{customerShipTo.gstNumber || '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBankAndTotalSection = () => (
    <div className="grid grid-cols-4 gap-0 -mt-6">
      <div className="col-span-2 border border-black text-black border-t-0 p-3">
        <div className="font-bold text-sm border-b border-black pb-2 mb-3">Bank Details</div>
        <div className="space-y-1">
          <div className="text-xs font-bold text-black">Bank Name: State Bank of India</div>
          <div className="text-xs font-bold text-black">Branch Name: RAF CAMP</div>
          <div className="text-xs font-bold text-black">Bank Account Number: 20000000452</div>
          <div className="text-xs font-bold text-black">Bank Branch IFSC: SBIN000488</div>
        </div>
      </div>
      <div className="col-span-2 border border-black text-black border-t-0 p-3">
        <div className="font-bold text-sm border-b border-black pb-2 mb-3">Amount Summary</div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-bold text-black">Taxable Amount:</span>
            <span className="font-bold text-black">{formatCurrency(calculateTotals(items).taxableValue)}</span>
          </div>
          {invoiceData.packaging !== undefined && (
            <div className="flex justify-between text-xs">
              <span className="font-bold text-black">Packaging:</span>
              <span className="font-bold text-black">{formatCurrency(invoiceData.packaging)}</span>
            </div>
          )}
          {invoiceData.transportationAndOthers !== undefined && (
            <div className="flex justify-between text-xs">
              <span className="font-bold text-black">Transportation & Others:</span>
              <span className="font-bold text-black">{formatCurrency(invoiceData.transportationAndOthers)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="font-bold text-black">Total Tax:</span>
            <span className="font-bold text-black">{formatCurrency(invoiceData.gstAmount)}</span>
          </div>
          <div className="flex justify-between text-xs pt-2 border-t border-black">
            <span className="font-bold text-black">Total Amount After Tax:</span>
            <span className="font-bold text-black">{formatCurrency(invoiceData.total)}</span>
          </div>
          <div className="flex justify-between text-xs mt-4">
            <span className="font-bold text-black">(E & O.E)</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="font-bold text-black">GST Payable on Reverse Charge:</span>
            <span className="font-bold text-black">N.A.</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTermsAndSignature = () => (
    <div className="grid grid-cols-4 gap-0 -mt-[1px]">
      <div className="col-span-3 border border-black text-black border-t-0 p-3">
        <div className="font-bold text-sm border-b border-black pb-2 mb-3 pl-6">Terms and Conditions</div>
        <div className="space-y-1 pl-6">
          <div className="text-xs font-bold">1. Subject to Ahmedabad Jurisdiction.</div>
          <div className="text-xs font-bold">2. Our responsibility ceases as soon as the goods leave our premises.</div>
          <div className="text-xs font-bold">3. Goods once sold will not be taken back.</div>
          <div className="text-xs font-bold">4. Delivery ex-premises.</div>
        </div>
      </div>
      <div className="border border-black text-black border-t-0 p-3 flex flex-col items-center">
        <div className="text-[10px] text-center mb-2">Certified that the particulars given above are true and correct.</div>
        <div className="text-xs font-bold mb-3">For Dynamic Enterprises</div>
        <div className="h-[30px] w-[150px] mb-2"></div>
        <div className="text-xs font-bold border-t border-black pt-2 w-[150px] text-center">Authorised Signatory</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {/* Action Buttons */}
      {!url.includes('billing') ? '' : (
        <div className="max-w-4xl mx-auto mb-4 flex gap-4">
          <Button
            onClick={handlePrint}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
      )}

      {/* Invoice Content */}
      <div ref={contentRef} className="max-w-4xl mx-auto bg-white p-8">
        {/* Header */}
        <div className="flex items-center justify-between border border-black text-black p-3 mb-6">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="w-[60px] h-[60px]" />
            <div>
              <div className="text-sm font-bold mb-1">{companyDetails.name}</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-[11px]">Tel: 9820132560, 9637831717</div>
                  <div className="text-[11px]">Web: www.gfttools.com</div>
                  <div className="text-[11px]">Email: info@gfttools.com</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[11px]">{companyDetails.address}</div>
                  <div className="text-[11px]">Nagar, Near Katraj Tunnel</div>
                  <div className="text-[11px]">NH4, Shindewadi, Tal-Bhor</div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <QRCode
              value={`${import.meta.env.VITE_FRONTEND_URL}/invoice/${invoiceData.id}`}
              size={56}
              title={`${import.meta.env.VITE_FRONTEND_URL}/invoice/${invoiceData.id}`}
            />
          </div>
        </div>

        {/* GSTIN Section */}
        <div className="flex items-center border border-black text-black border-t-0 -mt-[1px] p-2 mb-6">
          <span className="text-sm">GSTIN: </span>
          <span className="text-sm font-bold ml-1">24HDE7487RE5RT4</span>
        </div>

        {/* Customer Details */}
        {renderCustomerDetails()}

        {/* Items Table */}
        {renderItemsTable()}

        {/* Bank Details and Total Summary */}
        {renderBankAndTotalSection()}

        {/* Terms and Signature */}
        {renderTermsAndSignature()}

        {/* Footer */}
        <div className="text-[11px] text-center mt-4">
          Invoice No: {invoiceNumber} | Invoice Date: {invoiceDate} | Page 1 of 1
        </div>
      </div>
    </div>
  );
};

export default PremiumMinimalInvoice;