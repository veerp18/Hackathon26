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

const API = process.env.EXPO_PUBLIC_API_GATEWAY_URL || 'https://vsbhthrfr0.execute-api.us-east-1.amazonaws.com/prod'

interface MicButtonProps {
  onFieldsExtracted: (fields: Record<string, any>, reportType: string) => void
}

export default function MicButton({ onFieldsExtracted }: MicButtonProps) {
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

      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64'
      })

      // 1. Start transcription job
      const startRes = await fetch(`${API}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64Audio })
      })
      const startData = await startRes.json()
      const jobName = startData.job_name

      // 2. Poll until complete
      let transcript = ''
      while (true) {
        await new Promise(resolve => setTimeout(resolve, 3000))
        const pollRes = await fetch(`${API}/transcribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_name: jobName })
        })
        const pollBody = await pollRes.json()

        if (pollBody.status === 'COMPLETED') {
          transcript = pollBody.transcript
          break
        } else if (pollBody.status === 'FAILED') {
          throw new Error('Transcription failed')
        }
        // Still IN_PROGRESS, keep polling
      }

      setStatus('parsing')

      // Get user id for DynamoDB save
      let userId = 'unknown'
      try {
        const { getCurrentUser } = await import('aws-amplify/auth')
        const user = await getCurrentUser()
        userId = user.signInDetails?.loginId || user.userId
      } catch { /* dev bypass */ }

      // 3. Parse report
      const parseRes = await fetch(`${API}/parse-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, user_id: userId })
      })
      const { fields, report_type } = await parseRes.json()
      console.log('Parse response fields:', JSON.stringify(fields))

      onFieldsExtracted(fields, report_type)
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
