import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, Alert, ActivityIndicator, ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

// AWS Amplify & Auth Imports
import { fetchAuthSession } from 'aws-amplify/auth';
import outputs from '../amplify_outputs.json';


export default function AdminScreen() {
  const router = useRouter();
  const [newEmail, setNewEmail] = useState('');
  const [isCreating, setIsCreating] = useState(false);



// ... inside your AdminScreen component ...

  const handleAddResponder = async () => {
    if (!newEmail.includes('@')) {
      Alert.alert("Invalid Entry", "Please enter a valid responder email.");
      return;
    }

    setIsCreating(true);
    try {
      // 1. Get the current user's JWT token (required for the Authorizer)
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      // 2. Get the API URL from the custom outputs we defined in backend.ts
      const apiUrl = outputs.custom.adminApiUrl;

      const cleanUrl = apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`;

      // 3. Make a direct POST request
      const response = await fetch(`${apiUrl}create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || '',
        },
        body: JSON.stringify({ email: newEmail.trim().toLowerCase() }),
      });

      if (response.ok) {
        Alert.alert("Success", `Credentials deployed to ${newEmail}`);
        setNewEmail('');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create user");
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("System Error", error.message);
    } finally {
      setIsCreating(false);
    }
  };


  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Feather name="arrow-left" size={24} color="#5a5f6e" />
      </TouchableOpacity>

      <Text style={styles.title}>Command Center</Text>
      <Text style={styles.subtitle}>Personnel & System Management</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add New Responder</Text>
        <Text style={styles.cardInfo}>
          This will trigger an automated email with a temporary passcode.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="officer@agency.gov"
          placeholderTextColor="#5a5f6e"
          value={newEmail}
          onChangeText={setNewEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TouchableOpacity 
          style={[styles.deployBtn, isCreating && { opacity: 0.6 }]} 
          onPress={handleAddResponder}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="shield" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.deployText}>Deploy Credentials</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e0f11', padding: 24 },
  backBtn: { marginTop: 40, marginBottom: 20 },
  title: { fontSize: 32, color: '#e8e9ec', fontWeight: 'bold' },
  subtitle: { color: '#5a5f6e', marginBottom: 32 },
  card: { backgroundColor: '#14161a', padding: 24, borderRadius: 16, borderOuterWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardTitle: { color: '#e8e9ec', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  cardInfo: { color: '#5a5f6e', fontSize: 13, marginBottom: 20, lineHeight: 18 },
  input: { backgroundColor: '#0e0f11', color: '#fff', padding: 16, borderRadius: 8, marginBottom: 16, borderSize: 1, borderColor: '#25262b' },
  deployBtn: { backgroundColor: '#c0392b', padding: 16, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  deployText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
