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
          // 1. Get the current user's JWT token
          const session = await fetchAuthSession();
          // Use the accessToken or idToken depending on your backend authorizer config
          // Usually, it's the idToken.toString()
          const token = session.tokens?.idToken?.toString();

          if (!token) {
            throw new Error("No active session found. Please log in again.");
          }

          // 2. Get the API URL
          const apiUrl = outputs.custom.adminApiUrl; 

          // 3. Make the POST request with the 'Bearer' prefix
          const response = await fetch(`${apiUrl}create-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // CRITICAL: Added 'Bearer ' prefix
              'Authorization': `Bearer ${token}`, 
            },
            body: JSON.stringify({ email: newEmail.trim().toLowerCase() }),
          });

          // Handle the response
          if (response.ok) {
            Alert.alert("Success", `Credentials deployed to ${newEmail}`);
            setNewEmail('');
          } else {
            // Attempt to parse error message from Lambda
            const errorText = await response.text();
            let message = "Failed to create user";
            try {
              const errorData = JSON.parse(errorText);
              message = errorData.message || message;
            } catch (e) {
              message = errorText || message;
            }
            throw new Error(message);
          }
        } catch (error: any) {
          console.error("Admin Error:", error);
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
