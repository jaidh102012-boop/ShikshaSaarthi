import React, { useState, useEffect, useRef } from 'react';
import { Download, Upload, Settings, Clock, Database, Shield, AlertTriangle, CheckCircle, XCircle, Cloud, FileUp } from 'lucide-react';
import BackupService from '../../services/backupService';
import { BackupConfig, BackupRecord, DataExport } from '../../types/backup';
import { exportToJSON, exportToCSV, exportToXML, exportToSQL } from '../../utils/exportUtils';
import GoogleDriveService from '../../utils/googleDriveUtils';
import { useAuth } from '../../context/AuthContext';

export default function BackupManagement() {
  const { users, classes, assignments, attendanceRecords, importBackupData } = useAuth();
  const [backupService] = useState(() => BackupService.getInstance());
  const [driveService] = useState(() => GoogleDriveService.getInstance());
  const [backupConfigs, setBackupConfigs] = useState<BackupConfig[]>([]);
  const [backupHistory, setBackupHistory] = useState<BackupRecord[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'xml' | 'sql'>('json');
  const [selectedTables, setSelectedTables] = useState<string[]>(['users', 'classes', 'assignments', 'attendance']);
  const [activeTab, setActiveTab] = useState<'backups' | 'exports' | 'imports' | 'settings' | 'gdrive'>('backups');
  const [gdriveConnected, setGdriveConnected] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFormat, setImportFormat] = useState<'json' | 'csv' | 'xml' | 'sql'>('json');
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBackupConfigs(backupService.initializeBackupConfigs());
    setBackupHistory(backupService.getBackupHistory());

    // Auto-initialize Google Drive with environment credentials
    const initGoogleDrive = async () => {
      const isAuth = driveService.isAuthenticated();
      if (!isAuth) {
        const initialized = await driveService.initialize();
        if (initialized) {
          const authenticated = await driveService.authenticate();
          setGdriveConnected(authenticated);
        }
      } else {
        setGdriveConnected(true);
      }
    };

    initGoogleDrive();
  }, [backupService, driveService]);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const backup = await backupService.createManualBackup('Manual backup created by admin');
      setBackupHistory([backup, ...backupHistory]);
    } catch (error) {
      console.error('Backup failed:', error);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const dataToExport: any = {};
      const timestamp = new Date().toISOString().split('T')[0];

      if (selectedTables.includes('users')) dataToExport.users = users;
      if (selectedTables.includes('classes')) dataToExport.classes = classes;
      if (selectedTables.includes('assignments')) dataToExport.assignments = assignments;
      if (selectedTables.includes('attendance')) dataToExport.attendance = attendanceRecords;

      const filename = `kv2-backup-${timestamp}`;

      switch (exportFormat) {
        case 'json':
          exportToJSON(dataToExport, filename);
          break;
        case 'csv':
          Object.entries(dataToExport).forEach(([tableName, data]) => {
            if (Array.isArray(data) && data.length > 0) {
              const headers = Object.keys(data[0]);
              exportToCSV(data, headers, `${filename}-${tableName}`);
            }
          });
          break;
        case 'xml':
          exportToXML(dataToExport, 'backup', filename);
          break;
        case 'sql':
          Object.entries(dataToExport).forEach(([tableName, data]) => {
            if (Array.isArray(data)) {
              exportToSQL(tableName, data, `${filename}-${tableName}`);
            }
          });
          break;
      }

      alert(`Data exported successfully in ${exportFormat.toUpperCase()} format!`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleGDriveBackup = async () => {
    if (!gdriveConnected) {
      setShowGDriveSetup(true);
      return;
    }

    setIsCreatingBackup(true);
    try {
      const backupData = {
        users,
        classes,
        assignments,
        attendance: attendanceRecords,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      const filename = `kv2-gdrive-backup-${new Date().toISOString().split('T')[0]}.json`;
      const fileId = await driveService.uploadBackup(backupData, filename);

      const backup: BackupRecord = {
        id: `backup_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'auto',
        size: Math.round(JSON.stringify(backupData).length / 1024 / 1024),
        status: 'success',
        location: `Google Drive (${fileId})`,
        checksum: fileId,
        description: 'Automatic Google Drive backup'
      };

      setBackupHistory([backup, ...backupHistory]);
      alert('Backup uploaded to Google Drive successfully!');
    } catch (error) {
      console.error('Google Drive backup failed:', error);
      alert('Failed to backup to Google Drive. Please check your connection.');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleConfigUpdate = (configId: string, updates: Partial<BackupConfig>) => {
    try {
      const updatedConfig = backupService.updateBackupConfig(configId, updates);
      setBackupConfigs(prev => prev.map(c => c.id === configId ? updatedConfig : c));
    } catch (error) {
      console.error('Config update failed:', error);
    }
  };

  const getStatusIcon = (status: BackupRecord['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB < 1024) {
      return `${sizeInMB} MB`;
    }
    return `${(sizeInMB / 1024).toFixed(2)} GB`;
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const fileContent = await file.text();
      let importedData: any = {};

      // Parse based on format
      if (importFormat === 'json') {
        importedData = JSON.parse(fileContent);
      } else if (importFormat === 'csv') {
        alert('CSV import: Please import individual table CSV files');
        setIsImporting(false);
        return;
      } else if (importFormat === 'xml') {
        alert('XML import is not yet supported. Please use JSON format.');
        setIsImporting(false);
        return;
      } else if (importFormat === 'sql') {
        alert('SQL import is not yet supported. Please use JSON format.');
        setIsImporting(false);
        return;
      }

      // Import the data using AuthContext's importBackupData
      const success = await importBackupData(importedData);

      if (success) {
        alert('Data imported successfully! Please refresh the page to see changes.');
        window.location.reload();
      } else {
        alert('Failed to import data. Please check the file format.');
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import data. Please check the file format.');
    } finally {
      setIsImporting(false);
      if (importFileRef.current) {
        importFileRef.current.value = '';
      }
    }
  };

  const tabs = [
    { id: 'backups', label: 'Backups', icon: Database },
    { id: 'exports', label: 'Data Export', icon: Download },
    { id: 'imports', label: 'Data Import', icon: FileUp },
    { id: 'gdrive', label: 'Google Drive', icon: Cloud },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Data Backup & Recovery</h2>
            <p className="text-gray-600">Manage system backups and data exports</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-green-600">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">System Protected</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-6 border-b">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Backups Tab */}
      {activeTab === 'backups' && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleCreateBackup}
                disabled={isCreatingBackup}
                className="flex items-center justify-center p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
              >
                {isCreatingBackup ? (
                  <Clock className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Database className="h-5 w-5 mr-2" />
                )}
                {isCreatingBackup ? 'Creating Backup...' : 'Create Manual Backup'}
              </button>
              
              <button className="flex items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                <Upload className="h-5 w-5 mr-2" />
                Restore from Backup
              </button>
              
              <button className="flex items-center justify-center p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                <Settings className="h-5 w-5 mr-2" />
                Schedule Backup
              </button>
            </div>
          </div>

          {/* Backup History */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup History</h3>
            <div className="space-y-3">
              {backupHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No backups created yet</p>
                  <p className="text-sm">Create your first backup to get started</p>
                </div>
              ) : (
                backupHistory.map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(backup.status)}
                      <div>
                        <p className="font-medium text-gray-900">
                          {backup.type === 'manual' ? 'Manual Backup' : 'Automatic Backup'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(backup.timestamp).toLocaleString()} • {formatFileSize(backup.size)}
                        </p>
                        {backup.description && (
                          <p className="text-xs text-gray-500">{backup.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {backup.status === 'success' && (
                        <>
                          <button className="text-blue-600 hover:text-blue-700 text-sm">
                            Download
                          </button>
                          <button className="text-green-600 hover:text-green-700 text-sm">
                            Restore
                          </button>
                        </>
                      )}
                      <span className="text-xs text-gray-500">
                        {backup.checksum.substring(0, 8)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Data Export Tab */}
      {activeTab === 'exports' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Export Data</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="xml">XML</option>
                <option value="sql">SQL</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Tables</label>
              <div className="space-y-2">
                {['users', 'classes', 'assignments', 'attendance'].map((table) => (
                  <label key={table} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedTables.includes(table)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTables([...selectedTables, table]);
                        } else {
                          setSelectedTables(selectedTables.filter(t => t !== table));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm capitalize">{table}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={handleExportData}
              disabled={isExporting || selectedTables.length === 0}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
            >
              {isExporting ? (
                <Clock className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isExporting ? 'Exporting...' : 'Export Data'}
            </button>
          </div>
        </div>
      )}

      {/* Data Import Tab */}
      {activeTab === 'imports' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Import Data</h3>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Import Instructions</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>Select the format of your backup file</li>
                <li>Choose your backup file from your computer</li>
                <li>The system will restore all data from the backup</li>
                <li>JSON format is recommended for complete data restoration</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Import Format</label>
                <select
                  value={importFormat}
                  onChange={(e) => setImportFormat(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="json">JSON (Recommended)</option>
                  <option value="csv">CSV (Individual Tables)</option>
                  <option value="xml">XML (Not Yet Supported)</option>
                  <option value="sql">SQL (Not Yet Supported)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Backup File</label>
                <input
                  ref={importFileRef}
                  type="file"
                  accept={
                    importFormat === 'json' ? '.json' :
                    importFormat === 'csv' ? '.csv' :
                    importFormat === 'xml' ? '.xml' :
                    '.sql'
                  }
                  onChange={handleImportData}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={isImporting}
                />
              </div>
            </div>

            {isImporting && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-yellow-600 animate-spin mr-3" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Importing data...</p>
                    <p className="text-xs text-yellow-700">Please wait while we restore your data</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Warning</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Importing data will replace existing data. Make sure to create a backup before importing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Tab */}
      {activeTab === 'gdrive' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Google Drive Integration</h3>
                <p className="text-sm text-gray-600">Automatic cloud backups to Google Drive</p>
              </div>
              {gdriveConnected ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-gray-500">
                  <XCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Not Connected</span>
                </div>
              )}
            </div>

            {gdriveConnected ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={handleGDriveBackup}
                    disabled={isCreatingBackup}
                    className="flex items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    {isCreatingBackup ? (
                      <Clock className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Cloud className="h-5 w-5 mr-2" />
                    )}
                    {isCreatingBackup ? 'Uploading...' : 'Backup to Google Drive'}
                  </button>

                  <button
                    onClick={() => {
                      driveService.disconnect();
                      setGdriveConnected(false);
                      alert('Disconnected from Google Drive');
                    }}
                    className="flex items-center justify-center p-4 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Disconnect
                  </button>

                  <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Auto Backup</p>
                      <p className="text-lg font-semibold text-gray-900">Daily</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Features</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>Automatic daily backups at midnight</li>
                    <li>30-day backup retention</li>
                    <li>Encrypted data transmission</li>
                    <li>Easy restore from any backup</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300 animate-spin" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Connecting to Google Drive...</h4>
                <p className="text-gray-600 mb-4">
                  Initializing automatic cloud backups
                </p>
                <div className="text-sm text-gray-500">
                  <p>Client ID: {import.meta.env.VITE_GOOGLE_CLIENT_ID?.substring(0, 20)}...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Backup Settings</h3>

          <div className="space-y-6">
            {backupConfigs.map((config) => (
              <div key={config.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 capitalize">
                      {config.frequency} Backup
                    </h4>
                    <p className="text-sm text-gray-600">
                      Next: {new Date(config.nextBackup).toLocaleString()}
                    </p>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => handleConfigUpdate(config.id, { enabled: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm">Enabled</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Retention (days)
                    </label>
                    <input
                      type="number"
                      value={config.retentionDays}
                      onChange={(e) => handleConfigUpdate(config.id, { retentionDays: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Storage Location
                    </label>
                    <select
                      value={config.storageLocation}
                      onChange={(e) => handleConfigUpdate(config.id, { storageLocation: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="local">Local Only</option>
                      <option value="cloud">Cloud Only</option>
                      <option value="both">Local + Cloud</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <div className="text-sm text-gray-600">
                      Last: {new Date(config.lastBackup).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Disaster Recovery Plan</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Ensure cloud backups are enabled for critical data protection.
                  Test restore procedures regularly to verify backup integrity.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}