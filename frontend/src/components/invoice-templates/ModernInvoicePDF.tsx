import React, { useEffect, useState } from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
    Image,
    usePDF
} from '@react-pdf/renderer';
import { formatCurrency } from '@/lib/formatCurrency';
import Poppins from '../../../public/fonts/Poppins-Regular.ttf';
import { Download } from 'lucide-react';

Font.register({ family: 'Poppins', src: Poppins });

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
};

const styles = StyleSheet.create({
    page: {
        padding: 20,
        fontSize: 12,
        fontFamily: 'Poppins',
        backgroundColor: '#fff',
        color: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#000',
        padding: 10,
    },
    companyInfo: {
        flex: 1,
    },
    companyName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 5,
    },
    companyDetails: {
        fontSize: 10,
        marginBottom: 2,
    },
    qrCode: {
        width: 80,
        height: 80,
    },
    mainContent: {
        borderWidth: 1,
        borderColor: '#000',
        marginBottom: 10,
    },
    customerSection: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#000',
    },
    billTo: {
        flex: 1,
        padding: 5,
        borderRightWidth: 1,
        borderColor: '#000',
    },
    shipTo: {
        flex: 1,
        padding: 5,
        borderRightWidth: 1,
        borderColor: '#000',
    },
    invoiceDetails: {
        flex: 1,
        padding: 5,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center',
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 2,
        fontSize: 10,
    },
    detailLabel: {
        flex: 1,
        fontWeight: 'bold',
    },
    detailValue: {
        flex: 2,
    },
    table: {
        width: '100%',
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#000',
        backgroundColor: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#000',
        fontSize: 10,
    },
    tableCell: {
        padding: 4,
        textAlign: 'left',
    },
    tableCellCenter: {
        padding: 4,
        textAlign: 'center',
    },
    tableCellRight: {
        padding: 4,
        textAlign: 'right',
    },
    bankDetails: {
        marginTop: 10,
        padding: 5,
        borderWidth: 1,
        borderColor: '#000',
    },
    bankTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    bankText: {
        fontSize: 10,
        marginBottom: 2,
    },
    termsSection: {
        marginTop: 10,
        padding: 5,
        borderWidth: 1,
        borderColor: '#000',
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        fontSize: 8,
    },
});

const ModernInvoicePDF: React.FC<{ invoiceData: InvoiceData | null, qrCode: string }> = ({ invoiceData, qrCode }) => {
    if (!invoiceData) return null;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>{invoiceData.companyDetails.name}</Text>
                        <Text style={styles.companyDetails}>{invoiceData.companyDetails.address}</Text>
                        <Text style={styles.companyDetails}>Nagar, Near Katraj Tunnel</Text>
                        <Text style={styles.companyDetails}>NH4, Shindewadi, Tal-Bhor</Text>
                        <Text style={styles.companyDetails}>Tel: {invoiceData.companyDetails.phone}</Text>
                        <Text style={styles.companyDetails}>Web: www.gfttools.com</Text>
                        <Text style={styles.companyDetails}>Email: info@gfttools.com</Text>
                    </View>
                    <View>
                        {qrCode ? (
                            <Image src={qrCode} style={styles.qrCode} />
                        ) : (
                            <View style={styles.qrCode} />
                        )}
                    </View>
                </View>

                {/* GSTIN Section */}
                <View style={{ borderWidth: 1, borderColor: '#000', padding: 5, marginBottom: 10 }}>
                    <Text style={{ fontSize: 10 }}>GSTIN: 24HDE7487RE5RT4</Text>
                </View>

                {/* Main Content */}
                <View style={styles.mainContent}>
                    <View style={styles.customerSection}>
                        <View style={styles.billTo}>
                            <Text style={styles.sectionTitle}>Bill To</Text>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>M/S:</Text>
                                <Text style={styles.detailValue}>{invoiceData.customerBillTo.name}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Address:</Text>
                                <Text style={styles.detailValue}>{invoiceData.customerBillTo.address}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>PHONE:</Text>
                                <Text style={styles.detailValue}>{invoiceData.customerBillTo.phoneNumber || '-'}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>GSTIN:</Text>
                                <Text style={styles.detailValue}>{invoiceData.customerBillTo.gstNumber || '-'}</Text>
                            </View>
                        </View>
                        <View style={styles.shipTo}>
                            <Text style={styles.sectionTitle}>Ship To</Text>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>M/S:</Text>
                                <Text style={styles.detailValue}>{invoiceData.customerShipTo.name}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Address:</Text>
                                <Text style={styles.detailValue}>{invoiceData.customerShipTo.address}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>PHONE:</Text>
                                <Text style={styles.detailValue}>{invoiceData.customerShipTo.phoneNumber || '-'}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>GSTIN:</Text>
                                <Text style={styles.detailValue}>{invoiceData.customerShipTo.gstNumber || '-'}</Text>
                            </View>
                        </View>
                        <View style={styles.invoiceDetails}>
                            <Text style={styles.sectionTitle}>TAX INVOICE</Text>
                            <View style={{ flexDirection: 'row' }}>
                                <View style={{ flex: 1, borderRightWidth: 1, borderColor: '#000' }}>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Invoice No:</Text>
                                        <Text style={styles.detailValue}>{invoiceData.invoiceNumber}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Challan No:</Text>
                                        <Text style={styles.detailValue}>{invoiceData.challanNo || '-'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>DELIVERY DATE:</Text>
                                        <Text style={styles.detailValue}>{invoiceData.invoiceDate}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>P.O. No:</Text>
                                        <Text style={styles.detailValue}>{invoiceData.poNo || '-'}</Text>
                                    </View>
                                </View>
                                <View style={{ flex: 1, paddingLeft: 5 }}>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Invoice Date:</Text>
                                        <Text style={styles.detailValue}>{invoiceData.invoiceDate}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Challan Date:</Text>
                                        <Text style={styles.detailValue}>{invoiceData.challanDate || '-'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Reverse Charge:</Text>
                                        <Text style={styles.detailValue}>No</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>E-Way No:</Text>
                                        <Text style={styles.detailValue}>{invoiceData.eWayNo || '-'}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Table */}
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableCell, { flex: 0.5 }]}>Sr. No.</Text>
                            <Text style={[styles.tableCell, { flex: 2 }]}>Name of Product / Service</Text>
                            <Text style={[styles.tableCell, { flex: 1 }]}>HSN / SAC</Text>
                            <Text style={[styles.tableCellCenter, { flex: 0.5 }]}>Qty</Text>
                            <Text style={[styles.tableCellRight, { flex: 1 }]}>Rate</Text>
                            <Text style={[styles.tableCellRight, { flex: 1 }]}>Taxable Value</Text>
                            <Text style={[styles.tableCellCenter, { flex: 0.5 }]}>IGST %</Text>
                            <Text style={[styles.tableCellRight, { flex: 1 }]}>Amount</Text>
                        </View>
                        {invoiceData.items.map((item, index) => (
                            <View style={styles.tableRow} key={item.id}>
                                <Text style={[styles.tableCell, { flex: 0.5 }]}>{index + 1}</Text>
                                <Text style={[styles.tableCell, { flex: 2 }]}>{item.name}</Text>
                                <Text style={[styles.tableCell, { flex: 1 }]}>{item.hsnCode}</Text>
                                <Text style={[styles.tableCellCenter, { flex: 0.5 }]}>{item.quantity}</Text>
                                <Text style={[styles.tableCellRight, { flex: 1 }]}>{formatCurrency(item.price)}</Text>
                                <Text style={[styles.tableCellRight, { flex: 1 }]}>{formatCurrency(item.price * item.quantity)}</Text>
                                <Text style={[styles.tableCellCenter, { flex: 0.5 }]}>{item.igstPercent || 0}</Text>
                                <Text style={[styles.tableCellRight, { flex: 1 }]}>{formatCurrency((item.price * item.quantity) * (1 + (item.igstPercent || 0) / 100))}</Text>
                            </View>
                        ))}
                        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                            <Text style={[styles.tableCell, { flex: 0.5 }]}>Total</Text>
                            <Text style={[styles.tableCell, { flex: 2 }]}></Text>
                            <Text style={[styles.tableCell, { flex: 1 }]}></Text>
                            <Text style={[styles.tableCellCenter, { flex: 0.5 }]}>0.00</Text>
                            <Text style={[styles.tableCellRight, { flex: 1 }]}>0.00</Text>
                            <Text style={[styles.tableCellRight, { flex: 1 }]}>0.00</Text>
                            <Text style={[styles.tableCellCenter, { flex: 0.5 }]}></Text>
                            <Text style={[styles.tableCellRight, { flex: 1 }]}>0.00</Text>
                        </View>
                    </View>
                </View>

                {/* Bank Details */}
                <View style={styles.bankDetails}>
                    <Text style={styles.bankTitle}>Bank Details</Text>
                    <Text style={styles.bankText}>Bank Name: State Bank of India</Text>
                    <Text style={styles.bankText}>Branch Name: RAF CAMP</Text>
                    <Text style={styles.bankText}>Bank Account Number: 20000000452</Text>
                    <Text style={styles.bankText}>Bank Branch IFSC: SBIN000488</Text>
                </View>

                {/* Terms and Conditions */}
                <View style={styles.termsSection}>
                    <Text style={styles.bankTitle}>Terms and Conditions</Text>
                    <Text style={styles.bankText}>1. Subject to Ahmedabad Jurisdiction.</Text>
                    <Text style={styles.bankText}>2. Our responsibility ceases as soon as the goods leave our premises.</Text>
                    <Text style={styles.bankText}>3. Goods once sold will not be taken back.</Text>
                    <Text style={styles.bankText}>4. Delivery ex-premises.</Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Invoice No: {invoiceData.invoiceNumber} | Invoice Date: {invoiceData.invoiceDate} | Page 1 of 1</Text>
                </View>
            </Page>
        </Document>
    );
};

const ModernInvoicePDFWrapper: React.FC<{ invoiceData: InvoiceData | null, qrCode: string, autoDownload?: boolean }> = ({ invoiceData, qrCode, autoDownload }) => {
    const [instance, updateInstance] = usePDF({ document: <ModernInvoicePDF invoiceData={invoiceData} qrCode={qrCode} /> });

    React.useEffect(() => {
        if (autoDownload && instance.url) {
            window.open(instance.url, '_blank');
        }
    }, [autoDownload, instance.url]);

    return <button className='hover:cursor-pointer' onClick={() => instance.url && window.open(instance.url, '_blank')}><Download className="h-4 w-4" /></button>;
};

export default ModernInvoicePDFWrapper;