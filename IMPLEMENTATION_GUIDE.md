# KV No.2 School Management System - Implementation Guide

## New Features Implemented

### 1. Password Change Functionality

All users (Students, Teachers, and Admins) can now change their passwords.

**Location**: Profile sections across all dashboards

**Features**:
- Secure password change modal
- Current password verification
- New password confirmation
- Password strength requirements (minimum 6 characters)
- Show/hide password toggle
- Real-time validation

**How to Use**:
1. Navigate to your profile section
2. Click "Change Password" button
3. Enter current password
4. Enter new password (minimum 6 characters)
5. Confirm new password
6. Click "Change Password" to save

**Technical Details**:
- Passwords are stored securely in localStorage
- Default password for new users: "password"
- Admin default password: "admin@123"
- Passwords are validated before update

### 2. Profile Picture Upload

All users can upload or change their profile pictures.

**Methods Available**:
1. **File Upload**: Upload image files (PNG, JPG) up to 5MB
2. **URL Input**: Use direct image URLs from the web

**Features**:
- Live preview before saving
- Image validation
- Responsive circular display
- Easy to update

**How to Use**:
1. Go to profile section
2. Click the camera icon on profile picture
3. Choose upload method:
   - Click "Upload File" to select from your computer
   - Click "Use URL" to paste an image link
4. Preview the image
5. Click "Save Photo" to update

### 3. Data Import Functionality

Administrators can now import backup data to restore the system after data loss.

**Location**: Admin Dashboard > Data Backup > Import tab

**Supported Formats**:
- JSON (recommended)
- CSV (per table)
- XML
- SQL

**Features**:
- Complete system restoration
- Selective table import
- Data validation
- Preview before import
- Conflict resolution
- Backup verification

**How to Use**:
1. Go to Admin Dashboard
2. Click "Data Backup" tab
3. Click "Import Data" button
4. Select backup file
5. Choose tables to import
6. Preview changes
7. Click "Import" to restore data

**What Gets Imported**:
- All users (students, teachers, admins)
- Classes and sections
- Assignments and submissions
- Attendance records
- Timetables
- Exam schedules
- System settings

### 4. Google Drive Integration (Real Credentials)

The system now uses actual Google Drive Service Account for cloud backups.

**Service Account Details**:
- Project: grand-brand-473114-c2
- Email: schoolmanagementsystem@grand-brand-473114-c2.iam.gserviceaccount.com
- Type: Service Account

**Features**:
- Automatic daily backups
- Manual backup on-demand
- 30-day retention policy
- Encrypted transmission
- Easy restoration
- Multi-format support

**How to Connect**:
1. Go to Admin Dashboard > Data Backup > Google Drive tab
2. Click "Setup Google Drive"
3. Credentials are pre-configured (automatic)
4. Click "Connect"
5. System will authenticate automatically

**Auto-Backup Schedule**:
- Daily backups at midnight
- Weekly full backups on Sunday
- Monthly archives on 1st of month
- 30-day retention for daily backups
- 90-day retention for weekly backups
- 1-year retention for monthly backups

## Security Features

### Password Management
- Secure storage with encryption
- No plain-text passwords
- Password history (prevents reuse of last 5 passwords)
- Minimum complexity requirements
- Force password change on first login

### Data Protection
- All exports are checksummed
- Backup integrity verification
- Encrypted cloud transmission
- Secure local storage
- Audit trail for all changes

### Access Control
- Role-based permissions
- Session management
- Automatic logout on inactivity
- Login attempt monitoring

## Emergency Recovery Procedures

### If System Data Is Lost

1. **Immediate Actions**:
   - Do not panic
   - Do not make any changes to the system
   - Locate your most recent backup

2. **Recovery Process**:
   ```
   Step 1: Access Admin Dashboard
   Step 2: Go to Data Backup section
   Step 3: Click "Import Data"
   Step 4: Select your backup file
   Step 5: Choose all tables for complete restoration
   Step 6: Review preview
   Step 7: Click "Import"
   Step 8: Verify data after import
   ```

3. **Verification Checklist**:
   - [ ] All users can log in
   - [ ] Student records are accurate
   - [ ] Teacher assignments are correct
   - [ ] Attendance history is complete
   - [ ] Timetables are displaying
   - [ ] Exam schedules are intact

### Backup Best Practices

1. **Multiple Backups**:
   - Keep local backups on external drive
   - Enable Google Drive auto-backup
   - Export data monthly to archive

2. **Testing**:
   - Test restore procedure quarterly
   - Verify backup integrity monthly
   - Keep backup documentation updated

3. **Storage**:
   - Store backups in multiple locations
   - Keep at least 3 recent backups
   - Archive important milestones

## User Management

### Creating New Accounts

**Students**:
- Admin or Class Teacher can create
- Automatic ID generation
- Default password: "password"
- Email format: name@kv2.in

**Teachers**:
- Only Admin can create
- Can assign class and subject
- Default password: "password"
- Automatic class assignment

**Password Distribution**:
1. Create account with temporary password
2. Share credentials securely with user
3. User must change password on first login
4. Document password change in audit log

### Profile Management

All users can:
- Update profile information
- Change profile picture
- Change password
- View account activity

Students can update:
- Profile picture
- Password
- Parent contact info

Teachers can update:
- Profile picture
- Password
- Subject information

Admins can update:
- All user information
- System settings
- School details

## Technical Specifications

### Data Storage

**LocalStorage Keys**:
- `kv2_users`: All user accounts
- `kv2_passwords`: Encrypted passwords
- `kv2_classes`: Class information
- `kv2_assignments`: Assignments and submissions
- `kv2_attendance`: Attendance records
- `kv2_timetables`: Class timetables
- `kv2_exam_timetables`: Exam schedules
- `kv2_system_settings`: School settings
- `kv2_backups`: Backup metadata
- `gdrive_config`: Google Drive configuration
- `gdrive_token`: Authentication token

### File Structure

```
src/
├── components/
│   ├── shared/
│   │   ├── PasswordChangeModal.tsx    (NEW)
│   │   └── ProfilePictureUpload.tsx   (NEW)
│   ├── student/
│   │   └── StudentProfile.tsx         (UPDATED)
│   ├── admin/
│   │   ├── BackupManagement.tsx       (UPDATED)
│   │   └── SystemSettings.tsx
│   └── ...
├── context/
│   └── AuthContext.tsx                (UPDATED)
├── services/
│   ├── backupService.ts               (UPDATED)
│   └── settingsService.ts
├── utils/
│   ├── googleDriveUtils.ts            (UPDATED)
│   └── exportUtils.ts
└── types/
    ├── index.ts
    ├── backup.ts
    └── settings.ts
```

### API Integration (Google Drive)

**Endpoints Used**:
- OAuth 2.0 Authentication
- Drive API v3
- Files: create, list, get, delete
- Permissions management

**Scopes Required**:
- `https://www.googleapis.com/auth/drive.file`
- `https://www.googleapis.com/auth/drive.appdata`

## Troubleshooting

### Password Issues

**Problem**: User forgot password
**Solution**: Admin can reset password to "password", user must change on next login

**Problem**: Password change fails
**Solution**:
1. Verify current password is correct
2. Check new password meets requirements
3. Clear browser cache and try again

### Import Issues

**Problem**: Import fails with error
**Solution**:
1. Verify backup file format is correct
2. Check file is not corrupted
3. Ensure all required fields are present
4. Try importing tables individually

**Problem**: Duplicate data after import
**Solution**:
1. System automatically handles duplicates by ID
2. Manually remove duplicates if needed
3. Re-import with clean backup

### Google Drive Issues

**Problem**: Cannot connect to Google Drive
**Solution**:
1. Check internet connection
2. Verify service account credentials
3. Check Google API quotas
4. Try reconnecting after 5 minutes

**Problem**: Backup upload fails
**Solution**:
1. Check file size (must be under 100MB)
2. Verify Drive storage space available
3. Check network stability
4. Retry backup operation

## Support and Maintenance

### Regular Maintenance Tasks

**Daily**:
- Monitor system performance
- Check auto-backup status
- Review error logs

**Weekly**:
- Verify backup integrity
- Test restore procedure
- Update system documentation

**Monthly**:
- Archive important data
- Review user accounts
- Update security settings
- System performance review

### Contact Information

**System Administrators**:
- Anshaj Pandey
- Zaid Huda
- Aayush Rai

**Emergency Support**:
- Check documentation first
- Review error messages
- Contact system administrator
- Keep backup files ready

## Future Enhancements

### Planned Features

1. **Advanced Security**:
   - Two-factor authentication
   - Biometric login support
   - Session recording
   - Advanced audit trails

2. **Data Management**:
   - Real-time cloud sync
   - Automated conflict resolution
   - Version history
   - Data archival automation

3. **User Experience**:
   - Mobile app support
   - Push notifications
   - Real-time collaboration
   - Advanced analytics

4. **Integration**:
   - SMS notifications
   - Email integration
   - Payment gateway
   - Third-party app connections

## Conclusion

The KV No.2 School Management System now includes comprehensive data protection, user management, and recovery features. All users can manage their accounts securely, and administrators have full control over data backup and restoration.

For additional support or questions, refer to this documentation or contact the system administrators.

**Version**: 2.0
**Last Updated**: November 2025
**Status**: Production Ready
