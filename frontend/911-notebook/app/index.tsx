import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useFonts, Oswald_700Bold } from '@expo-google-fonts/oswald';

function HomeScreen(): JSX.Element {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.homeTitle}>911 Notepad</Text>
      <Text style={styles.homeGreeting}>Welcome, Responder</Text>

      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardIcon}>🎙️</Text>
          <Text style={styles.cardTitle}>New Report</Text>
          <Text style={styles.cardSub}>Start a voice incident report</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardIcon}>📋</Text>
          <Text style={styles.cardTitle}>Past Reports</Text>
          <Text style={styles.cardSub}>View your filed reports</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, styles.cardSmall]}>
          <Text style={styles.cardIcon}>👤</Text>
          <Text style={styles.cardTitle}>Account</Text>
          <Text style={styles.cardSub}>Your profile & settings</Text>
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
  homeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 4,
  },
  homeGreeting: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 48,
  },
  cardContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  card: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    borderWidth: 1,
    borderColor: '#3a3a5e',
  },
  cardSmall: {
    paddingVertical: 18,
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: '#aaa',
  },
});