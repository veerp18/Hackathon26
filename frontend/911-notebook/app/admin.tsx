import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { post } from 'aws-amplify/api'; // We'll use this for the Lambda

export default function AdminScreen() {
  const [newEmail, setNewEmail] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleAddResponder = async () => {
    if (!newEmail.includes('@')) {
      Alert.alert("Invalid Email", "Please enter a valid responder email.");
      return;
    }

    setIsCreating(true);
    try {
      // Calling the Lambda function we defined earlier via API
      const restOperation = post({
        apiName: 'adminApi',
        path: '/create-user',
        options: { body: { email: newEmail.trim() } }
      });
      
      await restOperation.response;
      Alert.alert("Success", `Account created for ${newEmail}. They will receive an email with instructions.`);
      setNewEmail('');
    } catch (error: any) {
      console.error(error);
      Alert.alert("System Error", error.message || "Could not create user.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView className="p-6">
        <Text className="text-3xl font-bold text-white mb-2">Command Center</Text>
        <Text className="text-slate-400 mb-8">Admin Access: System & Personnel</Text>

        {/* System Stats Section */}
        <View className="flex-row justify-between mb-8">
          <View className="bg-slate-800 p-4 rounded-xl w-[48%] border border-emerald-500/30">
            <Text className="text-slate-400 text-xs uppercase font-bold">System Status</Text>
            <Text className="text-emerald-400 text-xl font-bold">ACTIVE</Text>
          </View>
          <View className="bg-slate-800 p-4 rounded-xl w-[48%] border border-slate-700">
            <Text className="text-slate-400 text-xs uppercase font-bold">Active Units</Text>
            <Text className="text-white text-xl font-bold">12</Text>
          </View>
        </View>

        {/* Add New Responder Section */}
        <View className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <Text className="text-xl font-semibold text-white mb-4">Add New Responder</Text>
          <Text className="text-slate-400 mb-4 text-sm">
            This will create a new account and trigger a temporary passcode email.
          </Text>

          <TextInput
            className="bg-slate-900 text-white p-4 rounded-lg mb-4 border border-slate-600"
            placeholder="Responder Email (e.g. officer@city.gov)"
            placeholderTextColor="#64748b"
            value={newEmail}
            onChangeText={setNewEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity 
            onPress={handleAddResponder}
            disabled={isCreating}
            className={`p-4 rounded-lg flex-row justify-center items-center ${isCreating ? 'bg-slate-600' : 'bg-blue-600'}`}
          >
            {isCreating ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Deploy Credentials</Text>}
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <TouchableOpacity className="mt-12 self-center">
          <Text className="text-red-500 font-semibold text-sm">Emergency System Lockout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
