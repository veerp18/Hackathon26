import { View, StyleSheet, Text, ScrollView, TouchableOpacity, TextInput, Modal, Linking } from 'react-native';
import MicButton from '../components/MicButton'
import { useState } from 'react'

const API = process.env.EXPO_PUBLIC_API_GATEWAY_URL

export default function ReportScreen() {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [reportType, setReportType] = useState<string>('')
  const [validation, setValidation] = useState<any>(null)
  const [selectedField, setSelectedField] = useState<any>(null)
  const [inputValue, setInputValue] = useState<string>('')

  const runValidation = async (fields: Record<string, any>, type: string) => {
    try {
      const validateRes = await fetch(`${API}/validate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report: fields, report_type: type })
      })
      const validateRaw = await validateRes.text()
      const validateData = JSON.parse(validateRaw)
      const validateBody = JSON.parse(validateData.body)
      setValidation(validateBody)
    } catch (err) {
      console.error('Validation error:', err)
    }
  }

  const handleFieldsExtracted = async (fields: Record<string, any>, type: string) => {
    setFormData(fields)
    setReportType(type)
    await runValidation(fields, type)
  }

  const handleFieldTap = (item: any) => {
    setSelectedField(item)
    setInputValue('')
  }

  const handleFieldSave = async () => {
    if (!selectedField || !inputValue.trim()) return

    const keys = selectedField.field.replace(/\[0\]/g, '.0').split('.')
    const updatedData = { ...formData }
    let obj: any = updatedData
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {}
      obj = obj[keys[i]]
    }
    obj[keys[keys.length - 1]] = inputValue.trim()

    setFormData(updatedData)
    setSelectedField(null)
    setInputValue('')

    await runValidation(updatedData, reportType)
  }

  const handleExportPDF = async () => {
    try {
      const reportId = `report-${Date.now()}`
      const exportRes = await fetch(`${API}/export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report: formData,
          report_type: reportType,
          report_id: reportId
        })
      })
      const exportRaw = await exportRes.text()
      console.log('Raw export response:', exportRaw)
      const exportData = JSON.parse(exportRaw)
      const exportBody = JSON.parse(exportData.body)
      console.log('PDF URL:', exportBody.pdf_url)
      await Linking.openURL(exportBody.pdf_url)
    } catch (err) {
      console.error('PDF export error:', err)
    }
  }
  console.log('is_complete:', validation?.is_complete)
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <Text style={styles.label}>Tap mic and speak your report</Text>

      <MicButton onFieldsExtracted={handleFieldsExtracted} />

      {reportType ? (
        <Text style={styles.reportType}>Detected: {reportType.toUpperCase()}</Text>
      ) : null}

      {validation && (
        <View style={styles.validationBox}>

          <View style={[
            styles.statusBadge,
            validation.is_complete ? styles.badgeComplete : styles.badgeIncomplete
          ]}>
            <Text style={styles.statusText}>
              {validation.is_complete ? '✅ Report Complete' : '⚠️ Report Incomplete'}
            </Text>
          </View>

          {validation.missing_fields?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Missing Required Fields — Tap to Fill</Text>
              {validation.missing_fields.map((item: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={styles.missingItem}
                  onPress={() => handleFieldTap(item)}
                >
                  <View style={styles.dot} />
                  <View style={styles.missingText}>
                    <Text style={styles.fieldName}>{item.field}</Text>
                    <Text style={styles.fieldMessage}>{item.message}</Text>
                  </View>
                  <Text style={styles.tapHint}>Tap →</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {validation.issues?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitleWarning}>Warnings</Text>
              {validation.issues.map((item: any, index: number) => (
                <View key={index} style={styles.warningItem}>
                  <View style={styles.dotWarning} />
                  <View style={styles.missingText}>
                    <Text style={styles.fieldName}>{item.field}</Text>
                    <Text style={styles.fieldMessage}>{item.message}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {validation.is_complete && (
            <TouchableOpacity style={styles.exportBtn} onPress={handleExportPDF}>
              <Text style={styles.exportText}>📄 Export PDF</Text>
            </TouchableOpacity>
          )}

        </View>
      )}

      <Modal
        visible={!!selectedField}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedField(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{selectedField?.field}</Text>
            <Text style={styles.modalMessage}>{selectedField?.message}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter value..."
              placeholderTextColor="#555"
              value={inputValue}
              onChangeText={setInputValue}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSelectedField(null)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleFieldSave}
              >
                <Text style={styles.saveText}>Save & Revalidate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  validationBox: {
    marginTop: 24,
    width: '100%',
  },
  statusBadge: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeComplete: {
    backgroundColor: 'rgba(59,255,138,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59,255,138,0.3)',
  },
  badgeIncomplete: {
    backgroundColor: 'rgba(255,179,64,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,179,64,0.3)',
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#ff3b3b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  sectionTitleWarning: {
    color: '#ffb340',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  missingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: 'rgba(255,59,59,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,59,0.15)',
    borderRadius: 8,
    marginBottom: 8,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    backgroundColor: 'rgba(255,179,64,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,179,64,0.15)',
    borderRadius: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3b3b',
    marginTop: 4,
  },
  dotWarning: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffb340',
    marginTop: 4,
  },
  missingText: {
    flex: 1,
  },
  fieldName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  fieldMessage: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  tapHint: {
    color: '#ff3b3b',
    fontSize: 12,
    fontWeight: '600',
  },
  exportBtn: {
    marginTop: 8,
    backgroundColor: '#3bff8a',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  exportText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#14161a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  modalMessage: {
    color: '#888',
    fontSize: 13,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#0e0f11',
    color: '#fff',
    padding: 14,
    borderRadius: 8,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  cancelText: {
    color: '#888',
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#ff3b3b',
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
  },
})