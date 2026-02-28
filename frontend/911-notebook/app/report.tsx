import { View, StyleSheet, Text, ScrollView } from 'react-native';
import MicButton from '../components/MicButton'
import { useState } from 'react'

export default function ReportScreen() {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [reportType, setReportType] = useState<string>('')
  const [validation, setValidation] = useState<any>(null)
  const API = process.env.EXPO_PUBLIC_API_GATEWAY_URL
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
      const validateBody = JSON.parse(validateData.body)
      console.log('Validation:', JSON.stringify(validateBody, null, 2))
      setValidation(validateBody)
    } catch (err) {
      console.error('Validation error:', err)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
  content: {
    alignItems: 'center',
    paddingTop: 100,
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