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
import PoppinsBold from '../../../public/fonts/Inter_24pt-Bold.ttf';
import { Download } from 'lucide-react';
import Logo from '../../../public/logo.png';

Font.register({
    family: 'Poppins',
    fonts: [
        { src: Poppins },
        { src: PoppinsBold, fontWeight: 'bold' }
    ]
});

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
        fontSize: 9,
        fontFamily: 'Poppins',
        backgroundColor: '#fff',
        color: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#000',
        padding: 8,
        gap: 10,
    },
    logoContainer: {
        width: 70,
        height: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    },
    companyInfo: {
        flex: 1,
    },
    companyName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 4,
    },
    companyContentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 2,
        gap: 20,
    },
    contactInfo: {
        flex: 1,
        display: 'flex',
        gap: 2,
    },
    addressInfo: {
        flex: 1,
        display: 'flex',
        gap: 2,
    },
    companyDetails: {
        fontSize: 8,
        lineHeight: 1.4,
    },
    qrCode: {
        width: 64,
        height: 64,
    },
    mainContent: {
        borderWidth: 1,
        borderColor: '#000',
        marginBottom: 5,
    },
    customerSection: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#000',
    },
    billTo: {
        flex: 1,
        padding: 3,
        borderRightWidth: 1,
        borderColor: '#000',
    },
    shipTo: {
        flex: 1,
        padding: 3,
        borderRightWidth: 1,
        borderColor: '#000',
    },
    invoiceDetails: {
        flex: 1,
        padding: 3,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: 'Poppins',
        marginBottom: 4,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderColor: '#000',
        paddingBottom: 2,
        marginLeft: -3,
        marginRight: -3,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 1,
        fontSize: 8,
        lineHeight: 1.2,
    },
    detailLabel: {
        fontSize: 7,
        color: '#000',
        marginBottom: 1,
    },
    detailValue: {
        fontSize: 8,
        marginBottom: 3,
        fontWeight: 'bold',
        fontFamily: 'Poppins',
    },
    addressRow: {
        flexDirection: 'row',
        marginBottom: 3,
        alignItems: 'flex-start',
        paddingLeft: 3,
    },
    addressLabel: {
        fontSize: 7,
        fontWeight: 'bold',
        color: '#000',
        width: 45,
    },
    addressValue: {
        fontSize: 8,
        flex: 1,
        paddingLeft: 2,
    },
    table: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#000',
        marginTop: -1,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#000',
        backgroundColor: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#000',
        fontSize: 8,
        minHeight: 15,
    },
    tableRowTotal: {
        flexDirection: 'row',
        borderBottomWidth: 0,
        borderColor: '#000',
        fontSize: 8,
        minHeight: 15,
        fontWeight: 'bold',
        fontFamily: 'Poppins',
    },
    tableCell: {
        padding: 2,
        textAlign: 'left',
        borderRightWidth: 1,
        borderRightColor: '#000',
        borderStyle: 'solid',
    },
    tableCellCenter: {
        padding: 2,
        textAlign: 'center',
        borderRightWidth: 1,
        borderRightColor: '#000',
        borderStyle: 'solid',
    },
    tableCellRight: {
        padding: 2,
        textAlign: 'right',
        borderRightWidth: 1,
        borderRightColor: '#000',
        borderStyle: 'solid',
    },
    tableCellLast: {
        padding: 2,
        textAlign: 'right',
        borderRightWidth: 0,
        borderStyle: 'solid',
    },
    bankAndTotalRow: {
        flexDirection: 'row',
        borderTopWidth: 0,
        marginTop: -6,
    },
    bankDetails: {
        flex: 1,
        padding: 3,
        borderWidth: 1,
        borderColor: '#000',
        borderTopWidth: 0,
        marginRight: -1,
    },
    totalSummary: {
        width: 300,
        padding: 3,
        borderWidth: 1,
        borderColor: '#000',
        borderTopWidth: 0,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 2,
        paddingHorizontal: 6,
    },
    summaryLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        fontFamily: 'Poppins',
    },
    summaryValue: {
        fontSize: 8,
        fontWeight: 'bold',
        fontFamily: 'Poppins',
        textAlign: 'right',
    },
    summaryTotal: {
        fontSize: 9,
        fontWeight: 'bold',
        fontFamily: 'Poppins',
    },
    bankTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: 'Poppins',
        marginBottom: 4,
        textAlign: 'left',
        borderBottomWidth: 1,
        borderColor: '#000',
        paddingBottom: 2,
        marginLeft: -3,
        marginRight: -3,
    },
    bankText: {
        fontSize: 8,
        marginBottom: 0,
        lineHeight: 1.2,
        fontWeight: 'bold',
        fontFamily: 'Poppins',
    },
    termsAndSignatureRow: {
        flexDirection: 'row',
        borderTopWidth: 0,
    },
    termsSection: {
        flex: 1,
        padding: 3,
        borderWidth: 1,
        borderColor: '#000',
        borderTopWidth: 0,
        marginRight: -1,
    },
    signatureSection: {
        width: 200,
        padding: 3,
        borderWidth: 1,
        borderColor: '#000',
        borderTopWidth: 0,
        flexDirection: 'column',
        alignItems: 'center',
    },
    certificationText: {
        fontSize: 6,
        textAlign: 'center',
        marginBottom: 3,
        paddingHorizontal: 5,
    },
    companyNameText: {
        fontSize: 8,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
        fontFamily: 'Poppins',
    },
    signatureSpace: {
        height: 40,
        width: 150,
        marginBottom: 2,
    },
    signatureBox: {
        fontSize: 9,
        fontWeight: 'bold',
        fontFamily: 'Poppins',
        textAlign: 'center',
        width: 150,
        borderTopWidth: 1,
        borderColor: '#000',
        paddingTop: 2,
    },
    addressTitle: {
        fontSize: 11,
        fontFamily: 'Poppins',
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'center',
        textTransform: 'uppercase',
        borderBottomWidth: 1,
        borderColor: '#000',
        marginLeft: -3,
        marginRight: -3,
        paddingBottom: 2,
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        fontSize: 7,
        textAlign: 'center',
    },
    gstinSection: {
        borderWidth: 1,
        borderColor: '#000',
        padding: 5,
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 0,
    },
    gstinLabel: {
        fontSize: 10,
    },
    gstinValue: {
        fontSize: 10,
        fontFamily: 'Poppins',
        fontWeight: 'bold',
    },
});

const ModernInvoicePDF: React.FC<{ invoiceData: InvoiceData | null, qrCode: string }> = ({ invoiceData, qrCode }) => {
    if (!invoiceData) return null;

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

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Image src={Logo} style={styles.logo} />
                    </View>
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>{invoiceData.companyDetails.name}</Text>
                        <View style={styles.companyContentRow}>
                            <View style={styles.contactInfo}>
                                <Text style={styles.companyDetails}>Tel: 9820132560, 9637831717</Text>
                                <Text style={styles.companyDetails}>Web: www.gfttools.com</Text>
                                <Text style={styles.companyDetails}>Email: info@gfttools.com</Text>
                            </View>
                            <View style={styles.addressInfo}>
                                <Text style={styles.companyDetails}>{invoiceData.companyDetails.address}</Text>
                                <Text style={styles.companyDetails}>Nagar, Near Katraj Tunnel</Text>
                                <Text style={styles.companyDetails}>NH4, Shindewadi, Tal-Bhor</Text>
                            </View>
                        </View>
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
                <View style={styles.gstinSection}>
                    <Text style={styles.gstinLabel}>GSTIN: </Text>
                    <Text style={styles.gstinValue}>24HDE7487RE5RT4</Text>
                </View>

                {/* Main Content */}
                <View style={styles.mainContent}>
                    <View style={styles.customerSection}>
                        <View style={styles.billTo}>
                            <Text style={styles.addressTitle}>Bill To</Text>

                            <View style={styles.addressRow}>
                                <Text style={styles.addressLabel}>Name:</Text>
                                <Text style={[styles.addressValue, { fontWeight: 'bold' }]}>{invoiceData.customerBillTo.name}</Text>
                            </View>

                            <View style={styles.addressRow}>
                                <Text style={styles.addressLabel}>Address:</Text>
                                <Text style={styles.addressValue}>{invoiceData.customerBillTo.address}</Text>
                            </View>

                            <View style={styles.addressRow}>
                                <Text style={styles.addressLabel}>PHONE:</Text>
                                <Text style={styles.addressValue}>{invoiceData.customerBillTo.phoneNumber || '-'}</Text>
                            </View>

                            <View style={styles.addressRow}>
                                <Text style={styles.addressLabel}>GSTIN:</Text>
                                <Text style={[styles.addressValue, { fontWeight: 'bold' }]}>{invoiceData.customerBillTo.gstNumber || '-'}</Text>
                            </View>
                        </View>

                        <View style={styles.shipTo}>
                            <Text style={styles.addressTitle}>Ship To</Text>

                            <View style={styles.addressRow}>
                                <Text style={styles.addressLabel}>Name:</Text>
                                <Text style={[styles.addressValue, { fontWeight: 'bold' }]}>{invoiceData.customerShipTo.name}</Text>
                            </View>

                            <View style={styles.addressRow}>
                                <Text style={styles.addressLabel}>Address:</Text>
                                <Text style={styles.addressValue}>{invoiceData.customerShipTo.address}</Text>
                            </View>

                            <View style={styles.addressRow}>
                                <Text style={styles.addressLabel}>PHONE:</Text>
                                <Text style={styles.addressValue}>{invoiceData.customerShipTo.phoneNumber || '-'}</Text>
                            </View>

                            <View style={styles.addressRow}>
                                <Text style={styles.addressLabel}>GSTIN:</Text>
                                <Text style={[styles.addressValue, { fontWeight: 'bold' }]}>{invoiceData.customerShipTo.gstNumber || '-'}</Text>
                            </View>
                        </View>
                        <View style={styles.invoiceDetails}>
                            <Text style={styles.sectionTitle}>TAX INVOICE</Text>
                            <View style={{ flexDirection: 'row' }}>
                                <View style={{ flex: 1, padding: 2, borderRightWidth: 1, borderColor: '#000' }}>
                                    <Text style={styles.detailLabel}>Invoice No:</Text>
                                    <Text style={styles.detailValue}>{invoiceData.invoiceNumber}</Text>

                                    <Text style={styles.detailLabel}>Challan No:</Text>
                                    <Text style={styles.detailValue}>{invoiceData.challanNo || '-'}</Text>

                                    <Text style={styles.detailLabel}>DELIVERY DATE:</Text>
                                    <Text style={styles.detailValue}>{invoiceData.invoiceDate}</Text>

                                    <Text style={styles.detailLabel}>P.O. No:</Text>
                                    <Text style={styles.detailValue}>{invoiceData.poNo || '-'}</Text>
                                </View>
                                <View style={{ flex: 1, padding: 2, paddingLeft: 4 }}>
                                    <Text style={styles.detailLabel}>Invoice Date:</Text>
                                    <Text style={styles.detailValue}>{invoiceData.invoiceDate}</Text>

                                    <Text style={styles.detailLabel}>Challan Date:</Text>
                                    <Text style={styles.detailValue}>{invoiceData.challanDate || '-'}</Text>

                                    <Text style={styles.detailLabel}>Reverse Charge:</Text>
                                    <Text style={styles.detailValue}>No</Text>

                                    <Text style={styles.detailLabel}>E-Way No:</Text>
                                    <Text style={styles.detailValue}>{invoiceData.eWayNo || '-'}</Text>
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
                            <Text style={[styles.tableCellRight, { flex: 1 }]}>Tax Amount</Text>
                            <Text style={[styles.tableCellLast, { flex: 1 }]}>Total Amount</Text>
                        </View>
                        {invoiceData.items.map((item, index) => (
                            <View style={styles.tableRow} key={item.id}>
                                <Text style={[styles.tableCell, { flex: 0.5 }]}>{index + 1}</Text>
                                <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>{item.name}</Text>
                                <Text style={[styles.tableCell, { flex: 1 }]}>{item.hsnCode}</Text>
                                <Text style={[styles.tableCellCenter, { flex: 0.5 }]}>{item.quantity}</Text>
                                <Text style={[styles.tableCellRight, { flex: 1 }]}>{formatCurrency(item.price)}</Text>
                                <Text style={[styles.tableCellRight, { flex: 1 }]}>{formatCurrency(item.price * item.quantity)}</Text>
                                <Text style={[styles.tableCellCenter, { flex: 0.5 }]}>{invoiceData.gstRate || 0}%</Text>
                                <Text style={[styles.tableCellRight, { flex: 1 }]}>{formatCurrency((item.price * item.quantity) * ((invoiceData.gstRate || 0) / 100))}</Text>
                                <Text style={[styles.tableCellLast, { flex: 1 }]}>{formatCurrency((item.price * item.quantity) * (1 + (invoiceData.gstRate || 0) / 100))}</Text>
                            </View>
                        ))}
                        <View style={styles.tableRowTotal}>
                            <Text style={[styles.tableCell, { flex: 0.5 }]}>Total</Text>
                            <Text style={[styles.tableCell, { flex: 2 }]}></Text>
                            <Text style={[styles.tableCell, { flex: 1 }]}></Text>
                            <Text style={[styles.tableCellCenter, { flex: 0.5 }]}>{calculateTotals(invoiceData.items).quantity}</Text>
                            <Text style={[styles.tableCellRight, { flex: 1 }]}></Text>
                            <Text style={[styles.tableCellRight, { flex: 1 }]}>{formatCurrency(calculateTotals(invoiceData.items).taxableValue)}</Text>
                            <Text style={[styles.tableCellCenter, { flex: 0.5 }]}></Text>
                            <Text style={[styles.tableCellRight, { flex: 1 }]}>{formatCurrency(invoiceData.gstAmount)}</Text>
                            <Text style={[styles.tableCellLast, { flex: 1 }]}>{formatCurrency(invoiceData.total)}</Text>
                        </View>
                    </View>
                </View>

                {/* Bank Details and Total Summary */}
                <View style={styles.bankAndTotalRow}>
                    <View style={styles.bankDetails}>
                        <Text style={[styles.bankTitle, { paddingLeft: 6 }]}>Bank Details</Text>
                        <Text style={[styles.bankText, { paddingLeft: 6 }]}>Bank Name: State Bank of India</Text>
                        <Text style={[styles.bankText, { paddingLeft: 6 }]}>Branch Name: RAF CAMP</Text>
                        <Text style={[styles.bankText, { paddingLeft: 6 }]}>Bank Account Number: 20000000452</Text>
                        <Text style={[styles.bankText, { paddingLeft: 6 }]}>Bank Branch IFSC: SBIN000488</Text>
                    </View>

                    <View style={styles.totalSummary}>
                        <Text style={[styles.bankTitle, { paddingLeft: 6 }]}>Amount Summary</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Taxable Amount:</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(calculateTotals(invoiceData.items).taxableValue)}</Text>
                        </View>
                        {invoiceData.packaging !== undefined && (
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Packaging:</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(invoiceData.packaging)}</Text>
                            </View>
                        )}
                        {invoiceData.transportationAndOthers !== undefined && (
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Transportation & Others:</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(invoiceData.transportationAndOthers)}</Text>
                            </View>
                        )}
                        {/* <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Add: IGST:</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(invoiceData.gstAmount)}</Text>
                        </View> */}
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total Tax:</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(invoiceData.gstAmount)}</Text>
                        </View>
                        <View style={[styles.summaryRow, { marginTop: 2, borderTopWidth: 1, borderColor: '#000', paddingTop: 4 }]}>
                            <Text style={styles.summaryLabel}>Total Amount After Tax:</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(invoiceData.total)}</Text>
                        </View>
                        <View style={[styles.summaryRow, { marginTop: 4 }]}>
                            <Text style={[styles.summaryLabel, { fontWeight: 'bold' }]}>(E & O.E)</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>GST Payable on Reverse Charge:</Text>
                            <Text style={styles.summaryValue}>N.A.</Text>
                        </View>
                    </View>
                </View>

                {/* Terms and Conditions */}
                <View style={styles.termsAndSignatureRow}>
                    <View style={styles.termsSection}>
                        <Text style={[styles.bankTitle, { paddingLeft: 6 }]}>Terms and Conditions</Text>
                        <Text style={[styles.bankText, { paddingLeft: 6 }]}>1. Subject to Ahmedabad Jurisdiction.</Text>
                        <Text style={[styles.bankText, { paddingLeft: 6 }]}>2. Our responsibility ceases as soon as the goods leave our premises.</Text>
                        <Text style={[styles.bankText, { paddingLeft: 6 }]}>3. Goods once sold will not be taken back.</Text>
                        <Text style={[styles.bankText, { paddingLeft: 6 }]}>4. Delivery ex-premises.</Text>
                    </View>

                    <View style={styles.signatureSection}>
                        <Text style={styles.certificationText}>Certified that the particulars given above are true and correct.</Text>
                        <Text style={styles.companyNameText}>For Dynamic Enterprises</Text>
                        <View style={styles.signatureSpace} />
                        <Text style={styles.signatureBox}>Authorised Signatory</Text>
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Invoice No: {invoiceData.invoiceNumber} | Invoice Date: {invoiceData.invoiceDate} | Page 1 of 1
                </Text>
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