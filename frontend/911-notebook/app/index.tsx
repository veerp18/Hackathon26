import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { useFonts, Oswald_700Bold } from '@expo-google-fonts/oswald';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

function PulseDot() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[styles.pulseDot, { opacity }]} />;
}

function HomeScreen(): JSX.Element {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Oswald_700Bold });

  return (
    <View style={styles.homeContainer}>
      <StatusBar style="light" />

      {/* Badge */}
      <View style={styles.badge}>
        <PulseDot />
        <Text style={styles.badgeText}>ACTIVE SYSTEM</Text>
      </View>

      {/* Logo */}
      <Text style={[styles.logo, fontsLoaded && { fontFamily: 'Oswald_700Bold' }]}>
        {'911\n'}<Text style={styles.logoAccent}>Notepad</Text>
      </Text>
      <Text style={styles.tagline}>
        {'Field reporting for first responders.\nFast. Accurate. Secure.'}
      </Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statVal}>24</Text>
          <Text style={styles.statLabel}>Reports logged</Text>
        </View>
        <View style={[styles.stat, styles.statBorder]}>
          <Text style={styles.statVal}>3</Text>
          <Text style={styles.statLabel}>This shift</Text>
        </View>
        <View style={[styles.stat, styles.statBorder]}>
          <Text style={styles.statVal}>4h 12m</Text>
          <Text style={styles.statLabel}>On duty</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => router.push('/report')}>
          <View style={[styles.btnIcon, styles.btnIconPrimary]}>
            <Feather name="mic" size={18} color="#fff" />
          </View>
          <View style={styles.btnText}>
            <Text style={styles.btnTitle}>New Report</Text>
            <Text style={[styles.btnSub, styles.btnSubPrimary]}>Speak-to-text incident capture</Text>
          </View>
          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn}>
          <View style={styles.btnIcon}>
            <Feather name="file-text" size={18} color="#fff" />
          </View>
          <View style={styles.btnText}>
            <Text style={styles.btnTitle}>Past Reports</Text>
            <Text style={styles.btnSub}>View and export PDF records</Text>
          </View>
          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn}>
          <View style={styles.btnIcon}>
            <Feather name="user" size={18} color="#fff" />
          </View>
          <View style={styles.btnText}>
            <Text style={styles.btnTitle}>Account</Text>
            <Text style={styles.btnSub}>Profile, credentials & settings</Text>
          </View>
          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>UNIT #4827 · BADGE 0392</Text>
        <View style={styles.footerDot} />
        <Text style={styles.footerText}>DISPATCH ACTIVE</Text>
      </View>
    </View>
  );
}

export default function App(): JSX.Element {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [fontsLoaded] = useFonts({ Oswald_700Bold });

  if (loggedIn) {
    return <HomeScreen />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={[styles.title, fontsLoaded && { fontFamily: 'Oswald_700Bold' }]}>
          911 Notepad
        </Text>
        <Text style={styles.subtitle}>First Responder Field Notes</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Responder ID"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Passcode"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={() => setLoggedIn(true)}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // --- Login screen ---
  container: {
    flex: 1,
    backgroundColor: '#0e0f11',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 42,
    color: '#e8e9ec',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#5a5f6e',
    marginTop: 6,
  },
  form: {
    width: '45%',
    minWidth: 200,
  },
  input: {
    backgroundColor: '#14161a',
    color: '#e8e9ec',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  button: {
    backgroundColor: '#c0392b',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // --- Home screen ---
  homeContainer: {
    flex: 1,
    backgroundColor: '#0e0f11',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(192,57,43,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(192,57,43,0.2)',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 18,
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e74c3c',
  },
  badgeText: {
    fontSize: 10,
    color: '#e74c3c',
    letterSpacing: 1.5,
    fontWeight: '500',
  },
  logo: {
    fontSize: 58,
    lineHeight: 52,
    color: '#e8e9ec',
    letterSpacing: 1,
  },
  logoAccent: {
    color: '#e74c3c',
  },
  tagline: {
    marginTop: 14,
    fontSize: 13,
    color: '#5a5f6e',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 28,
  },
  stats: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  stat: {
    flex: 1,
    paddingRight: 20,
  },
  statBorder: {
    paddingLeft: 20,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.06)',
  },
  statVal: {
    fontSize: 22,
    fontWeight: '500',
    color: '#e8e9ec',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 11,
    color: '#5a5f6e',
    marginTop: 2,
    letterSpacing: 0.4,
  },
  actions: {
    flex: 1,
    gap: 12,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    backgroundColor: '#14161a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
  },
  btnPrimary: {
    backgroundColor: '#c0392b',
    borderColor: '#c0392b',
  },
  btnIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIconPrimary: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  btnText: {
    flex: 1,
  },
  btnTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#e8e9ec',
    letterSpacing: 0.1,
  },
  btnSub: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  btnSubPrimary: {
    color: 'rgba(255,255,255,0.6)',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 10,
    color: '#5a5f6e',
    letterSpacing: 0.8,
    fontWeight: '500',
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#c0392b',
    opacity: 0.5,
  },
});
