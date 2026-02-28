import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
import reportService from '../services/reportService';

interface VoiceRecorderProps {
  onRecordingComplete?: (reportData: any) => void;
  reportId?: string;
}

export default function VoiceRecorder({ onRecordingComplete, reportId }: VoiceRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  async function startRecording() {
    try {
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please grant microphone permission to record audio');
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  }

  async function stopRecording() {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        // Upload to backend
        await uploadVoiceMemo(uri);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to stop recording');
    }
  }

  async function uploadVoiceMemo(audioUri: string) {
    try {
      setIsUploading(true);
      
      // Upload voice memo to backend
      const report = await reportService.uploadVoiceMemo(audioUri, reportId);
      
      Alert.alert('Success', 'Voice memo uploaded and processed!');
      
      if (onRecordingComplete) {
        onRecordingComplete(report);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload voice memo');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.recordButton,
          isRecording && styles.recordButtonActive,
          isUploading && styles.recordButtonDisabled,
        ]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={isUploading}
      >
        <View style={[styles.recordButtonInner, isRecording && styles.recordButtonInnerActive]} />
      </TouchableOpacity>

      <Text style={styles.statusText}>
        {isUploading
          ? 'Uploading...'
          : isRecording
          ? 'Recording... (Tap to stop)'
          : 'Tap to record'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e63946',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  recordButtonActive: {
    backgroundColor: '#ff4757',
  },
  recordButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  recordButtonInnerActive: {
    width: 30,
    height: 30,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});
