import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getCurrentUser } from 'aws-amplify/auth';
const API = process.env.EXPO_PUBLIC_API_GATEWAY_URL
  ? process.env.EXPO_PUBLIC_API_GATEWAY_URL + '/'
  : 'https://vsbhthrfr0.execute-api.us-east-1.amazonaws.com/prod/';

interface Report {
  report_id: string;
  report_type: 'police' | 'medical';
  timestamp: string;
  fields: Record<string, any>;
}

function getReportSummary(report: Report): { title: string; subtitle: string } {
  const f = report.fields;
  if (report.report_type === 'police') {
    const offense = f.offenses?.[0]?.offense_description || 'Incident';
    const location = f.location?.city || f.location?.address || '';
    return { title: offense, subtitle: location || `#${f.incident_number || 'N/A'}` };
  } else {
    const complaint = f.situation?.chief_complaint || 'Medical Call';
    const patient = f.patient?.name || '';
    return { title: complaint, subtitle: patient || f.dispatch?.call_type || '' };
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function PastReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingId, setExportingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let userId = 'unknown';
      try {
        const user = await getCurrentUser();
        userId = user.signInDetails?.loginId || user.userId;
      } catch {
        // dev bypass
      }

      const url = `${API}get-reports?user_id=${encodeURIComponent(userId)}`;
      console.log('Fetching reports from:', url);
      const res = await fetch(url);
      const data = await res.json();
      console.log('Reports data:', JSON.stringify(data));
      setReports(data.reports || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
      Alert.alert('Error', 'Failed to load reports: ' + err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async (report: Report) => {
    setExportingId(report.report_id);
    try {
      const res = await fetch(`${API}export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report: report.fields,
          report_type: report.report_type,
          report_id: report.report_id,
        }),
      });
      const data = await res.json();
      if (data.pdf_url) {
        await Linking.openURL(data.pdf_url);
      } else {
        throw new Error('No PDF URL returned');
      }
    } catch (err: any) {
      Alert.alert('Export Failed', err.message);
    } finally {
      setExportingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Feather name="arrow-left" size={24} color="#5a5f6e" />
      </TouchableOpacity>

      <Text style={styles.title}>Past Reports</Text>
      <Text style={styles.subtitle}>Field incident records</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#c0392b" />
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.center}>
          <Feather name="file-text" size={48} color="#2a2c32" />
          <Text style={styles.emptyText}>No reports yet</Text>
          <Text style={styles.emptySubText}>Reports will appear here after recording</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
          {reports.map((report) => {
            const { title, subtitle } = getReportSummary(report);
            const isPolice = report.report_type === 'police';
            const isExporting = exportingId === report.report_id;

            return (
              <View key={report.report_id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, isPolice ? styles.badgePolice : styles.badgeMedical]}>
                    <Feather
                      name={isPolice ? 'shield' : 'activity'}
                      size={10}
                      color={isPolice ? '#3b82f6' : '#c0392b'}
                    />
                    <Text style={[styles.badgeText, isPolice ? styles.badgeTextPolice : styles.badgeTextMedical]}>
                      {isPolice ? 'POLICE' : 'MEDICAL'}
                    </Text>
                  </View>
                  <Text style={styles.timestamp}>{formatDate(report.timestamp)}</Text>
                </View>

                <Text style={styles.reportTitle} numberOfLines={1}>{title}</Text>
                {subtitle ? <Text style={styles.reportSubtitle} numberOfLines={1}>{subtitle}</Text> : null}

                <TouchableOpacity
                  style={[styles.exportBtn, isExporting && { opacity: 0.6 }]}
                  onPress={() => handleExportPDF(report)}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="download" size={14} color="#fff" />
                      <Text style={styles.exportText}>Export PDF</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0f11',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  backBtn: {
    marginTop: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    color: '#e8e9ec',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#5a5f6e',
    marginBottom: 28,
    fontSize: 13,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    color: '#5a5f6e',
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubText: {
    color: '#2a2c32',
    fontSize: 13,
  },
  list: {
    flex: 1,
  },
  card: {
    backgroundColor: '#14161a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgePolice: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
  },
  badgeMedical: {
    backgroundColor: 'rgba(192,57,43,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(192,57,43,0.2)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
  },
  badgeTextPolice: {
    color: '#3b82f6',
  },
  badgeTextMedical: {
    color: '#c0392b',
  },
  timestamp: {
    fontSize: 11,
    color: '#5a5f6e',
  },
  reportTitle: {
    fontSize: 16,
    color: '#e8e9ec',
    fontWeight: '500',
  },
  reportSubtitle: {
    fontSize: 12,
    color: '#5a5f6e',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#c0392b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  exportText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
