import { View, StyleSheet } from 'react-native';
import MicButton from '../components/MicButton'
import { useState } from 'react'

export default function ReportScreen() {
  const [formData, setFormData] = useState({})

  const handleFieldsExtracted = (fields: Record<string, any>) => {
    setFormData(prev => ({ ...prev, ...fields }))
  }

  return (
    <View style={styles.container}>
      <MicButton
        reportType="medical"
        onFieldsExtracted={handleFieldsExtracted}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
})