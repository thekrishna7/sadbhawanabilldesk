import React, { useState } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  Switch, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  User, 
  Briefcase, 
  CreditCard, 
  Moon, 
  CloudLightning, 
  LogOut, 
  ChevronRight, 
  Check, 
  Crown,
  Lock
} from 'lucide-react-native';

import { Text, View, Card } from '@/components/Themed';
import { useStore } from '@/store/useStore';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const activeColors = Colors[colorScheme];

  const { 
    user, 
    updateProfile, 
    logout, 
    isDarkMode, 
    toggleTheme, 
    isOffline, 
    setOfflineStatus 
  } = useStore();

  const [expandedSection, setExpandedSection] = useState<'profile' | 'business' | 'bank' | null>(null);
  const [saving, setSaving] = useState(false);

  // Profile forms state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [address, setAddress] = useState(user?.address || '');
  const [bankName, setBankName] = useState(user?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(user?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(user?.ifscCode || '');

  // Calculate completeness percentage
  const calculateCompleteness = () => {
    let fields = [user?.name, user?.email, user?.businessName, user?.address, user?.phone, user?.bankName, user?.accountNumber, user?.ifscCode];
    let filled = fields.filter(f => !!f).length;
    return Math.round((filled / fields.length) * 100);
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const success = await updateProfile({
        name,
        phone,
        businessName,
        address,
        bankName,
        accountNumber,
        ifscCode,
      });

      if (success) {
        Alert.alert('Success', 'Profile updated successfully.');
        setExpandedSection(null);
      } else {
        Alert.alert('Error', 'Failed to update profile.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/login');
          } 
        }
      ]
    );
  };

  const toggleSection = (section: 'profile' | 'business' | 'bank') => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  const completeness = calculateCompleteness();

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: activeColors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Profile Overview Header */}
      <Card style={styles.profileHeaderCard}>
        <View style={styles.profileMeta}>
          <View style={[styles.avatarBubble, { backgroundColor: activeColors.tint + '20' }]}>
            <Text style={[styles.avatarText, { color: activeColors.tint }]}>
              {getInitials(user?.name || '')}
            </Text>
          </View>
          <View style={styles.profileHeaderInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.profileName, { color: activeColors.text }]}>
                {user?.name || 'Publisher'}
              </Text>
              <View style={[styles.planBadge, { backgroundColor: activeColors.tint + '20' }]}>
                <Crown size={12} color={activeColors.tint} style={{ marginRight: 4 }} />
                <Text style={[styles.planText, { color: activeColors.tint }]}>PRO</Text>
              </View>
            </View>
            <Text style={[styles.profileEmail, { color: activeColors.muted }]}>
              {user?.email || 'publisher@sadbhawana.com'}
            </Text>
          </View>
        </View>

        {/* Profile Completeness bar */}
        <View style={styles.completenessSection}>
          <View style={styles.completenessRow}>
            <Text style={[styles.completenessLabel, { color: activeColors.text }]}>Profile Completeness</Text>
            <Text style={[styles.completenessPercent, { color: activeColors.tint }]}>{completeness}%</Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: activeColors.border }]}>
            <View 
              style={[
                styles.progressBarFill, 
                { backgroundColor: activeColors.tint, width: `${completeness}%` }
              ]} 
            />
          </View>
        </View>
      </Card>

      {/* Edit Sections Title */}
      <Text style={[styles.groupTitle, { color: activeColors.muted }]}>Account Settings</Text>

      {/* 1. Personal Profile Section */}
      <Card style={styles.sectionCard}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('profile')}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: activeColors.tint + '15' }]}>
              <User size={18} color={activeColors.tint} />
            </View>
            <Text style={[styles.sectionHeading, { color: activeColors.text }]}>Personal Details</Text>
          </View>
          <ChevronRight 
            size={18} 
            color={activeColors.muted} 
            style={{ transform: [{ rotate: expandedSection === 'profile' ? '90deg' : '0deg' }] }} 
          />
        </TouchableOpacity>
        
        {expandedSection === 'profile' && (
          <View style={styles.expandedContent}>
            <Text style={[styles.inputLabel, { color: activeColors.text }]}>Full Name</Text>
            <TextInput
              style={[styles.input, { color: activeColors.text, borderColor: activeColors.border }]}
              value={name}
              onChangeText={setName}
              placeholder="Full Name"
              placeholderTextColor={activeColors.muted}
            />
            <Text style={[styles.inputLabel, { color: activeColors.text }]}>Phone Number</Text>
            <TextInput
              style={[styles.input, { color: activeColors.text, borderColor: activeColors.border }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone Number"
              placeholderTextColor={activeColors.muted}
              keyboardType="phone-pad"
            />
            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: activeColors.tint }]}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* 2. Business Profile Section */}
      <Card style={styles.sectionCard}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('business')}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: activeColors.secondary + '15' }]}>
              <Briefcase size={18} color={activeColors.secondary} />
            </View>
            <Text style={[styles.sectionHeading, { color: activeColors.text }]}>Business Profile</Text>
          </View>
          <ChevronRight 
            size={18} 
            color={activeColors.muted} 
            style={{ transform: [{ rotate: expandedSection === 'business' ? '90deg' : '0deg' }] }} 
          />
        </TouchableOpacity>

        {expandedSection === 'business' && (
          <View style={styles.expandedContent}>
            <Text style={[styles.inputLabel, { color: activeColors.text }]}>Company / Business Name</Text>
            <TextInput
              style={[styles.input, { color: activeColors.text, borderColor: activeColors.border }]}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Sadbhawana Publication"
              placeholderTextColor={activeColors.muted}
            />
            <Text style={[styles.inputLabel, { color: activeColors.text }]}>Business Address</Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: activeColors.text, borderColor: activeColors.border }]}
              value={address}
              onChangeText={setAddress}
              placeholder="Business Address"
              placeholderTextColor={activeColors.muted}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: activeColors.tint }]}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* 3. Bank details Section */}
      <Card style={styles.sectionCard}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('bank')}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#8B5CF615' }]}>
              <CreditCard size={18} color="#8B5CF6" />
            </View>
            <Text style={[styles.sectionHeading, { color: activeColors.text }]}>Bank & Settlement Details</Text>
          </View>
          <ChevronRight 
            size={18} 
            color={activeColors.muted} 
            style={{ transform: [{ rotate: expandedSection === 'bank' ? '90deg' : '0deg' }] }} 
          />
        </TouchableOpacity>

        {expandedSection === 'bank' && (
          <View style={styles.expandedContent}>
            <Text style={[styles.inputLabel, { color: activeColors.text }]}>Bank Name</Text>
            <TextInput
              style={[styles.input, { color: activeColors.text, borderColor: activeColors.border }]}
              value={bankName}
              onChangeText={setBankName}
              placeholder="e.g. State Bank of India"
              placeholderTextColor={activeColors.muted}
            />
            <Text style={[styles.inputLabel, { color: activeColors.text }]}>Account Number</Text>
            <TextInput
              style={[styles.input, { color: activeColors.text, borderColor: activeColors.border }]}
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="Account Number"
              placeholderTextColor={activeColors.muted}
              keyboardType="number-pad"
            />
            <Text style={[styles.inputLabel, { color: activeColors.text }]}>IFSC Code</Text>
            <TextInput
              style={[styles.input, { color: activeColors.text, borderColor: activeColors.border }]}
              value={ifscCode}
              onChangeText={setIfscCode}
              placeholder="IFSC Code"
              placeholderTextColor={activeColors.muted}
              autoCapitalize="characters"
            />
            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: activeColors.tint }]}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* Preference Toggles Title */}
      <Text style={[styles.groupTitle, { color: activeColors.muted }]}>Preferences</Text>

      {/* Preferences Card */}
      <Card style={styles.settingsTogglesCard}>
        {/* Dark Mode toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <Moon size={18} color={activeColors.text} style={{ marginRight: 10 }} />
            <Text style={[styles.toggleLabel, { color: activeColors.text }]}>Dark Mode</Text>
          </View>
          <Switch 
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: activeColors.border, true: activeColors.tint }}
            thumbColor="#fff"
          />
        </View>

        <View style={[styles.divider, { backgroundColor: activeColors.border }]} />

        {/* Offline Mode toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <CloudLightning size={18} color={activeColors.text} style={{ marginRight: 10 }} />
            <View>
              <Text style={[styles.toggleLabel, { color: activeColors.text }]}>Offline Mode</Text>
              <Text style={[styles.toggleDesc, { color: activeColors.muted }]}>Avoid network calls and save locally</Text>
            </View>
          </View>
          <Switch 
            value={isOffline}
            onValueChange={setOfflineStatus}
            trackColor={{ false: activeColors.border, true: activeColors.tint }}
            thumbColor="#fff"
          />
        </View>
      </Card>

      {/* Actions */}
      <TouchableOpacity 
        style={[styles.logoutBtn, { borderColor: activeColors.danger }]}
        onPress={handleLogout}
      >
        <LogOut size={18} color={activeColors.danger} style={{ marginRight: 8 }} />
        <Text style={[styles.logoutBtnText, { color: activeColors.danger }]}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={[styles.versionText, { color: activeColors.muted }]}>
        Sadbhawana BillDesk Mobile v1.0.0
      </Text>
    </ScrollView>
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
  profileHeaderCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileHeaderInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  planText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  completenessSection: {
    marginTop: 8,
  },
  completenessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  completenessLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  completenessPercent: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginTop: 10,
    marginLeft: 4,
  },
  sectionCard: {
    padding: 0,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  expandedContent: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#00000008',
    paddingTop: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 8,
  },
  textArea: {
    height: 70,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  saveBtn: {
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  settingsTogglesCard: {
    padding: 6,
    borderRadius: 14,
    marginBottom: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  toggleDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
  },
  logoutBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  versionText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 20,
  },
});
