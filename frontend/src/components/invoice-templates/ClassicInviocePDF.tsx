import React from 'react';
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

const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    const convertLessThanOneThousand = (n: number): string => {
        if (n === 0) return '';

        if (n < 10) return ones[n];

        if (n < 20) return teens[n - 10];

        if (n < 100) {
            return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        }

        return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanOneThousand(n % 100) : '');
    };

    if (num === 0) return 'Zero';

    let amount = Math.floor(num);
    const paisa = Math.round((num % 1) * 100);

    let result = '';

    if (amount > 9999999) {
        result += convertLessThanOneThousand(Math.floor(amount / 10000000)) + ' Crore ';
        amount = amount % 10000000;
    }

    if (amount > 99999) {
        result += convertLessThanOneThousand(Math.floor(amount / 100000)) + ' Lakh ';
        amount = amount % 100000;
    }

    if (amount > 999) {
        result += convertLessThanOneThousand(Math.floor(amount / 1000)) + ' Thousand ';
        amount = amount % 1000;
    }

    result += convertLessThanOneThousand(amount);

    result = result.trim() + ' Rupees';

    if (paisa > 0) {
        result += ' and ' + convertLessThanOneThousand(paisa) + ' Paisa';
    }

    return result;
};

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

const styles = StyleSheet.create({
    page: {
        padding: 15,
        paddingTop: 30,
        paddingBottom: 40, // increased to reserve space for footer
        fontSize: 8,
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
        padding: 6,
        gap: 6,
        marginBottom: 0,
    },
    logoContainer: {
        width: 60,
        height: 60,
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
        fontSize: 12,
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 2,
    },
    companyContentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 1,
        gap: 8,
    },
    contactInfo: {
        flex: 1,
        display: 'flex',
        gap: 1,
    },
    addressInfo: {
        flex: 1,
        display: 'flex',
        gap: 1,
    },
    companyDetails: {
        fontSize: 7,
        color: '#333',
        marginTop: 1,
    },
    qrCode: {
        width: 48,
        height: 48,
    },
    mainContent: {
        borderWidth: 1,
        borderColor: '#000',
        marginBottom: 8,
    },
    customerSection: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#000',
        minHeight: 120,
    },
    billTo: {
        flex: 1.3,
        padding: 6,
        borderLeftWidth: 1,
        borderColor: '#000',
        minHeight: 120,
    },
    shipTo: {
        flex: 1.3,
        padding: 6,
        borderLeftWidth: 1,
        borderColor: '#000',
        minHeight: 120,
    },
    invoiceDetails: {
        flex: 1.4,
        padding: 3,
        minHeight: 120,
    },
    detailsContainer: {
        flexDirection: 'row',
        flex: 1,
        height: '100%',
    },
    detailsColumn: {
        height: '104%',
        flex: 1,
        padding: 2,
        borderRightWidth: 1,
        borderColor: '#000',
        // justifyContent: 'space-between',
    },
    detailsColumnLast: {
        height: '100%',
        flex: 1,
        padding: 2,
        paddingLeft: 4,
        // padding: 4,
        // justifyContent: 'space-between',
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 0,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderColor: '#000',
        paddingBottom: 2,
        marginLeft: -4,
        marginRight: -6,
        height: 16,
    },
    detailRow: {
        flexDirection: 'column', // changed from 'row' to 'column'
        marginBottom: 4, // increased spacing for vertical layout
        fontSize: 8,
        lineHeight: 1.2,
    },
    detailLabel: {
        fontSize: 7,
        color: '#222',
        marginBottom: 0,
        // flex: 2,
        textTransform: 'uppercase', // optional: for clarity
    },
    detailValue: {
        fontSize: 8,
        fontWeight: 'bold',
        marginBottom: 0,
        flex: undefined, // remove flex for vertical
        marginTop: 0,
    },
    addressRow: {
        flexDirection: 'row',
        marginBottom: 1,
        alignItems: 'flex-start',
        paddingLeft: 2,
    },
    addressLabel: {
        fontSize: 7,
        fontWeight: 'bold',
        color: '#222',
        width: 40,
    },
    addressValue: {
        fontSize: 7,
        flex: 2,
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
        backgroundColor: '#f5f5f5',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#000',
        minHeight: 14,
    },
    tableRowTotal: {
        flexDirection: 'row',
        borderBottomWidth: 0,
        borderColor: '#000',
        fontWeight: 'bold',
        minHeight: 14,
    },
    tableCell: {
        padding: 2,
        textAlign: 'left',
        borderRightWidth: 1,
        borderRightColor: '#000',
        fontSize: 8,
    },
    tableCellCenter: {
        padding: 2,
        textAlign: 'center',
        borderRightWidth: 1,
        borderRightColor: '#000',
        fontSize: 8,
    },
    tableCellRight: {
        padding: 2,
        textAlign: 'right',
        borderRightWidth: 1,
        borderRightColor: '#000',
        fontSize: 8,
    },
    tableCellLast: {
        padding: 2,
        textAlign: 'right',
        fontSize: 8,
    },
    bankAndTotalRow: {
        flexDirection: 'row',
        borderTopWidth: 1,

        marginTop: -4,
    },
    bankDetails: {
        flex: 1,
        padding: 8,
        borderWidth: 1,
        borderColor: '#000',
        borderTopWidth: 0,
        marginRight: -1,
    },
    totalSummary: {
        width: 240,
        padding: 8,
        borderWidth: 1,
        borderColor: '#000',
        borderTopWidth: 0,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 1,
        paddingHorizontal: 2,
    },
    summaryLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#222',
    },
    summaryValue: {
        fontSize: 9,
        fontWeight: 'bold',
        textAlign: 'right',
        color: '#222',
    },
    bankTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        // marginBottom: 4,
        // borderBottomWidth: 1,
        borderColor: '#000',
        // paddingBottom: 2,
        marginLeft: -8,
        marginRight: -8,
        paddingLeft: 8,
    },
    amountInWords: {
        fontSize: 8,
        fontFamily: 'Poppins',
        fontWeight: 'bold',
        padding: 6,
        borderBottomWidth: 1,
        borderColor: '#000',
        marginBottom: 3,
        marginLeft: -8,
        marginRight: -8,
        paddingLeft: 8,
    },
    bankText: {
        fontSize: 8,
        marginBottom: 1,
        lineHeight: 1.2,
        paddingLeft: 2,
    },
    termsAndSignatureRow: {
        flexDirection: 'row',
        borderTopWidth: 0,
        marginTop: -1,
    },
    termsSection: {
        flex: 1,
        padding: 8,
        borderWidth: 1,
        borderColor: '#000',
        borderTopWidth: 0,
        marginRight: -1,
    },
    signatureSection: {
        width: 160,
        padding: 8,
        borderWidth: 1,
        borderColor: '#000',
        borderTopWidth: 0,
        flexDirection: 'column',
        alignItems: 'center',
    },
    certificationText: {
        fontSize: 6,
        textAlign: 'center',
        marginBottom: 2,
        paddingHorizontal: 4,
    },
    companyNameText: {
        fontSize: 8,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    signatureSpace: {
        height: 24,
        width: 120,
        marginBottom: 2,
    },
    signatureBox: {
        fontSize: 8,
        fontWeight: 'bold',
        textAlign: 'center',
        width: 120,
        borderTopWidth: 1,
        borderColor: '#000',
        paddingTop: 2,
    },
    addressTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'center',
        textTransform: 'uppercase',
        borderBottomWidth: 1,
        borderColor: '#000',
        marginLeft: -6,
        marginRight: -6,
        paddingBottom: 0,
        height: 13,
    },
    footer: {
        position: 'absolute',
        bottom: 10,
        left: 20,
        right: 20,
        fontSize: 7,
        textAlign: 'center',
    },
    gstinSection: {
        borderWidth: 1,
        borderColor: '#000',
        padding: 4,
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 0,
        marginBottom: 2,
        backgroundColor: '#fff',
    },
    gstinLabel: {
        fontSize: 8,
        color: '#222',
    },
    gstinValue: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#222',
    },
});

const ClassicInvoicePDF: React.FC<{ invoiceData: InvoiceData, qrCode: string }> = ({ invoiceData, qrCode }) => {
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
                                <Text style={styles.companyDetails}>Tel: {invoiceData.companyDetails.phone}</Text>
                                <Text style={styles.companyDetails}>Email: {invoiceData.companyDetails.email}</Text>
                            </View>
                            <View style={styles.addressInfo}>
                                <Text style={styles.companyDetails}>{invoiceData.companyDetails.address}</Text>
                                <Text style={styles.companyDetails}>{invoiceData.companyDetails.cityState}</Text>
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
                    <Text style={styles.gstinValue}>{invoiceData.companyDetails.gstin || ': 24HDE7487RE5RT4'}</Text>
                </View>

                {/* Main Content */}
                <View style={styles.mainContent}>
                    <View style={styles.customerSection}>
                        <View style={styles.invoiceDetails}>
                            <Text style={styles.sectionTitle}>TAX INVOICE</Text>
                            <View style={styles.detailsContainer}>
                                <View style={styles.detailsColumn}>
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

                                <View style={styles.detailsColumnLast}>
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
                                        <Text style={styles.detailValue}>N.A.</Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>E-Way No:</Text>
                                        <Text style={styles.detailValue}>{invoiceData.eWayNo || '-'}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                        <View style={styles.billTo}>
                            <Text style={styles.addressTitle}>Bill To</Text>
                            <View style={{ flex: 1, gap: 2 }}>
                                <View style={styles.addressRow}>
                                    <Text style={styles.addressLabel}>NAME:</Text>
                                    <Text style={[styles.addressValue, { fontWeight: 'bold' }]}>{invoiceData.customerBillTo.name}</Text>
                                </View>

                                <View style={styles.addressRow}>
                                    <Text style={styles.addressLabel}>ADDRESS:</Text>
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
                        </View>

                        <View style={styles.shipTo}>
                            <Text style={styles.addressTitle}>Ship To</Text>
                            <View style={{ flex: 1, gap: 2 }}>
                                <View style={styles.addressRow}>
                                    <Text style={styles.addressLabel}>NAME:</Text>
                                    <Text style={[styles.addressValue, { fontWeight: 'bold' }]}>{invoiceData.customerShipTo.name}</Text>
                                </View>

                                <View style={styles.addressRow}>
                                    <Text style={styles.addressLabel}>ADDRESS:</Text>
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
                        </View>
                    </View>

                    {/* Table */}
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableCell, { flex: 0.4, fontWeight: 'bold' }]}>Sr. No.</Text>
                            <Text style={[styles.tableCell, { flex: 2.2, fontWeight: 'bold' }]}>Name of Product / Service</Text>
                            <Text style={[styles.tableCell, { flex: 0.8, fontWeight: 'bold' }]}>HSN / SAC</Text>
                            <Text style={[styles.tableCellCenter, { flex: 0.9, fontWeight: 'bold' }]}>Qty</Text>
                            {invoiceData.showSqFeet && (
                                <Text style={[styles.tableCellCenter, { flex: 0.6, fontWeight: 'bold' }]}>Sq.Feet</Text>
                            )}
                            <Text style={[styles.tableCellRight, { flex: 0.8, fontWeight: 'bold' }]}>Rate</Text>
                            <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold' }]}>Taxable Value</Text>
                            <Text style={[styles.tableCellCenter, { flex: 0.4, fontWeight: 'bold' }]}>IGST %</Text>
                            <Text style={[styles.tableCellRight, { flex: 0.8, fontWeight: 'bold' }]}>Tax Amount</Text>
                            <Text style={[styles.tableCellLast, { flex: 1, fontWeight: 'bold' }]}>Total Amount</Text>
                        </View>
                        {invoiceData.items.map((item, index) => (
                            <View style={styles.tableRow} key={item.id}>
                                <Text style={[styles.tableCell, { flex: 0.4 }]}>{index + 1}</Text>
                                <Text style={[styles.tableCell, { flex: 2.2, fontWeight: 'bold' }]}>{item.name}</Text>
                                <Text style={[styles.tableCell, { flex: 0.8 }]}>{item.hsnCode}</Text>
                                <Text style={[styles.tableCellCenter, { flex: 0.9 }]}>
                                    {item.quantity}{invoiceData.showPcsInQty ? " Pcs" : ""}
                                </Text>
                                {invoiceData.showSqFeet && (
                                    <Text style={[styles.tableCellCenter, { flex: 0.6 }]}>
                                        {item.sqFeet && item.sqFeet > 0 ? item.sqFeet.toFixed(2) : "-"}
                                    </Text>
                                )}
                                <Text style={[styles.tableCellRight, { flex: 0.8 }]}>{formatCurrency(item.price)}</Text>
                                <Text style={[styles.tableCellRight, { flex: 1 }]}>{formatCurrency(item.price * item.quantity)}</Text>
                                <Text style={[styles.tableCellCenter, { flex: 0.4 }]}>{invoiceData.gstRate || 0}%</Text>
                                <Text style={[styles.tableCellRight, { flex: 0.8 }]}>{formatCurrency((item.price * item.quantity) * ((invoiceData.gstRate || 0) / 100))}</Text>
                                <Text style={[styles.tableCellLast, { flex: 1 }]}>{formatCurrency((item.price * item.quantity) * (1 + (invoiceData.gstRate || 0) / 100))}</Text>
                            </View>
                        ))}
                        <View style={styles.tableRowTotal}>
                            <Text style={[styles.tableCell, { flex: 0.4 }]}>Total</Text>
                            <Text style={[styles.tableCell, { flex: 2.2 }]}></Text>
                            <Text style={[styles.tableCell, { flex: 0.8 }]}></Text>
                            <Text style={[styles.tableCellCenter, { flex: 0.9 }]}>{calculateTotals(invoiceData.items).quantity}{invoiceData.showPcsInQty ? ' Pcs' : ''}</Text>
                            {invoiceData.showSqFeet && (
                                <Text style={[styles.tableCellCenter, { flex: 0.6 }]}></Text>
                            )}
                            <Text style={[styles.tableCellRight, { flex: 0.8 }]}></Text>
                            <Text style={[styles.tableCellRight, { flex: 1 }]}>{formatCurrency(calculateTotals(invoiceData.items).taxableValue)}</Text>
                            <Text style={[styles.tableCellCenter, { flex: 0.4 }]}></Text>
                            <Text style={[styles.tableCellRight, { flex: 0.8 }]}>{formatCurrency(invoiceData.gstAmount)}</Text>
                            <Text style={[styles.tableCellLast, { flex: 1 }]}>{formatCurrency(invoiceData.total)}</Text>
                        </View>
                    </View>
                </View>

                {/* Bank Details and Total Summary */}
                <View style={styles.bankAndTotalRow} wrap={false}>
                    <View style={styles.bankDetails} wrap={false}>
                        <Text style={[styles.bankTitle, { paddingLeft: 6 }]}>Total Amount in Words</Text>
                        <Text style={[styles.bankText, { paddingLeft: 6 }, { paddingVertical: 4 }]}>{numberToWords(invoiceData.total)}</Text>

                        <Text style={[styles.bankTitle, { borderTopWidth: 1, borderColor: '#000', paddingTop: 4 }, { paddingLeft: 6 }]}>Bank Details</Text>
                        <Text style={styles.bankText}>Bank Name: ICICI</Text>
                        <Text style={styles.bankText}>Account Name: DYNAMIC ENTERPRISES</Text>
                        <Text style={styles.bankText}>Branch Name: Sinhgad Road Branch</Text>
                        <Text style={styles.bankText}>A/C Type: Current</Text>
                        <Text style={styles.bankText}>Bank Account Number: 180205500134</Text>
                        <Text style={styles.bankText}>Bank Branch IFSC: ICIC0001802</Text>
                    </View>

                    <View style={styles.totalSummary} wrap={false}>
                        <Text style={styles.bankTitle}>Amount Summary</Text>
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
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total Tax:</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(invoiceData.gstAmount)}</Text>
                        </View>
                        <View style={[styles.summaryRow, { marginTop: 4, borderTopWidth: 1, borderColor: '#000', paddingTop: 6 }]}>
                            <Text style={styles.summaryLabel}>Total Amount After Tax:</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(invoiceData.total)}</Text>
                        </View>
                        <View style={[styles.summaryRow, { marginTop: 6 }]}>
                            <Text style={[styles.summaryLabel, { fontWeight: 'bold' }]}>(E & O.E)</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>GST Payable on Reverse Charge:</Text>
                            <Text style={styles.summaryValue}>N.A.</Text>
                        </View>
                    </View>
                </View>

                {/* Terms and Conditions */}
                <View style={styles.termsAndSignatureRow} wrap={false}>
                    <View style={styles.termsSection} wrap={false}>
                        <Text style={styles.bankTitle}>Terms and Conditions</Text>
                        <Text style={styles.bankText}>1. Subject to Pune Jurisdiction</Text>
                        <Text style={styles.bankText}>2. Invoice shows actual price of goods all particulars true and correct</Text>
                        <Text style={styles.bankText}>3. 21% interest charged if payment not made by due date</Text>
                        <Text style={styles.bankText}>4. Responsibility ceases after goods leave our premises</Text>
                        <Text style={styles.bankText}>5. No returns or exchanges for sold goods</Text>
                    </View>

                    <View style={styles.signatureSection} wrap={false}>
                        <Text style={styles.certificationText}>Certified that the particulars given above are true and correct.</Text>
                        <Text style={styles.companyNameText}>For {invoiceData.companyDetails.name}</Text>
                        <View style={styles.signatureSpace} />
                        <Text style={styles.signatureBox}>Authorised Signatory</Text>
                    </View>
                </View>

                {/* Footer */}
                <Text
                    style={styles.footer}
                    fixed
                    render={({ pageNumber, totalPages }) =>
                        `Invoice No: ${invoiceData.invoiceNumber} | Invoice Date: ${invoiceData.invoiceDate} | Page ${pageNumber} of ${totalPages}`
                    }
                />
            </Page>
        </Document>
    );
};

const ClassicInvoicePDFWrapper: React.FC<{ invoiceData: InvoiceData | null, qrCode: string, autoDownload?: boolean }> = ({ invoiceData, qrCode, autoDownload }) => {
    if (!invoiceData) return null;
    const [instance, updateInstance] = usePDF({ document: <ClassicInvoicePDF invoiceData={invoiceData} qrCode={qrCode} /> });

    React.useEffect(() => {
        if (autoDownload && instance.url) {
            window.open(instance.url, '_blank');
        }
    }, [autoDownload, instance.url]);

    return <button className='hover:cursor-pointer' onClick={() => instance.url && window.open(instance.url, '_blank')}><Download className="h-4 w-4" /></button>;
};

export default ClassicInvoicePDFWrapper;

