import React, { useState, useMemo, useEffect } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Trash2, Calendar, Users, DollarSign, Calculator, Check } from 'lucide-react-native';

import { Text, View, Card } from '@/components/Themed';
import { useStore, InvoiceItem } from '@/store/useStore';
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

export default function CreateInvoiceScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const activeColors = Colors[colorScheme];
  
  const { customers, addInvoice } = useStore();

  // Invoice main fields
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Line items state
  const [items, setItems] = useState<Array<{ id: string; description: string; quantity: string; price: string }>>([
    { id: '1', description: '', quantity: '1', price: '0' }
  ]);

  // Tax and Discount
  const [taxRate, setTaxRate] = useState('18'); // default 18% GST
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');

  // Initial field population
  useEffect(() => {
    // Generate simple invoice number based on timestamp
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    setInvoiceNumber(`INV-${year}-${rand}`);

    // Set default dates to YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    const due = nextMonth.toISOString().split('T')[0];

    setDate(today);
    setDueDate(due);
  }, []);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.price) || 0;
      return sum + (q * p);
    }, 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    const rate = parseFloat(taxRate) || 0;
    return (subtotal * rate) / 100;
  }, [subtotal, taxRate]);

  const discountAmount = useMemo(() => {
    return parseFloat(discount) || 0;
  }, [discount]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal + taxAmount - discountAmount);
  }, [subtotal, taxAmount, discountAmount]);

  const amountInWords = useMemo(() => {
    return numberToWords(grandTotal);
  }, [grandTotal]);

  // Line item actions
  const handleAddItem = () => {
    const newId = (items.length + 1).toString();
    setItems([...items, { id: newId, description: '', quantity: '1', price: '0' }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) {
      Alert.alert('Warning', 'An invoice must contain at least one item.');
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: 'description' | 'quantity' | 'price', value: string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSaveInvoice = async () => {
    if (!selectedCustomerId) {
      Alert.alert('Required Info', 'Please select a customer.');
      return;
    }

    if (items.some(item => !item.description.trim() || parseFloat(item.price) <= 0)) {
      Alert.alert('Invalid Items', 'Please ensure all items have a description and a valid price.');
      return;
    }

    try {
      // Map local items to store schema
      const finalItems: InvoiceItem[] = items.map((item, index) => {
        const q = parseFloat(item.quantity) || 1;
        const p = parseFloat(item.price) || 0;
        return {
          id: `item_${index}_` + Math.random().toString(36).substr(2, 5),
          description: item.description,
          quantity: q,
          price: p,
          total: q * p
        };
      });

      await addInvoice({
        invoiceNumber,
        date,
        dueDate,
        customerId: selectedCustomerId,
        customerName: selectedCustomer?.name || '',
        customerEmail: selectedCustomer?.email || '',
        items: finalItems,
        subtotal,
        taxRate: parseFloat(taxRate) || 0,
        taxAmount,
        discount: discountAmount,
        total: grandTotal,
        status: 'UNPAID',
        notes: notes || undefined,
      });

      Alert.alert('Success', 'Invoice created successfully!');
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save invoice.');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: activeColors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Customer Selection */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Client Info</Text>
          <TouchableOpacity 
            style={[styles.pickerTrigger, { borderColor: activeColors.border, backgroundColor: activeColors.background }]}
            onPress={() => setShowCustomerDropdown(!showCustomerDropdown)}
          >
            <Users size={18} color={activeColors.muted} style={{ marginRight: 10 }} />
            <Text style={{ color: selectedCustomer ? activeColors.text : activeColors.muted, flex: 1 }}>
              {selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.email})` : 'Select Client / Customer *'}
            </Text>
          </TouchableOpacity>

          {/* Customer Dropdown */}
          {showCustomerDropdown && (
            <View style={[styles.dropdown, { borderColor: activeColors.border, backgroundColor: activeColors.card }]}>
              {customers.length === 0 ? (
                <TouchableOpacity 
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowCustomerDropdown(false);
                    router.push('/(tabs)/customers');
                  }}
                >
                  <Text style={{ color: activeColors.tint, fontWeight: 'bold' }}>+ Create New Customer First</Text>
                </TouchableOpacity>
              ) : (
                customers.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: activeColors.border },
                      selectedCustomerId === c.id && { backgroundColor: activeColors.tint + '10' }
                    ]}
                    onPress={() => {
                      setSelectedCustomerId(c.id);
                      setShowCustomerDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { color: activeColors.text }]}>{c.name}</Text>
                    <Text style={[styles.dropdownItemSub, { color: activeColors.muted }]}>{c.email}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </Card>

        {/* Invoice Info */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Invoice Details</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={[styles.inputLabel, { color: activeColors.text }]}>Invoice No.</Text>
              <TextInput
                style={[styles.textInput, { color: activeColors.text, borderColor: activeColors.border, backgroundColor: activeColors.background }]}
                value={invoiceNumber}
                onChangeText={setInvoiceNumber}
                placeholder="INV-2026-001"
              />
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={[styles.inputLabel, { color: activeColors.text }]}>Issue Date (YYYY-MM-DD)</Text>
              <View style={[styles.iconInput, { borderColor: activeColors.border, backgroundColor: activeColors.background }]}>
                <Calendar size={16} color={activeColors.muted} style={{ marginRight: 8 }} />
                <TextInput
                  style={{ color: activeColors.text, flex: 1, height: 40 }}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: activeColors.text }]}>Due Date (YYYY-MM-DD)</Text>
              <View style={[styles.iconInput, { borderColor: activeColors.border, backgroundColor: activeColors.background }]}>
                <Calendar size={16} color={activeColors.muted} style={{ marginRight: 8 }} />
                <TextInput
                  style={{ color: activeColors.text, flex: 1, height: 40 }}
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>
          </View>
        </Card>

        {/* Items Table */}
        <Card style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.cardTitle}>Line Items</Text>
            <TouchableOpacity 
              style={[styles.rowAddBtn, { backgroundColor: activeColors.tint + '15' }]} 
              onPress={handleAddItem}
            >
              <Plus size={16} color={activeColors.tint} style={{ marginRight: 4 }} />
              <Text style={{ color: activeColors.tint, fontWeight: 'bold', fontSize: 13 }}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {items.map((item, index) => {
            const rowTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
            return (
              <View key={item.id} style={[styles.itemRow, index > 0 && { borderTopWidth: 1, borderTopColor: activeColors.border, paddingTop: 14 }]}>
                <View style={{ flex: 2, marginRight: 8 }}>
                  <TextInput
                    style={[styles.textInput, { color: activeColors.text, borderColor: activeColors.border, backgroundColor: activeColors.background }]}
                    value={item.description}
                    onChangeText={(val) => handleUpdateItem(item.id, 'description', val)}
                    placeholder="Description *"
                    placeholderTextColor={activeColors.muted}
                  />
                </View>
                <View style={{ flex: 0.8, marginRight: 8 }}>
                  <TextInput
                    style={[styles.textInput, { color: activeColors.text, borderColor: activeColors.border, backgroundColor: activeColors.background }]}
                    value={item.quantity}
                    onChangeText={(val) => handleUpdateItem(item.id, 'quantity', val)}
                    keyboardType="numeric"
                    placeholder="Qty"
                  />
                </View>
                <View style={{ flex: 1.2, marginRight: 8 }}>
                  <TextInput
                    style={[styles.textInput, { color: activeColors.text, borderColor: activeColors.border, backgroundColor: activeColors.background }]}
                    value={item.price}
                    onChangeText={(val) => handleUpdateItem(item.id, 'price', val)}
                    keyboardType="numeric"
                    placeholder="Price"
                  />
                </View>
                <TouchableOpacity 
                  onPress={() => handleRemoveItem(item.id)}
                  style={styles.deleteRowBtn}
                >
                  <Trash2 size={18} color={activeColors.danger} />
                </TouchableOpacity>
              </View>
            );
          })}
        </Card>

        {/* Taxes & Discounts */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Tax & Discount Settings</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={[styles.inputLabel, { color: activeColors.text }]}>GST Tax Rate (%)</Text>
              <TextInput
                style={[styles.textInput, { color: activeColors.text, borderColor: activeColors.border, backgroundColor: activeColors.background }]}
                value={taxRate}
                onChangeText={setTaxRate}
                keyboardType="numeric"
                placeholder="18"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: activeColors.text }]}>Discount (₹)</Text>
              <TextInput
                style={[styles.textInput, { color: activeColors.text, borderColor: activeColors.border, backgroundColor: activeColors.background }]}
                value={discount}
                onChangeText={setDiscount}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
          <Text style={[styles.inputLabel, { color: activeColors.text }]}>Terms & Notes (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea, { color: activeColors.text, borderColor: activeColors.border, backgroundColor: activeColors.background }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add terms, bank details override or client notes..."
            multiline
            numberOfLines={3}
          />
        </Card>

        {/* Invoice Summary */}
        <Card style={[styles.card, { borderTopWidth: 4, borderTopColor: activeColors.tint }]}>
          <Text style={styles.cardTitle}>Billing Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={{ color: activeColors.muted }}>Subtotal</Text>
            <Text style={{ color: activeColors.text, fontWeight: 'bold' }}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={{ color: activeColors.muted }}>GST Tax ({taxRate}%)</Text>
            <Text style={{ color: activeColors.text, fontWeight: 'bold' }}>₹{taxAmount.toFixed(2)}</Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={{ color: activeColors.danger }}>Discount</Text>
              <Text style={{ color: activeColors.danger, fontWeight: 'bold' }}>- ₹{discountAmount.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.divider, { backgroundColor: activeColors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={{ color: activeColors.text, fontSize: 16, fontWeight: 'bold' }}>Grand Total</Text>
            <Text style={{ color: activeColors.tint, fontSize: 18, fontWeight: 'bold' }}>
              ₹{grandTotal.toFixed(2)}
            </Text>
          </View>
          
          <View style={[styles.wordsCard, { backgroundColor: activeColors.background }]}>
            <Text style={[styles.wordsLabel, { color: activeColors.muted }]}>Amount in Words:</Text>
            <Text style={[styles.wordsText, { color: activeColors.text }]}>{amountInWords}</Text>
          </View>
        </Card>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: activeColors.tint }]}
          onPress={handleSaveInvoice}
        >
          <Check size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.saveBtnText}>Generate Invoice</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  pickerTrigger: {
    borderWidth: 1,
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 6,
    maxHeight: 200,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  dropdownItemSub: {
    fontSize: 11,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  iconInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 10,
  },
  rowAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteRowBtn: {
    padding: 8,
  },
  textArea: {
    height: 60,
    paddingTop: 8,
    textAlignVertical: 'top',
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  wordsCard: {
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
  },
  wordsLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  wordsText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
    fontStyle: 'italic',
  },
  saveBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
