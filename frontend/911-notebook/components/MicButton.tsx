import { useState } from 'react'
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View
} from 'react-native'
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio'
import * as FileSystem from 'expo-file-system/legacy'

const API = process.env.EXPO_PUBLIC_API_GATEWAY_URL

interface MicButtonProps {
  reportType: 'police' | 'medical'
  onFieldsExtracted: (fields: Record<string, any>) => void
}

export default function MicButton({ reportType, onFieldsExtracted }: MicButtonProps) {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const [status, setStatus] = useState<'idle' | 'recording' | 'transcribing' | 'parsing'>('idle')

  const startRecording = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync()
      if (!permission.granted) {
        console.error('Microphone permission not granted')
        return
      }

      await AudioModule.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      })

      await audioRecorder.prepareToRecordAsync()
      audioRecorder.record()
      setStatus('recording')
    } catch (err) {
      console.error('Failed to start recording:', err)
    }
  }

  const stopRecording = async () => {
    try {
      await audioRecorder.stop()
      const uri = audioRecorder.uri
      setStatus('transcribing')

      if (!uri) throw new Error('No audio URI')

      // 1. Convert audio to base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64'
      })

      // 2. Send to Lambda 1 — transcribe
      const transcribeRes = await fetch(`${API}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64Audio })
      })
      const { transcript } = await transcribeRes.json()
      setStatus('parsing')

      // 3. Send to Lambda 2 — parse report
      const parseRes = await fetch(`${API}/parse-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, report_type: reportType })
      })
      const { fields } = await parseRes.json()

      // 4. Send fields back to form
      onFieldsExtracted(fields)
    } catch (err) {
      console.error('Error processing audio:', err)
    } finally {
      setStatus('idle')
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'idle': return '🎤 Tap to Record'
      case 'recording': return '⏹ Stop Recording'
      case 'transcribing': return 'Transcribing...'
      case 'parsing': return 'AI Parsing Report...'
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.btn,
          status === 'recording' && styles.btnRecording,
          (status === 'transcribing' || status === 'parsing') && styles.btnProcessing
        ]}
        onPress={status === 'idle' ? startRecording : stopRecording}
        disabled={status === 'transcribing' || status === 'parsing'}
      >
        {status === 'transcribing' || status === 'parsing'
          ? <ActivityIndicator color="#fff" />
          : null
        }
        <Text style={styles.txt}>{getStatusText()}</Text>
      </TouchableOpacity>

      {status !== 'idle' && (
        <Text style={styles.statusText}>{getStatusText()}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8
  },
  btn: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ff3b3b',
  },
  btnRecording: {
    backgroundColor: '#ff3b3b',
    borderColor: '#ff3b3b',
  },
  btnProcessing: {
    backgroundColor: '#333',
    borderColor: '#555',
  },
  txt: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
  statusText: {
    color: '#888',
    fontSize: 12
  }
})