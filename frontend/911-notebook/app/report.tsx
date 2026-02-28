import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import MicButton from '../components/MicButton'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'

export default function ReportScreen() {
  const router = useRouter()
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [reportType, setReportType] = useState<string>('')
  const [validation, setValidation] = useState<any>(null)
  const API = process.env.EXPO_PUBLIC_API_GATEWAY_URL || 'https://vsbhthrfr0.execute-api.us-east-1.amazonaws.com/prod'
  const handleFieldsExtracted = async (fields: Record<string, any>, type: string) => {
    setFormData(fields)
    setReportType(type)

    // Auto validate
    try {
      const validateRes = await fetch(`${API}/validate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report: fields, report_type: type })
      })
      const validateData = await validateRes.json()
      console.log('Validation:', JSON.stringify(validateData, null, 2))
      setValidation(validateData)
    } catch (err) {
      console.error('Validation error:', err)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Feather name="arrow-left" size={24} color="#5a5f6e" />
      </TouchableOpacity>
      <Text style={styles.label}>Tap mic and speak your report</Text>
      <MicButton onFieldsExtracted={handleFieldsExtracted} />
      {reportType ? (
        <Text style={styles.reportType}>Detected: {reportType.toUpperCase()}</Text>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingTop: 60,
    paddingLeft: 24,
    paddingBottom: 10,
  },
  content: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  label: {
    color: '#fff',
    marginBottom: 20,
    fontSize: 16,
  },
  reportType: {
    color: '#ff3b3b',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 20,
    letterSpacing: 1,
  },
})