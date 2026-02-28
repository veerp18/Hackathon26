import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts, Oswald_700Bold } from '@expo-google-fonts/oswald';

function HomeScreen(): JSX.Element {
  const router = useRouter();
  return (
    <View style={styles.homeContainer}>
      <StatusBar style="light" />
      <Text style={styles.homeGreeting}>Welcome, Responder</Text>

      <View style={styles.cardGrid}>
        <View style={styles.cardRow}>
          <TouchableOpacity style={styles.card} onPress={() => router.push('/report')}>
            <Text style={styles.cardTitle}>Report</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>Past Reports</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.card, styles.cardWide]}>
          <Text style={styles.cardTitle}>Account</Text>
        </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
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
    color: '#fff',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 6,
  },
  form: {
    width: '45%',
    minWidth: 200,
  },
  input: {
    backgroundColor: '#2a2a3e',
    color: '#fff',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3a3a5e',
  },
  button: {
    backgroundColor: '#e63946',
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

  // Home screen
  homeContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingTop: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  homeGreeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 40,
    textAlign: 'center',
  },
  cardGrid: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    width: 190,
    height: 190,
    backgroundColor: '#12122a',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#e63946',
    borderTopWidth: 1,
    borderTopColor: '#3a3a5e',
    borderRightWidth: 1,
    borderRightColor: '#3a3a5e',
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a5e',
    justifyContent: 'flex-end',
    padding: 16,
  },
  cardWide: {
    aspectRatio: undefined,
    paddingVertical: 28,
    width: '100%',
    flex: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
