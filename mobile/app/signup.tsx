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
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft, CheckCircle2 } from 'lucide-react-native';

import { Text, View, Card } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function SignupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const activeColors = Colors[colorScheme];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://sadbhawanabilldesk.vercel.app/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setError(null);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err: any) {
      console.error(err);
      setError('Network error. Check your connection or try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={[styles.container, styles.successContainer, { backgroundColor: activeColors.background }]}>
        <View style={styles.successContent}>
          <CheckCircle2 size={80} color={activeColors.success} style={styles.successIcon} />
          <Text style={[styles.successTitle, { color: activeColors.text }]}>Account Created!</Text>
          <Text style={[styles.successSubtitle, { color: activeColors.muted }]}>
            Your Sadbhawana BillDesk account has been registered successfully.
          </Text>
          
          <TouchableOpacity 
            style={[styles.loginRedirectBtn, { backgroundColor: activeColors.tint }]}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.loginRedirectText}>Proceed to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: activeColors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Back Button */}
        <TouchableOpacity 
          style={[styles.backBtn, { borderColor: activeColors.border }]} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={activeColors.text} />
        </TouchableOpacity>

        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: activeColors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: activeColors.muted }]}>
            Join Sadbhawana BillDesk to simplify your billing
          </Text>
        </View>

        <Card style={styles.formCard}>
          {error && (
            <View style={[styles.errorBox, { borderColor: activeColors.danger + '40', backgroundColor: activeColors.danger + '10' }]}>
              <Text style={[styles.errorText, { color: activeColors.danger }]}>{error}</Text>
            </View>
          )}

          {/* Full Name Input */}
          <Text style={[styles.inputLabel, { color: activeColors.text }]}>Full Name</Text>
          <View style={[styles.inputContainer, { borderColor: activeColors.border }]}>
            <User size={20} color={activeColors.muted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: activeColors.text }]}
              placeholder="John Doe"
              placeholderTextColor={activeColors.muted}
              autoCapitalize="words"
              autoCorrect={false}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Email Input */}
          <Text style={[styles.inputLabel, { color: activeColors.text }]}>Email Address</Text>
          <View style={[styles.inputContainer, { borderColor: activeColors.border }]}>
            <Mail size={20} color={activeColors.muted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: activeColors.text }]}
              placeholder="john@example.com"
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

          {/* Confirm Password Input */}
          <Text style={[styles.inputLabel, { color: activeColors.text }]}>Confirm Password</Text>
          <View style={[styles.inputContainer, { borderColor: activeColors.border }]}>
            <Lock size={20} color={activeColors.muted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: activeColors.text }]}
              placeholder="••••••••"
              placeholderTextColor={activeColors.muted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          {/* Register Button */}
          <TouchableOpacity 
            style={[styles.registerBtn, { backgroundColor: activeColors.tint }]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.registerBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </Card>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: activeColors.muted }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={[styles.footerLink, { color: activeColors.tint }]}>Sign In</Text>
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 50,
  },
  headerSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  formCard: {
    borderRadius: 20,
    padding: 24,
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
  registerBtn: {
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
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
  successContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  successContent: {
    alignItems: 'center',
    textAlign: 'center',
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  loginRedirectBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  loginRedirectText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
