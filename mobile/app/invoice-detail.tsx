import React, { useMemo } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Share, 
  Platform 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  Printer, 
  Share2, 
  CheckCircle, 
  Trash2, 
  ArrowLeft, 
  Calendar, 
  User, 
  FileText,
  CreditCard
} from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { Text, View, Card } from '@/components/Themed';
import { useStore, Invoice } from '@/store/useStore';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

// Indian Number to Words Converter
function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanOneThousand = (n: number): string => {
    if (n === 0) return '';
    let tempStr = '';
    if (n >= 100) {
      tempStr += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      tempStr += b[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      tempStr += a[n] + ' ';
    }
    return tempStr.trim();
  };

  let word = '';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const remaining = Math.floor(num);

  if (crore > 0) {
    word += convertLessThanOneThousand(crore) + ' Crore ';
  }
  if (lakh > 0) {
    word += convertLessThanOneThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    word += convertLessThanOneThousand(thousand) + ' Thousand ';
  }
  if (remaining > 0) {
    word += convertLessThanOneThousand(remaining) + ' ';
  }
  
  return (word.trim() + ' Rupees Only').replace(/\s+/g, ' ');
}

export default function InvoiceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const activeColors = Colors[colorScheme];

  const { invoices, user, updateInvoiceStatus, deleteInvoice } = useStore();

  const invoice = useMemo(() => {
    return invoices.find(inv => inv.id === id) || null;
  }, [invoices, id]);

  if (!invoice) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: activeColors.background }]}>
        <FileText size={50} color={activeColors.muted} />
        <Text style={[styles.errorTitle, { color: activeColors.text }]}>Invoice Not Found</Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: activeColors.tint }]} onPress={() => router.back()}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'PAID': return activeColors.success;
      case 'UNPAID': return activeColors.warning;
      case 'OVERDUE': return activeColors.danger;
      default: return activeColors.muted;
    }
  };

  // Status handler
  const handleMarkPaid = async () => {
    Alert.alert(
      'Mark as Paid',
      'Are you sure you want to mark this invoice as Paid?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mark Paid', 
          onPress: async () => {
            try {
              await updateInvoiceStatus(invoice.id, 'PAID');
              Alert.alert('Success', 'Invoice status updated to Paid.');
            } catch (e) {
              Alert.alert('Error', 'Failed to update invoice status.');
            }
          }
        }
      ]
    );
  };

  // Delete handler
  const handleDelete = () => {
    Alert.alert(
      'Delete Invoice',
      'Are you sure you want to delete this invoice? This action is permanent locally.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInvoice(invoice.id);
              Alert.alert('Deleted', 'Invoice has been deleted.');
              router.back();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete invoice.');
            }
          }
        }
      ]
    );
  };

  // HTML template for PDF creation
  const generateInvoiceHtml = () => {
    const itemsHtml = invoice.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.price.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.total.toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 30px; }
          .header { display: flex; justify-content: space-between; border-bottom: 3px solid #1e3a8a; padding-bottom: 20px; }
          .logo-text { font-size: 26px; font-weight: bold; color: #1e3a8a; letter-spacing: 2px; }
          .logo-sub { color: #d4af37; font-size: 20px; font-weight: 900; }
          .company-details { text-align: right; font-size: 12px; line-height: 1.6; }
          .invoice-meta { margin-top: 25px; display: flex; justify-content: space-between; background: #eff6ff; padding: 15px; border-radius: 6px; }
          .meta-column { font-size: 13px; line-height: 1.5; }
          .bill-to { margin-top: 30px; line-height: 1.6; font-size: 13px; }
          .bill-to-title { font-weight: bold; color: #1e3a8a; font-size: 14px; text-transform: uppercase; margin-bottom: 5px; }
          .items-table { width: 100%; border-collapse: collapse; margin-top: 30px; font-size: 13px; }
          .items-table th { background-color: #1e3a8a; color: white; padding: 10px; text-align: left; }
          .totals-section { margin-top: 30px; display: flex; justify-content: flex-end; }
          .totals-table { width: 300px; border-collapse: collapse; font-size: 13px; }
          .totals-table td { padding: 6px 10px; }
          .grand-total { font-weight: bold; color: #1e3a8a; font-size: 16px; border-top: 2px solid #1e3a8a; border-bottom: 2px solid #1e3a8a; padding: 10px; }
          .words-block { margin-top: 20px; font-style: italic; font-size: 12px; color: #555; }
          .bank-details { margin-top: 40px; font-size: 12px; background: #fafafa; border: 1px solid #eee; padding: 15px; border-radius: 6px; }
          .bank-title { font-weight: bold; margin-bottom: 6px; color: #333; }
          .footer { margin-top: 60px; border-top: 1px solid #ddd; padding-top: 15px; display: flex; justify-content: space-between; align-items: flex-end; }
          .auth-sig { text-align: center; width: 200px; border-top: 1px solid #333; padding-top: 6px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo-text">SADBHAWANA</div>
            <div class="logo-sub">BILLDESK</div>
          </div>
          <div class="company-details">
            <strong>${user?.businessName || 'Sadbhawana Publication'}</strong><br/>
            ${user?.address || ''}<br/>
            ${user?.phone ? `Phone: ${user.phone}` : ''}<br/>
            ${user?.email ? `Email: ${user.email}` : ''}
          </div>
        </div>

        <div class="invoice-meta">
          <div class="meta-column">
            <strong>Invoice Number:</strong> ${invoice.invoiceNumber}<br/>
            <strong>Status:</strong> <span style="font-weight: bold; color: ${invoice.status === 'PAID' ? '#10B981' : '#F59E0B'}">${invoice.status}</span>
          </div>
          <div class="meta-column" style="text-align: right;">
            <strong>Issue Date:</strong> ${invoice.date}<br/>
            <strong>Due Date:</strong> ${invoice.dueDate}
          </div>
        </div>

        <div class="bill-to">
          <div class="bill-to-title">Bill To:</div>
          <strong>${invoice.customerName}</strong><br/>
          Email: ${invoice.customerEmail}<br/>
          ${selectedCustomerAddress()}
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 50%;">Item / Description</th>
              <th style="text-align: center; width: 10%;">Qty</th>
              <th style="text-align: right; width: 20%;">Price</th>
              <th style="text-align: right; width: 20%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals-section">
          <table class="totals-table">
            <tr>
              <td>Subtotal:</td>
              <td style="text-align: right;">₹${invoice.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td>GST Tax (${invoice.taxRate}%):</td>
              <td style="text-align: right;">₹${invoice.taxAmount.toFixed(2)}</td>
            </tr>
            ${invoice.discount > 0 ? `
              <tr>
                <td style="color: red;">Discount:</td>
                <td style="text-align: right; color: red;">- ₹${invoice.discount.toFixed(2)}</td>
              </tr>
            ` : ''}
            <tr class="grand-total">
              <td>Grand Total:</td>
              <td style="text-align: right;">₹${invoice.total.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div class="words-block">
          <strong>Amount in Words:</strong> ${numberToWords(invoice.total)}
        </div>

        ${user?.bankName ? `
          <div class="bank-details">
            <div class="bank-title">Bank Details for Settlement</div>
            Bank Name: ${user.bankName}<br/>
            Account Number: ${user.accountNumber}<br/>
            IFSC Code: ${user.ifscCode}
          </div>
        ` : ''}

        <div class="footer">
          <div style="font-size: 11px; color: #777;">
            Thank you for your business!<br/>
            Generated via Sadbhawana BillDesk
          </div>
          <div class="auth-sig">
            Authorized Signatory
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const selectedCustomerAddress = () => {
    // Find customer to see address
    const cust = invoices.find(inv => inv.id === id);
    if (!cust) return '';
    // Fetch from store customers if available
    const storeCust = useStore.getState().customers.find(c => c.id === cust.customerId);
    return storeCust?.address ? `${storeCust.address}` : '';
  };

  // PDF share handler
  const handlePrintShare = async () => {
    try {
      const html = generateInvoiceHtml();
      
      // Print to file
      const { uri } = await Print.printToFileAsync({ html });
      console.log('PDF generated at:', uri);

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share Invoice ${invoice.invoiceNumber}`,
          UTI: 'com.adobe.pdf'
        });
      } else {
        // Web fallback
        Alert.alert('Web Print', 'Print features are fully supported on mobile builds.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to generate and share PDF.');
    }
  };

  const grandTotalWords = numberToWords(invoice.total);

  return (
    <ScrollView style={[styles.container, { backgroundColor: activeColors.background }]}>
      {/* Header section with status */}
      <View style={[styles.headerBanner, { backgroundColor: activeColors.card, borderBottomColor: activeColors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.invoiceNo, { color: activeColors.text }]}>{invoice.invoiceNumber}</Text>
          <Text style={[styles.invoiceDate, { color: activeColors.muted }]}>Issued: {invoice.date}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: getStatusColor(invoice.status) + '15' }]}>
          <Text style={[styles.badgeText, { color: getStatusColor(invoice.status) }]}>{invoice.status}</Text>
        </View>
      </View>

      {/* Bill To Card */}
      <Card style={styles.sectionCard}>
        <Text style={[styles.cardHeading, { color: activeColors.tint }]}>Billed To</Text>
        <Text style={[styles.clientName, { color: activeColors.text }]}>{invoice.customerName}</Text>
        <Text style={[styles.clientEmail, { color: activeColors.muted }]}>{invoice.customerEmail}</Text>
        
        <View style={[styles.metaDivider, { backgroundColor: activeColors.border }]} />
        
        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Text style={[styles.metaLabel, { color: activeColors.muted }]}>Due Date</Text>
            <View style={styles.metaValRow}>
              <Calendar size={14} color={activeColors.text} style={{ marginRight: 6 }} />
              <Text style={[styles.metaVal, { color: activeColors.text }]}>{invoice.dueDate}</Text>
            </View>
          </View>
          <View style={styles.metaCol}>
            <Text style={[styles.metaLabel, { color: activeColors.muted }]}>Sync Status</Text>
            <Text style={[styles.metaVal, { color: invoice.syncStatus === 'synced' ? activeColors.success : activeColors.warning }]}>
              {invoice.syncStatus === 'synced' ? 'Synced with cloud' : 'Local only (Offline)'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Items List Card */}
      <Card style={styles.sectionCard}>
        <Text style={[styles.cardHeading, { color: activeColors.tint }]}>Items Table</Text>
        
        {invoice.items.map((item, index) => (
          <View key={item.id} style={[styles.itemRow, index > 0 && { borderTopWidth: 1, borderTopColor: activeColors.border, paddingTop: 10 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemDesc, { color: activeColors.text }]}>{item.description}</Text>
              <Text style={[styles.itemDetails, { color: activeColors.muted }]}>
                {item.quantity} × {formatCurrency(item.price)}
              </Text>
            </View>
            <Text style={[styles.itemTotal, { color: activeColors.text }]}>
              {formatCurrency(item.total)}
            </Text>
          </View>
        ))}

        <View style={[styles.metaDivider, { backgroundColor: activeColors.border }]} />

        {/* Breakdown Summary */}
        <View style={styles.summaryRow}>
          <Text style={{ color: activeColors.muted }}>Subtotal</Text>
          <Text style={[styles.summaryVal, { color: activeColors.text }]}>{formatCurrency(invoice.subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={{ color: activeColors.muted }}>GST Tax ({invoice.taxRate}%)</Text>
          <Text style={[styles.summaryVal, { color: activeColors.text }]}>{formatCurrency(invoice.taxAmount)}</Text>
        </View>
        {invoice.discount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={{ color: activeColors.danger }}>Discount</Text>
            <Text style={[styles.summaryVal, { color: activeColors.danger }]}>- {formatCurrency(invoice.discount)}</Text>
          </View>
        )}
        
        <View style={[styles.metaDivider, { backgroundColor: activeColors.border }]} />

        <View style={styles.summaryRow}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: activeColors.text }}>Grand Total</Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: activeColors.tint }}>
            {formatCurrency(invoice.total)}
          </Text>
        </View>

        <View style={[styles.wordsBox, { backgroundColor: activeColors.background }]}>
          <Text style={[styles.wordsLabel, { color: activeColors.muted }]}>Amount In Words:</Text>
          <Text style={[styles.wordsText, { color: activeColors.text }]}>{grandTotalWords}</Text>
        </View>
      </Card>

      {/* Bank details Card */}
      {user?.bankName && (
        <Card style={styles.sectionCard}>
          <Text style={[styles.cardHeading, { color: activeColors.tint }]}>Settlement Bank Info</Text>
          <View style={styles.bankDetailRow}>
            <CreditCard size={18} color={activeColors.muted} style={{ marginRight: 10 }} />
            <View>
              <Text style={[styles.bankLabel, { color: activeColors.text }]}>{user.bankName}</Text>
              <Text style={[styles.bankVal, { color: activeColors.muted }]}>A/C: {user.accountNumber}</Text>
              <Text style={[styles.bankVal, { color: activeColors.muted }]}>IFSC: {user.ifscCode}</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Options Cards */}
      <View style={styles.actionsContainer}>
        {/* PDF share */}
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: activeColors.tint }]} onPress={handlePrintShare}>
          <Share2 size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.actionBtnText}>Share & Print PDF</Text>
        </TouchableOpacity>

        {/* Mark as Paid (only if unpaid/overdue) */}
        {invoice.status !== 'PAID' && (
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: activeColors.success }]} 
            onPress={handleMarkPaid}
          >
            <CheckCircle size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>Mark as Paid</Text>
          </TouchableOpacity>
        )}

        {/* Delete */}
        <TouchableOpacity style={[styles.deleteBtn, { borderColor: activeColors.danger }]} onPress={handleDelete}>
          <Trash2 size={18} color={activeColors.danger} style={{ marginRight: 8 }} />
          <Text style={[styles.deleteBtnText, { color: activeColors.danger }]}>Delete Invoice</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 14,
    marginBottom: 20,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  headerBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  invoiceNo: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  invoiceDate: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  cardHeading: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  clientEmail: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  metaDivider: {
    height: 1,
    marginVertical: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaValRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaVal: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemDesc: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemDetails: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  summaryVal: {
    fontWeight: 'bold',
  },
  wordsBox: {
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
  },
  wordsLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  wordsText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
    fontStyle: 'italic',
  },
  bankDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bankVal: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 40,
  },
  actionBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  deleteBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
