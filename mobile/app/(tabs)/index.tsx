import React, { useState } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Plus, 
  CloudOff, 
  CloudLightning, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  FileText, 
  CheckCircle2 
} from 'lucide-react-native';

import { Text, View, Card } from '@/components/Themed';
import { useStore, Invoice } from '@/store/useStore';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function DashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const activeColors = Colors[colorScheme];

  const { 
    user, 
    invoices, 
    isOffline, 
    syncInvoices, 
    setOfflineStatus 
  } = useStore();

  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Sync action handler
  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncInvoices();
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    if (!isOffline) {
      try {
        await syncInvoices();
      } catch (e) {
        console.error(e);
      }
    }
    setTimeout(() => setRefreshing(false), 1000);
  }, [isOffline, syncInvoices]);

  // Calculations
  const pendingSyncCount = invoices.filter(inv => inv.syncStatus === 'pending').length;
  
  const totalInvoices = invoices.length;
  
  const revenue = invoices
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.total, 0);

  const pending = invoices
    .filter(inv => inv.status === 'UNPAID')
    .reduce((sum, inv) => sum + inv.total, 0);

  const overdue = invoices
    .filter(inv => inv.status === 'OVERDUE')
    .reduce((sum, inv) => sum + inv.total, 0);

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

  // Welcome message based on local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: activeColors.background }]}
      contentContainerStyle={styles.scrollContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={activeColors.tint} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View>
          <Text style={[styles.greeting, { color: activeColors.muted }]}>{getGreeting()},</Text>
          <Text style={[styles.username, { color: activeColors.text }]}>{user?.name || 'Publisher'} 👋</Text>
        </View>
        <TouchableOpacity 
          style={[styles.createFAB, { backgroundColor: activeColors.tint }]}
          onPress={() => router.push('/create-invoice')}
        >
          <Plus color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </View>

      {/* Sync / Offline Banner */}
      {(isOffline || pendingSyncCount > 0) && (
        <Card style={[styles.syncBanner, { borderColor: isOffline ? activeColors.danger + '30' : activeColors.warning + '30' }]}>
          <View style={styles.syncBannerLeft}>
            {isOffline ? (
              <CloudOff color={activeColors.danger} size={22} style={{ marginRight: 10 }} />
            ) : (
              <CloudLightning color={activeColors.warning} size={22} style={{ marginRight: 10 }} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.syncTitle, { color: activeColors.text }]}>
                {isOffline ? 'Offline Mode Active' : 'Unsynced Local Changes'}
              </Text>
              <Text style={[styles.syncDesc, { color: activeColors.muted }]}>
                {isOffline 
                  ? 'Your data is being saved locally. Toggle online to sync.' 
                  : `${pendingSyncCount} invoice(s) waiting to sync to server.`
                }
              </Text>
            </View>
          </View>
          {!isOffline && pendingSyncCount > 0 && (
            <TouchableOpacity 
              style={[styles.syncBtn, { backgroundColor: activeColors.tint }]}
              onPress={handleSync}
              disabled={syncing}
            >
              {syncing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.syncBtnText}>Sync Now</Text>
              )}
            </TouchableOpacity>
          )}
        </Card>
      )}

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Total Invoices */}
        <Card style={[styles.statCard, { borderTopWidth: 4, borderTopColor: activeColors.tint }]}>
          <TrendingUp color={activeColors.tint} size={20} />
          <Text style={[styles.statTitle, { color: activeColors.muted }]}>Total Invoices</Text>
          <Text style={[styles.statValue, { color: activeColors.text }]}>{totalInvoices}</Text>
        </Card>

        {/* Total Revenue */}
        <Card style={[styles.statCard, { borderTopWidth: 4, borderTopColor: activeColors.secondary }]}>
          <DollarSign color={activeColors.secondary} size={20} />
          <Text style={[styles.statTitle, { color: activeColors.muted }]}>Revenue (Paid)</Text>
          <Text style={[styles.statValue, { color: activeColors.text }]} numberOfLines={1}>
            {formatCurrency(revenue)}
          </Text>
        </Card>

        {/* Pending Amount */}
        <Card style={[styles.statCard, { borderTopWidth: 4, borderTopColor: activeColors.warning }]}>
          <Clock color={activeColors.warning} size={20} />
          <Text style={[styles.statTitle, { color: activeColors.muted }]}>Pending</Text>
          <Text style={[styles.statValue, { color: activeColors.text }]} numberOfLines={1}>
            {formatCurrency(pending)}
          </Text>
        </Card>

        {/* Overdue Amount */}
        <Card style={[styles.statCard, { borderTopWidth: 4, borderTopColor: activeColors.danger }]}>
          <AlertTriangle color={activeColors.danger} size={20} />
          <Text style={[styles.statTitle, { color: activeColors.muted }]}>Overdue</Text>
          <Text style={[styles.statValue, { color: activeColors.text }]} numberOfLines={1}>
            {formatCurrency(overdue)}
          </Text>
        </Card>
      </View>

      {/* Recent Invoices Title */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: activeColors.text }]}>Recent Invoices</Text>
        {totalInvoices > 3 && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/invoices')}>
            <View style={styles.viewAllBtn}>
              <Text style={[styles.viewAllText, { color: activeColors.tint }]}>View All</Text>
              <ArrowRight size={14} color={activeColors.tint} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Invoices List */}
      <View style={styles.invoiceList}>
        {invoices.length === 0 ? (
          <Card style={styles.emptyCard}>
            <FileText size={48} color={activeColors.muted} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyText, { color: activeColors.text }]}>No Invoices Yet</Text>
            <Text style={[styles.emptySubtext, { color: activeColors.muted }]}>
              Create your first invoice by tapping the "+" button above.
            </Text>
          </Card>
        ) : (
          invoices.slice(0, 3).map((item) => (
            <TouchableOpacity 
              key={item.id}
              onPress={() => router.push(`/invoice-detail?id=${item.id}`)}
              activeOpacity={0.7}
            >
              <Card style={[styles.invoiceItemCard, { borderLeftWidth: 4, borderLeftColor: getStatusColor(item.status) }]}>
                <View style={styles.invoiceItemLeft}>
                  <Text style={[styles.invoiceNumber, { color: activeColors.text }]}>{item.invoiceNumber}</Text>
                  <Text style={[styles.invoiceCustomer, { color: activeColors.muted }]} numberOfLines={1}>
                    {item.customerName}
                  </Text>
                  <Text style={[styles.invoiceDate, { color: activeColors.muted }]}>{item.date}</Text>
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
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  createFAB: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  syncBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  syncBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  syncTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  syncDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  syncBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 10,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  invoiceList: {
    marginBottom: 10,
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
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: 14,
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
});
