import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Plus, FileText, CloudOff, ArrowRight } from 'lucide-react-native';

import { Text, View, Card } from '@/components/Themed';
import { useStore, Invoice } from '@/store/useStore';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const AnyFlatList = FlatList as any;

export default function InvoicesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const activeColors = Colors[colorScheme];
  const { invoices } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PAID' | 'UNPAID' | 'OVERDUE' | 'DRAFT'>('ALL');

  // Filter invoices based on search & tab
  const filteredInvoices = useMemo(() => {
    return invoices.filter((item) => {
      // Filter by Tab
      if (activeTab !== 'ALL' && item.status !== activeTab) {
        return false;
      }
      
      // Filter by Search query
      const matchQuery = searchQuery.toLowerCase();
      return (
        item.invoiceNumber.toLowerCase().includes(matchQuery) ||
        item.customerName.toLowerCase().includes(matchQuery) ||
        (item.customerEmail && item.customerEmail.toLowerCase().includes(matchQuery))
      );
    });
  }, [invoices, searchQuery, activeTab]);

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

  const filterTabs: Array<{ label: string; value: typeof activeTab }> = [
    { label: 'All', value: 'ALL' },
    { label: 'Paid', value: 'PAID' },
    { label: 'Unpaid', value: 'UNPAID' },
    { label: 'Overdue', value: 'OVERDUE' },
    { label: 'Drafts', value: 'DRAFT' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: activeColors.background }]}>
      {/* Search Header */}
      <View style={[styles.searchContainer, { borderBottomColor: activeColors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: activeColors.card, borderColor: activeColors.border }]}>
          <Search size={18} color={activeColors.muted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: activeColors.text }]}
            placeholder="Search invoice number, client name..."
            placeholderTextColor={activeColors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {filterTabs.map((tab) => {
            const isSelected = activeTab === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                style={[
                  styles.tabButton,
                  isSelected && { backgroundColor: activeColors.tint }
                ]}
                onPress={() => setActiveTab(tab.value)}
              >
                <Text style={[
                  styles.tabButtonText,
                  { color: isSelected ? '#FFFFFF' : activeColors.muted }
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Invoice list */}
      <AnyFlatList
        data={filteredInvoices}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }: any) => (
          <TouchableOpacity
            onPress={() => router.push(`/invoice-detail?id=${item.id}`)}
            activeOpacity={0.7}
          >
            <Card style={[styles.invoiceItemCard, { borderLeftWidth: 4, borderLeftColor: getStatusColor(item.status) }]}>
              <View style={styles.invoiceItemLeft}>
                <Text style={[styles.invoiceNumber, { color: activeColors.text }]}>{item.invoiceNumber}</Text>
                <Text style={[styles.invoiceCustomer, { color: activeColors.muted }]} numberOfLines={1}>
                  {item.customerName}
                </Text>
                <Text style={[styles.invoiceDate, { color: activeColors.muted }]}>Due: {item.dueDate}</Text>
              </View>
              <View style={styles.invoiceItemRight}>
                <Text style={[styles.invoiceAmount, { color: activeColors.text }]}>
                  {formatCurrency(item.total)}
                </Text>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: getStatusColor(item.status) + '15' }
                ]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status}
                  </Text>
                </View>
                {item.syncStatus === 'pending' && (
                  <CloudOff color={activeColors.warning} size={14} style={{ marginTop: 4 }} />
                )}
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <FileText size={48} color={activeColors.muted} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyText, { color: activeColors.text }]}>No Invoices Found</Text>
            <Text style={[styles.emptySubtext, { color: activeColors.muted }]}>
              {invoices.length === 0 
                ? 'Create your first invoice by tapping the "+" button below.' 
                : 'No invoices match your search filters.'
              }
            </Text>
          </Card>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: activeColors.tint }]}
        onPress={() => router.push('/create-invoice')}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  tabContainer: {
    paddingVertical: 10,
  },
  tabScrollContent: {
    paddingHorizontal: 20,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  invoiceItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  invoiceItemLeft: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  invoiceCustomer: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  invoiceDate: {
    fontSize: 11,
    marginTop: 4,
  },
  invoiceItemRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  invoiceAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
