export interface BackupConfig {
  id: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  lastBackup: string;
  nextBackup: string;
  retentionDays: number;
  storageLocation: 'local' | 'cloud' | 'both';
}

export interface BackupRecord {
  id: string;
  timestamp: string;
  type: 'auto' | 'manual';
  size: number;
  status: 'success' | 'failed' | 'in_progress';
  location: string;
  checksum: string;
  description?: string;
}

export interface DataExport {
  id: string;
  format: 'json' | 'csv' | 'xml' | 'sql';
  tables: string[];
  timestamp: string;
  size: number;
  downloadUrl: string;
  expiresAt: string;
}