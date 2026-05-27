import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import { Search, UserPlus, Mail, Phone, MapPin, X, Check } from 'lucide-react-native';

import { Text, View, Card } from '@/components/Themed';
import { useStore, Customer } from '@/store/useStore';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const AnyFlatList = FlatList as any;

export default function CustomersScreen() {
  const colorScheme = useColorScheme();
  const activeColors = Colors[colorScheme];
  const { customers, addCustomer } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    return customers.filter((item) => {
      const query = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        (item.phone && item.phone.includes(query))
      );
    });
  }, [customers, searchQuery]);

  // Color generator based on name hash
  const getAvatarStyle = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % 4;
    const colors = [
      { bg: '#DBEAFE', text: '#1E3A8A' }, // Royal Blue
      { bg: '#E0F2FE', text: '#0369A1' }, // Sky
      { bg: '#FEF3C7', text: '#B45309' }, // Premium Gold / Amber
      { bg: '#F1F5F9', text: '#475569' }, // Slate
    ];
    return colors[index];
  };

  const getInitials = (name: string) => {
    if (!name) return 'C';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const handleAddCustomer = async () => {
    if (!name || !email) {
      setFormError('Name and Email are required.');
      return;
    }

    setLoading(true);
    setFormError(null);

    try {
      await addCustomer({
        name,
        email,
        phone: phone || undefined,
        address: address || undefined,
      });

      // Clear Form & Close
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setShowAddForm(false);
      
      Alert.alert('Success', 'Customer added successfully!');
    } catch (e: any) {
      console.error(e);
      setFormError('Failed to add customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: activeColors.background }]}
    >
      {/* Search Header */}
      <View style={[styles.searchContainer, { borderBottomColor: activeColors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: activeColors.card, borderColor: activeColors.border }]}>
          <Search size={18} color={activeColors.muted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: activeColors.text }]}
            placeholder="Search customers..."
            placeholderTextColor={activeColors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: activeColors.tint }]}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? <X size={20} color="#FFFFFF" /> : <UserPlus size={20} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>

      {/* Add Customer Card */}
      {showAddForm && (
        <Card style={styles.addCard}>
          <Text style={styles.addCardTitle}>New Customer Details</Text>
          
          {formError && (
            <Text style={[styles.formErrorText, { color: activeColors.danger }]}>{formError}</Text>
          )}

          <TextInput
            style={[styles.formInput, { color: activeColors.text, borderColor: activeColors.border, backgroundColor: activeColors.background }]}
            placeholder="Customer / Company Name *"
            placeholderTextColor={activeColors.muted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <TextInput
            style={[styles.formInput, { color: activeColors.text, borderColor: activeColors.border, backgroundColor: activeColors.background }]}
            placeholder="Email Address *"
            placeholderTextColor={activeColors.muted}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />

          <TextInput
            style={[styles.formInput, { color: activeColors.text, borderColor: activeColors.border, backgroundColor: activeColors.background }]}
            placeholder="Phone Number (Optional)"
            placeholderTextColor={activeColors.muted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <TextInput
            style={[
              styles.formInput, 
              styles.textAreaInput, 
              { color: activeColors.text, borderColor: activeColors.border, backgroundColor: activeColors.background }
            ]}
            placeholder="Billing Address (Optional)"
            placeholderTextColor={activeColors.muted}
            multiline
            numberOfLines={3}
            value={address}
            onChangeText={setAddress}
          />

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: activeColors.tint }]}
            onPress={handleAddCustomer}
            disabled={loading}
          >
            <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.submitBtnText}>Save Customer</Text>
          </TouchableOpacity>
        </Card>
      )}

      {/* Customers List */}
      <AnyFlatList
        data={filteredCustomers}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }: any) => {
          const avatarColors = getAvatarStyle(item.name);
          return (
            <Card style={styles.customerCard}>
              <View style={styles.cardRow}>
                {/* Initial Avatar */}
                <View style={[styles.avatar, { backgroundColor: avatarColors.bg }]}>
                  <Text style={[styles.avatarText, { color: avatarColors.text }]}>
                    {getInitials(item.name)}
                  </Text>
                </View>

                {/* Details */}
                <View style={styles.customerDetails}>
                  <Text style={[styles.customerName, { color: activeColors.text }]}>{item.name}</Text>
                  
                  <View style={styles.infoRow}>
                    <Mail size={12} color={activeColors.muted} style={{ marginRight: 6 }} />
                    <Text style={[styles.infoText, { color: activeColors.muted }]}>{item.email}</Text>
                  </View>

                  {item.phone && (
                    <View style={styles.infoRow}>
                      <Phone size={12} color={activeColors.muted} style={{ marginRight: 6 }} />
                      <Text style={[styles.infoText, { color: activeColors.muted }]}>{item.phone}</Text>
                    </View>
                  )}

                  {item.address && (
                    <View style={styles.infoRow}>
                      <MapPin size={12} color={activeColors.muted} style={{ marginRight: 6 }} />
                      <Text style={[styles.infoText, { color: activeColors.muted }]} numberOfLines={1}>
                        {item.address}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <UserPlus size={48} color={activeColors.muted} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyText, { color: activeColors.text }]}>No Customers Yet</Text>
            <Text style={[styles.emptySubtext, { color: activeColors.muted }]}>
              {customers.length === 0
                ? 'Add your first customer to get started with billing.'
                : 'No customers match your search.'
              }
            </Text>
          </Card>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    height: 40,
    flex: 1,
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  addCard: {
    margin: 20,
    padding: 16,
    borderRadius: 14,
  },
  addCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  formErrorText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  textAreaInput: {
    height: 70,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  submitBtn: {
    height: 40,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  customerCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '500',
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
});
