import React, { useState, useEffect } from 'react'; 
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
  const [orgName, setOrgName] = useState(''); // NEW: State for organization
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const protectRoute = async () => {
      try {
        const session = await fetchAuthSession();
        const groups = session.tokens?.idToken?.payload['cognito:groups'] as string[];
        
        if (!groups || !groups.includes('Admins')) {
          Alert.alert("Access Denied", "You do not have administrative privileges.");
          router.replace('/'); 
        }
      } catch (err) {
        router.replace('/');
      }
    };
    protectRoute();
  }, []);

  const handleAddResponder = async () => {
    // Validation for both fields
    if (!newEmail.includes('@')) {
      Alert.alert("Invalid Entry", "Please enter a valid responder email.");
      return;
    }
    if (!orgName.trim()) {
      Alert.alert("Invalid Entry", "Please enter an organization name.");
      return;
    }

    setIsCreating(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      if (!token) {
        throw new Error("No active session found. Please log in again.");
      }

      const apiUrl = outputs.custom.adminApiUrl; 

      const response = await fetch(`${apiUrl}create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, 
        },
        // Sending both email AND organization to the backend
        body: JSON.stringify({ 
          email: newEmail.trim().toLowerCase(),
          organization: orgName.trim() 
        }),
      });

      if (response.ok) {
        Alert.alert("Success", `Credentials deployed to ${newEmail} for ${orgName}`);
        setNewEmail('');
        setOrgName(''); // Clear both fields on success
      } else {
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
          Assign the responder to an organization and deploy their credentials.
        </Text>

        {/* --- ORGANIZATION INPUT --- */}
        <TextInput
          style={styles.input}
          placeholder="Organization (e.g. Clemson_PD)"
          placeholderTextColor="#5a5f6e"
          value={orgName}
          onChangeText={setOrgName}
          autoCapitalize="none"
        />

        {/* --- EMAIL INPUT --- */}
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
  card: { backgroundColor: '#14161a', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardTitle: { color: '#e8e9ec', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  cardInfo: { color: '#5a5f6e', fontSize: 13, marginBottom: 20, lineHeight: 18 },
  input: { backgroundColor: '#0e0f11', color: '#fff', padding: 16, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#25262b' },
  deployBtn: { backgroundColor: '#c0392b', padding: 16, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  deployText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
