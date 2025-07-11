import React, { useRef, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { formatCurrency } from '@/lib/formatCurrency';
import QRCode from "react-qr-code"
import { Printer, QrCode, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import ModernInvoiceDownloadButton from './ModernInvoicePDF';

import { toast } from 'sonner';
import { Button } from '../ui/button';

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

// Helper function to convert number to words (simplified version)
const numberToWords = (num: number): string => {
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];

  if (num === 0) return 'ZERO';

  let result = '';

  if (num >= 100000) {
    const lakhs = Math.floor(num / 100000);
    result += ones[lakhs] + ' LAKH ';
    num %= 100000;
  }

  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    if (thousands >= 10 && thousands < 20) {
      result += teens[thousands - 10] + ' THOUSAND ';
    } else {
      if (thousands >= 20) {
        result += tens[Math.floor(thousands / 10)] + ' ';
      }
      if (thousands % 10 > 0) {
        result += ones[thousands % 10] + ' ';
      }
      result += 'THOUSAND ';
    }
    num %= 1000;
  }

  if (num >= 100) {
    result += ones[Math.floor(num / 100)] + ' HUNDRED ';
    num %= 100;
  }

  if (num >= 20) {
    result += tens[Math.floor(num / 10)] + ' ';
    if (num % 10 > 0) {
      result += ones[num % 10] + ' ';
    }
  } else if (num >= 10) {
    result += teens[num - 10] + ' ';
  } else if (num > 0) {
    result += ones[num] + ' ';
  }

  return result.trim();
};

const ModernInvoiceTemplate: React.FC<{ invoiceData: InvoiceData }> = ({ invoiceData }) => {
  const { customerBillTo, invoiceNumber, invoiceDate, items, companyDetails } = invoiceData;
  const contentRef = useRef<HTMLDivElement>(null);
  const url = window.location.href;
  const [loading, setLoading] = useState(false);

  // Split items based on pagination rules
  const firstPageItems = items.slice(0, 7);
  const remainingItems = items.slice(7);
  const additionalPages: Array<Array<typeof items[0]>> = [];

  // Split remaining items into pages of 14 each
  for (let i = 0; i < remainingItems.length; i += 14) {
    additionalPages.push(remainingItems.slice(i, i + 14));
  }

  const totalInWords = numberToWords(Math.floor(invoiceData.total)) + ' RUPEES ONLY';

  const handlePrint = useReactToPrint({
    contentRef: contentRef,
    documentTitle: `Modern-Invoice-${invoiceNumber}`,
  });

  const renderHeader = () => (
    <div className="border-2 border-black mb-4 flex text-black ">
      {/* Left Side - Logo and Company Info */}
      <div className="flex-1 flex">
        {/* Logo Area */}
        <div className="w-40 p-4 bg-blue-50 flex flex-col items-center justify-center border-r border-black">
          <img src="/logo.png" alt="logo" className="w-full h-full" />
        </div>
        {/* Company Info */}
        <div className="flex-1 p-4">
          <h1 className="text-2xl font-bold text-blue-800 text-left mb-2">{companyDetails.name}</h1>
          <div className="flex justify-between">
            <div className="text-xs text-left space-y-1 mb-2">
              <p>Tel: {companyDetails.phone}</p>
              <p>Email: {companyDetails.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - QR Code and Address */}
      <div className="flex items-center justify-between">
        {/* Address */}
        <div className="p-0">
          <div className="text-xs space-y-1">
            <p className='text-xs w-40 text-left'>
              {companyDetails.address}, {companyDetails.cityState}
            </p>
          </div>
        </div>
        {/* QR Code */}
        <div className='w-40 p-4 bg-gray-50 flex flex-col items-center justify-center'>
          <QRCode size={120} value={`${import.meta.env.VITE_FRONTEND_URL}/invoice/${invoiceData.id}`} title={`${import.meta.env.VITE_FRONTEND_URL}/invoice/${invoiceData.id}`} />
        </div>
      </div>
    </div>
  );

  const renderGSTINSection = () => (
    <div className="border border-black flex text-black">
      <div className="flex-1 p-3">
        <span className="text-md font-bold">GSTIN: 24HDE7487RE5RT4</span>
      </div>
    </div>
  );

  const renderCustomerDetails = () => (
    <div className="border border-black mb-4 flex text-black">
      {/* Invoice Details (now first/left) */}
      <div className="flex-1 p-4 border-r border-black">
        <div className="text-xs space-y-2">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex gap-2">
              <span>Invoice No.</span>
              <span className="font-bold">{invoiceNumber}</span>
            </div>
            <div className="flex gap-2">
              <span>Invoice Date</span>
              <span className="font-bold">{invoiceDate}</span>
            </div>
            <div className="flex gap-2">
              <span>Challan No.</span>
              <span className="font-bold">{invoiceData.challanNo || '-'}</span>
            </div>
            <div className="flex gap-2">
              <span>Challan Date</span>
              <span className="font-bold">{invoiceData.challanDate || '-'}</span>
            </div>
            <div className="flex gap-2">
              <span>P.O. No.</span>
              <span className="font-bold">{invoiceData.poNo || '-'}</span>
            </div>
            <div className="flex gap-2">
              <span>Reverse Charge</span>
              <span>No</span>
            </div>
            <div className="flex gap-2">
              <span>DELIVERY DATE</span>
              <span className='font-bold'>{invoiceDate}</span>
            </div>
            <div className="flex gap-2">
              <span>Due Date</span>
              <span className='font-bold'>-</span>
            </div>
          </div>
          <div className="flex gap-4 mt-2">
            <span>E-Way No.</span>
            <span className="font-bold">{invoiceData.eWayNo || '-'}</span>
          </div>
        </div>
      </div>

      {/* Bill To Detail (middle) */}
      <div className="flex-1 py-2 px-0 border-r border-black">
        <div className="text-xs font-bold text-center border-b border-black pb-1 mb-2">Bill To</div>
        <div className="text-xs space-y-1 px-4">
          <p><span className="font-bold">M/S:</span> {customerBillTo.name}</p>
          <p><span className="font-bold">Address:</span> {customerBillTo.address}</p>
          <p><span className="font-bold">PHONE:</span> {customerBillTo.phoneNumber || '-'}</p>
          <p><span className="font-bold">GSTIN:</span> {customerBillTo.gstNumber || '-'}</p>
        </div>
      </div>

      {/* Ship To Detail (rightmost) */}
      <div className="flex-1 py-2 px-0">
        <div className="text-xs font-bold text-center border-b border-black pb-1 mb-2">Ship To</div>
        <div className="text-xs space-y-1 px-4">
          <p><span className="font-bold">M/S:</span> {invoiceData.customerShipTo.name}</p>
          <p><span className="font-bold">Address:</span> {invoiceData.customerShipTo.address}</p>
          <p><span className="font-bold">PHONE:</span> {invoiceData.customerShipTo.phoneNumber || '-'}</p>
          <p><span className="font-bold">GSTIN:</span> {invoiceData.customerShipTo.gstNumber || '-'}</p>
        </div>
      </div>
    </div>
  );

  const renderItemsTable = (pageItems: typeof items, pageNumber: number, isFirstPage: boolean = false, isLastPage: boolean = false, startIndex: number = 0) => (
    <div className="border border-black mb-4 text-black">
      <Table className="w-full">
        {isFirstPage && (
          <TableHeader>
            <TableRow className="bg-gray-100 border-b border-black text-black">
              <TableHead className="border-r border-black text-center text-black text-xs font-bold p-2 w-12">Sr. No.</TableHead>
              <TableHead className="border-r border-black text-center text-black text-xs font-bold p-2 w-56">Name of Product / Service</TableHead>
              <TableHead className="border-r border-black text-center text-black text-xs font-bold p-2 w-16">HSN / SAC</TableHead>
              <TableHead className="border-r border-black text-center text-black text-xs font-bold p-2 w-16">Qty</TableHead>
              {invoiceData.showSqFeet && (
                <TableHead className="border-r border-black text-center text-black text-xs font-bold p-2 w-20">Sq.Feet</TableHead>
              )}
              <TableHead className="border-r border-black text-center text-black text-xs font-bold p-2 w-16">Rate</TableHead>
              <TableHead className="border-r border-black text-center text-black text-xs font-bold p-2 w-20">Taxable Value</TableHead>
              <TableHead className="border-r border-black text-center text-black text-xs font-bold p-2 w-12">IGST %</TableHead>
              <TableHead className="border-r border-black text-center text-black text-xs font-bold p-2 w-16">Amount</TableHead>
              <TableHead className="text-center text-black text-xs font-bold p-2 w-16">Total</TableHead>
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {pageItems.map((item, index) => (
            <TableRow key={item.id} className="border-b border-black">
              <TableCell className="border-r border-black text-center text-xs p-2">{startIndex + index + 1}</TableCell>
              <TableCell className="border-r border-black text-left text-xs p-2 w-56">{item.name}</TableCell>
              <TableCell className="border-r border-black text-center text-xs p-2">{item.hsnCode || '-'}</TableCell>
              <TableCell className="border-r border-black text-center text-xs p-2">
                {item.quantity}{invoiceData.showPcsInQty ? " Pcs" : ""}
              </TableCell>
              {invoiceData.showSqFeet && (
                <TableCell className="border-r border-black text-center text-xs p-2">{item.sqFeet && item.sqFeet > 0 ? item.sqFeet.toFixed(2) : '-'}</TableCell>
              )}
              <TableCell className="border-r border-black text-center text-xs p-2">{item.price.toFixed(2)}</TableCell>
              <TableCell className="border-r border-black text-center text-xs p-2">{(item.price * item.quantity).toFixed(2)}</TableCell>
              <TableCell className="border-r border-black text-center text-xs p-2">{invoiceData.gstRate.toFixed(1)}</TableCell>
              <TableCell className="border-r border-black text-center text-xs p-2">{((item.price * item.quantity) * (invoiceData.gstRate / 100)).toFixed(2)}</TableCell>
              <TableCell className="text-center text-xs p-2">{((item.price * item.quantity) * (1 + invoiceData.gstRate / 100)).toFixed(2)}</TableCell>
            </TableRow>
          ))}
          {/* Only show total row on last page */}
          {isLastPage && (
            <TableRow className="bg-gray-100 border-b border-black">
              <TableCell className="border-r border-black text-center text-xs p-2"></TableCell>
              {invoiceData.showSqFeet && (
                <TableCell className="border-r border-black text-center text-xs font-bold p-2 w-56">Total</TableCell>
              )}
              <TableCell className="border-r border-black text-center text-xs p-2"></TableCell>
              <TableCell className="border-r border-black text-center text-xs font-bold p-2">{items.reduce((sum, item) => sum + item.quantity, 0)}.00</TableCell>
              {invoiceData.showSqFeet && (
                <TableCell className="border-r border-black text-center text-xs p-2"></TableCell>
              )}
              <TableCell className="border-r border-black text-center text-xs p-2"></TableCell>
              <TableCell className="border-r border-black text-center text-xs font-bold p-2">{invoiceData.subtotal.toFixed(2)}</TableCell>
              <TableCell className="border-r border-black text-center text-xs p-2"></TableCell>
              <TableCell className="border-r border-black text-center text-xs font-bold p-2">{invoiceData.gstAmount.toFixed(2)}</TableCell>
              <TableCell className="text-center text-xs font-bold p-2">{invoiceData.total.toFixed(2)}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderFooterContent = () => (
    <>
      {/* Bank Details and Tax Summary */}
      <div className="border border-black mb-4 flex text-black">
        <div className="flex-1 p-4 border-r border-black">
          <h3 className="text-xs font-bold mb-2">Bank Details</h3>
          <div className="text-xs space-y-1">
            <p>Bank Name: State Bank of India</p>
            <p>Branch Name: RAF CAMP</p>
            <p>Bank Account Number: 200000004512</p>
            <p>Bank Branch IFSC: SBIN0000488</p>
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="text-xs space-y-1">
            <p className="font-bold">Taxable Amount: {formatCurrency(invoiceData.subtotal)}</p>
            {invoiceData.packaging !== undefined && (
              <p>Packaging: {formatCurrency(invoiceData.packaging)}</p>
            )}
            {invoiceData.transportationAndOthers !== undefined && (
              <p>Transportation & Others: {formatCurrency(invoiceData.transportationAndOthers)}</p>
            )}
            <p>Add : IGST: {formatCurrency(invoiceData.gstAmount)}</p>
            <p>Total Tax: {formatCurrency(invoiceData.gstAmount)}</p>
            <p className="font-bold">Total Amount After Tax: ₹ {formatCurrency(invoiceData.total)}</p>
            <p className="text-xs mt-2">(E & O.E.)</p>
            <p className="text-xs">GST Payable on Reverse Charge: N.A.</p>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="border border-black p-4 mb-4 text-black">
        <h3 className="text-xs font-bold mb-2">Terms and Conditions</h3>
        <div className="text-xs space-y-1">
          <p>1. Subject to Pune Jurisdiction</p>
          <p>2. Invoice shows actual price of goods; all particulars true and correct</p>
          <p>3. 21% interest charged if payment not made by due date</p>
          <p>4. Responsibility ceases after goods leave our premises</p>
          <p>5. No returns or exchanges for sold goods</p>
        </div>
      </div>

      {/* Signature Section */}
      <div className="border border-black flex h-20 text-black">
        <div className="flex-1 p-4 border-r border-black">
          <p className="text-xs">Certified that the particulars given above are true and correct.</p>
        </div>
        <div className="w-40 p-4 text-center">
          <p className="text-xs font-bold mt-2">Authorised Signatory</p>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-neutral-900 rounded-lg py-8 px-4">
      {/* Action Buttons */}
      {!url.includes('billing') ? '' : (
        <div className="max-w-4xl mx-auto mb-4 flex gap-4">
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-700 text-white font-bold rounded shadow hover:bg-blue-900 transition-colors"
            disabled={loading}
          >
            Print
          </button>
          <ModernInvoiceDownloadButton
            invoiceData={invoiceData}
            qrCode={`${import.meta.env.VITE_FRONTEND_URL}/invoice/${invoiceData.id}`}
          />
        </div>
      )}

      {/* Invoice Pages */}
      <div ref={contentRef} className="space-y-8" data-pdf-content="true">
        {/* First Page */}
        <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg">
          {renderHeader()}
          {renderGSTINSection()}
          {renderCustomerDetails()}
          {renderItemsTable(firstPageItems, 1, true, additionalPages.length === 0, 0)}
          {additionalPages.length === 0 && renderFooterContent()}

          <div className="text-center text-xs text-gray-500 mt-4">
            Invoice No: {invoiceNumber} | Invoice Date: {invoiceDate} | Page 1 of {additionalPages.length + 1}
          </div>
        </div>

        {/* Additional Pages */}
        {additionalPages.map((pageItems, pageIndex) => (
          <div key={pageIndex} className="max-w-4xl mx-auto bg-white p-8 shadow-lg">
            {renderItemsTable(pageItems, pageIndex + 2, false, pageIndex === additionalPages.length - 1, 7 + pageIndex * 14)}
            {pageIndex === additionalPages.length - 1 && renderFooterContent()}

            <div className="text-center text-xs text-gray-500 mt-4">
              Invoice No: {invoiceNumber} | Invoice Date: {invoiceDate} | Page {pageIndex + 2} of {additionalPages.length + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModernInvoiceTemplate;






