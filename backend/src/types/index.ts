export type UserRole =
  | 'system_admin'
  | 'dispatcher'
  | 'police_worker'
  | 'police_chief'
  | 'triage_nurse'
  | 'er_doctor'
  | 'er_paramedic'
  | 'er_attending';

export type ReportState = 'draft' | 'in_progress' | 'under_review' | 'locked';

export type ReportType = 'incident' | 'medical_chart';

export interface Organization {
  id: string;
  name: string;
  type: 'police' | 'medical';
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: string;
  org_id: string;
  email: string;
  role: UserRole;
  supervisor_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Report {
  id: string;
  org_id: string;
  created_by: string;
  assigned_to: string;
  state: ReportState;
  schema_type: ReportType;
  data: Record<string, any>;
  version: number;
  created_at: Date;
  updated_at: Date;
}

export interface CognitoUser {
  sub: string;
  email: string;
  'custom:org_id': string;
  'custom:role': UserRole;
  'cognito:groups'?: string[];
}

export interface AuthRequest extends Express.Request {
  user?: CognitoUser;
}
