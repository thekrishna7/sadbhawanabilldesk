import React, { useState } from 'react';
import { 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react-native';

import { Text, View, Card } from '@/components/Themed';
import { useStore } from '@/store/useStore';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const activeColors = Colors[colorScheme];
  const { login } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For development/demo purposes, we perform a mock validation
      // and call login with a simulated token and user info
      // In production, this would make an API request
      const response = await fetch('https://sadbhawanabilldesk.vercel.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Success
        login(data.token, data.token, {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          businessName: data.user.businessProfile?.name,
          phone: data.user.phone,
          isProfileComplete: !!data.user.businessProfile,
        });
        router.replace('/(tabs)');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err: any) {
      console.error(err);
      setError('Network error. Check your connection or try offline demo.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: activeColors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.headerSection}>
          <View style={[styles.logoIconBg, { backgroundColor: activeColors.secondary + '15' }]}>
            <Sparkles size={40} color={activeColors.secondary} />
          </View>
          <Text style={[styles.appName, { color: activeColors.tint }]}>SADBHAWANA</Text>
          <Text style={[styles.appSubName, { color: activeColors.secondary }]}>BILLDESK</Text>
          <Text style={[styles.appTagline, { color: activeColors.muted }]}>
            Smart Billing & Offline Invoice SaaS
          </Text>
        </View>

        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Welcome Back</Text>
          <Text style={[styles.formSubtitle, { color: activeColors.muted }]}>
            Sign in to manage your bills and customers
          </Text>

          {error && (
            <View style={[styles.errorBox, { borderColor: activeColors.danger + '40', backgroundColor: activeColors.danger + '10' }]}>
              <Text style={[styles.errorText, { color: activeColors.danger }]}>{error}</Text>
            </View>
          )}

          {/* Email Input */}
          <Text style={[styles.inputLabel, { color: activeColors.text }]}>Email Address</Text>
          <View style={[styles.inputContainer, { borderColor: activeColors.border }]}>
            <Mail size={20} color={activeColors.muted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: activeColors.text }]}
              placeholder="name@company.com"
              placeholderTextColor={activeColors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password Input */}
          <Text style={[styles.inputLabel, { color: activeColors.text }]}>Password</Text>
          <View style={[styles.inputContainer, { borderColor: activeColors.border }]}>
            <Lock size={20} color={activeColors.muted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: activeColors.text }]}
              placeholder="••••••••"
              placeholderTextColor={activeColors.muted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              {showPassword ? (
                <EyeOff size={20} color={activeColors.muted} />
              ) : (
                <Eye size={20} color={activeColors.muted} />
              )}
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            style={[styles.loginBtn, { backgroundColor: activeColors.tint }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.btnContent}>
                <Text style={styles.loginBtnText}>Sign In</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>


        </Card>

        {/* Footer Link to Signup */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: activeColors.muted }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={[styles.footerLink, { color: activeColors.tint }]}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 60,
  },
  logoIconBg: {
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 4,
    textAlign: 'center',
  },
  appSubName: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 6,
    textAlign: 'center',
    marginTop: 4,
  },
  appTagline: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  formCard: {
    borderRadius: 20,
    padding: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    marginBottom: 20,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  eyeIcon: {
    padding: 6,
  },
  loginBtn: {
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
    marginHorizontal: 10,
  },
  demoBtn: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
