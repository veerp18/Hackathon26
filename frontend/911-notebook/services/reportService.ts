import api from './api';

export interface Report {
  id: string;
  org_id: string;
  created_by: string;
  assigned_to: string;
  state: 'draft' | 'in_progress' | 'under_review' | 'locked';
  schema_type: 'incident' | 'medical_chart';
  data: Record<string, any>;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface CreateReportData {
  schema_type: 'incident' | 'medical_chart';
  assigned_to: string;
  data: Record<string, any>;
}

export interface UpdateReportData {
  data?: Record<string, any>;
  state?: 'draft' | 'in_progress' | 'under_review' | 'locked';
  assigned_to?: string;
}

class ReportService {
  /**
   * Create a new report
   */
  async createReport(reportData: CreateReportData): Promise<Report> {
    const response = await api.post('/reports/', reportData);
    return response.data;
  }

  /**
   * Get all reports (with optional filters)
   */
  async getReports(params?: {
    state?: string;
    assigned_to_me?: boolean;
  }): Promise<Report[]> {
    const response = await api.get('/reports/', { params });
    return response.data;
  }

  /**
   * Get a specific report by ID
   */
  async getReport(reportId: string): Promise<Report> {
    const response = await api.get(`/reports/${reportId}`);
    return response.data;
  }

  /**
   * Update a report
   */
  async updateReport(reportId: string, updateData: UpdateReportData): Promise<Report> {
    const response = await api.patch(`/reports/${reportId}`, updateData);
    return response.data;
  }

  /**
   * Delete a report (only draft reports)
   */
  async deleteReport(reportId: string): Promise<void> {
    await api.delete(`/reports/${reportId}`);
  }

  /**
   * Get report version history
   */
  async getReportHistory(reportId: string): Promise<any[]> {
    const response = await api.get(`/reports/${reportId}/history`);
    return response.data;
  }

  /**
   * Upload voice memo and create/update report
   */
  async uploadVoiceMemo(audioUri: string, reportId?: string): Promise<Report> {
    try {
      const formData = new FormData();
      
      // React Native FormData requires specific format
      const audioFile = {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'voice-memo.m4a',
      };
      
      // @ts-ignore - React Native FormData accepts this format
      formData.append('audio', audioFile);

      if (reportId) {
        formData.append('report_id', reportId);
      }

      console.log('Uploading voice memo:', { 
        audioUri, 
        reportId,
        audioFile 
      });

      const response = await api.post('/reports/voice-memo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data, headers) => {
          // Let React Native handle the FormData transformation
          return data;
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Voice memo upload error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        message: error.message,
      });
      
      // Log the full error for debugging
      if (error.response?.data?.detail) {
        console.error('Error detail:', JSON.stringify(error.response.data.detail, null, 2));
      }
      
      throw error;
    }
  }
}

export default new ReportService();
