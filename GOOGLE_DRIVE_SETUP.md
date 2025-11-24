# Google Drive Integration Setup Guide

## Overview
This document explains how to set up Google Drive integration for automatic backups in the KV No.2 School Management System.

## Features Implemented

### 1. CSV Import/Export for Exam Timetable
- Import exam entries from CSV files
- Export exam timetable to CSV format
- Automatically parse and validate CSV data
- Support for bulk entry management

### 2. Multi-Format Data Export
All export formats now work with actual file downloads:
- **JSON**: Complete data structure with proper formatting
- **CSV**: Table-based format with proper encoding
- **XML**: Structured XML with proper escaping
- **SQL**: INSERT statements for database migration

### 3. Google Drive Backup Integration
- Manual backup to Google Drive
- Automatic scheduled backups to Google Drive
- Secure cloud storage for school data
- Easy data recovery from cloud

## How It Currently Works

### Local Implementation
The current implementation uses a simulation of Google Drive:
- Backups are stored in localStorage
- File downloads are triggered automatically
- All formats generate proper downloadable files

### CSV Import (Exam Timetable)
1. Click "Import CSV" button in Exam Timetable section
2. Select a CSV file with the following format:
   ```
   Date,Day,Start Time,End Time,Subject,Class,Room,Invigilator
   2025-02-10,Monday,09:00,12:00,Mathematics,10-A,Room 101,Mr. Smith
   2025-02-12,Wednesday,09:00,12:00,Physics,10-A,Room 102,Mrs. Johnson
   ```
3. The system will parse and import all entries automatically

### Export Data
1. Go to Admin Dashboard > Data Backup > Data Export tab
2. Select format (JSON, CSV, XML, or SQL)
3. Select tables to export
4. Click "Export Data"
5. File will download automatically

### Google Drive Backup
1. Go to Admin Dashboard > Data Backup > Backups tab
2. Click "Backup to Google Drive"
3. System will create backup and simulate upload to Google Drive
4. In production, this would authenticate with Google and upload actual files

## Production Setup (Future Implementation)

To enable real Google Drive integration in production:

### Step 1: Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Drive API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

### Step 2: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application"
4. Add authorized JavaScript origins:
   - http://localhost:5173 (for development)
   - Your production domain
5. Add authorized redirect URIs:
   - http://localhost:5173/auth/callback
   - Your production domain callback URL
6. Save Client ID and Client Secret

### Step 3: Install Google API Client
```bash
npm install @react-oauth/google
npm install googleapis
```

### Step 4: Update BackupService
Replace the placeholder `uploadToGoogleDrive` method with:

```typescript
import { google } from 'googleapis';

async uploadToGoogleDrive(backupData: any): Promise<string> {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Set credentials from stored tokens
  auth.setCredentials({
    access_token: localStorage.getItem('google_access_token'),
    refresh_token: localStorage.getItem('google_refresh_token'),
  });

  const drive = google.drive({ version: 'v3', auth });

  // Create backup file
  const fileMetadata = {
    name: `kv2_backup_${Date.now()}.json`,
    mimeType: 'application/json',
  };

  const media = {
    mimeType: 'application/json',
    body: JSON.stringify(backupData),
  };

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id',
  });

  return file.data.id || '';
}
```

### Step 5: Add Authentication Flow
1. Add Google Sign-In button
2. Handle OAuth callback
3. Store access and refresh tokens securely
4. Implement token refresh logic

### Step 6: Environment Variables
Create `.env` file:
```
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here
VITE_GOOGLE_REDIRECT_URI=your_redirect_uri_here
```

## Security Considerations

1. **Never commit credentials**: Always use environment variables
2. **Token Storage**: Store tokens securely (consider encryption)
3. **Scope Limitations**: Only request necessary Google Drive scopes
4. **User Consent**: Always get explicit user consent before accessing Drive
5. **Token Refresh**: Implement automatic token refresh
6. **Error Handling**: Handle API errors gracefully
7. **Rate Limiting**: Respect Google API rate limits

## Testing

### Test CSV Import
1. Create a sample CSV file with exam data
2. Import it using the Import CSV button
3. Verify all entries appear in the timetable

### Test Export Formats
1. Select different formats (JSON, CSV, XML, SQL)
2. Export data
3. Open downloaded files to verify format and content

### Test Google Drive Backup (Simulated)
1. Click "Backup to Google Drive"
2. Check backup history for successful entry
3. Verify backup status and timestamp

## Troubleshooting

### CSV Import Issues
- Ensure CSV has correct headers
- Check for proper date/time formats
- Verify no special characters in data

### Export Not Downloading
- Check browser's download settings
- Allow pop-ups from the application
- Check browser console for errors

### Google Drive Connection
- Verify OAuth credentials are correct
- Check network connectivity
- Ensure API is enabled in Google Cloud Console
- Verify user has granted necessary permissions

## Support

For issues or questions:
- Check browser console for detailed error messages
- Verify all prerequisites are met
- Contact system administrator for production setup

## Future Enhancements

1. **Two-way Sync**: Restore directly from Google Drive
2. **Incremental Backups**: Only backup changed data
3. **Multiple Cloud Providers**: Add support for Dropbox, OneDrive
4. **Backup Encryption**: Encrypt backups before uploading
5. **Scheduled Backups**: Fully automated backup scheduling
6. **Backup Verification**: Automatic integrity checks
7. **Notification System**: Email alerts for backup status
