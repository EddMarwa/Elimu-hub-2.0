# Schemes of Work File Management System

## Overview

The Schemes of Work File Management System allows administrators to upload scheme files and teachers to download them. This system provides a centralized repository for curriculum materials with role-based access control.

## Features

### 🎯 **Admin Features**
- **File Upload**: Upload scheme files with metadata (title, subject, grade, term, etc.)
- **File Management**: Edit, delete, and manage uploaded files
- **Access Control**: Set files as public or private
- **Statistics**: View upload statistics and download analytics
- **Bulk Operations**: Manage multiple files efficiently

### 📚 **Teacher Features**
- **File Download**: Download scheme files uploaded by administrators
- **Search & Filter**: Find files by subject, grade, term, or keywords
- **File Preview**: View file details before downloading
- **Download History**: Track downloaded files

## Database Schema

### SchemeOfWorkFile Model
```prisma
model SchemeOfWorkFile {
  id           String   @id @default(cuid())
  title        String
  description  String?
  subject      String
  grade        String
  term         String
  strand       String?
  subStrand    String?
  fileName     String
  originalName String
  filePath     String
  fileSize     Int
  mimeType     String
  downloads    Int      @default(0)
  isPublic     Boolean  @default(true)
  uploadedBy   String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  user User @relation(fields: [uploadedBy], references: [id])

  @@map("scheme_of_work_files")
}
```

## API Endpoints

### File Management
- `GET /api/scheme-files` - Get all scheme files (with filtering)
- `GET /api/scheme-files/:id` - Get specific scheme file
- `POST /api/scheme-files/upload` - Upload new scheme file (Admin only)
- `PUT /api/scheme-files/:id` - Update scheme file (Admin only)
- `DELETE /api/scheme-files/:id` - Delete scheme file (Admin only)

### File Download
- `GET /api/scheme-files/:id/download` - Download scheme file

### Statistics
- `GET /api/scheme-files/stats/overview` - Get upload statistics (Admin only)

## Frontend Components

### 1. **SchemesOfWorkDashboard** (`client/src/components/Dashboard/SchemesOfWorkDashboard.tsx`)
- **Purpose**: Main dashboard for scheme file management
- **Features**:
  - File upload dialog for admins
  - File listing with search and filters
  - Download functionality
  - Statistics display
  - Role-based UI

### 2. **Dashboard Integration** (`client/src/pages/Dashboard/Dashboard.tsx`)
- **Purpose**: Integrated schemes section in main dashboard
- **Features**:
  - Quick access to scheme files
  - Role-based actions
  - Statistics overview

## File Upload Process

### Admin Upload Flow
1. **Access Upload Dialog**: Click "Upload Scheme" button
2. **Select File**: Choose PDF, Word, Excel, or Text file
3. **Fill Metadata**:
   - Title (required)
   - Subject (required)
   - Grade (required)
   - Term (required)
   - Strand (optional)
   - Sub-Strand (optional)
   - Description (optional)
4. **Set Visibility**: Public or Private
5. **Upload**: File is uploaded and stored

### File Validation
- **File Types**: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), Text (.txt)
- **File Size**: Maximum 50MB
- **Required Fields**: Title, Subject, Grade, Term

## Download Process

### Teacher Download Flow
1. **Browse Files**: View available scheme files
2. **Search/Filter**: Find specific files by criteria
3. **Preview**: View file details and metadata
4. **Download**: Click download button
5. **File Saved**: File downloads to local device

## Security Features

### Role-Based Access Control
- **Admins**: Full access to upload, edit, delete, and view statistics
- **Teachers**: Read-only access to public files and download functionality

### File Security
- **File Storage**: Files stored securely on server
- **Access Control**: Private files only accessible to uploader
- **Download Tracking**: All downloads logged and tracked

## Usage Examples

### Admin Uploading a Scheme File
```typescript
// Upload a new scheme file
const uploadSchemeFile = async (file: File, metadata: {
  title: string;
  subject: string;
  grade: string;
  term: string;
  description?: string;
  isPublic: boolean;
}) => {
  try {
    const response = await schemeFilesAPI.upload(file, metadata);
    console.log('File uploaded successfully:', response.data);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Teacher Downloading a Scheme File
```typescript
// Download a scheme file
const downloadSchemeFile = async (fileId: string, fileName: string) => {
  try {
    const response = await schemeFilesAPI.download(fileId);
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
  }
};
```

### Getting Scheme Files with Filters
```typescript
// Get scheme files with filters
const getSchemeFiles = async (filters: {
  subject?: string;
  grade?: string;
  term?: string;
  search?: string;
  sortBy?: string;
}) => {
  try {
    const response = await schemeFilesAPI.getAll(filters);
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch files:', error);
    return [];
  }
};
```

## File Organization

### Directory Structure
```
uploads/
└── scheme-files/
    ├── 1703123456789-mathematics_grade1_term1.pdf
    ├── 1703123456790-english_grade2_term2.docx
    └── 1703123456791-science_grade3_term3.xlsx
```

### File Naming Convention
- **Format**: `{timestamp}-{original_filename}`
- **Example**: `1703123456789-mathematics_grade1_term1.pdf`

## Statistics and Analytics

### Admin Statistics
- **Total Files**: Number of uploaded files
- **Total Downloads**: Cumulative download count
- **Recent Uploads**: Latest uploaded files
- **Top Subjects**: Most uploaded subjects
- **Download Trends**: Popular files and subjects

### Teacher Analytics
- **Download History**: Previously downloaded files
- **Popular Files**: Most downloaded schemes
- **Subject Distribution**: Available files by subject

## Error Handling

### Common Errors
1. **File Too Large**: Maximum 50MB limit
2. **Invalid File Type**: Only allowed file types accepted
3. **Missing Metadata**: Required fields must be filled
4. **Permission Denied**: Insufficient role permissions
5. **File Not Found**: File doesn't exist or is private

### Error Responses
```json
{
  "success": false,
  "message": "Error description",
  "details": "Additional error information"
}
```

## Best Practices

### For Administrators
1. **Organize Files**: Use clear, descriptive titles
2. **Add Descriptions**: Provide context for each file
3. **Set Appropriate Visibility**: Make files public unless sensitive
4. **Regular Updates**: Keep files current and relevant
5. **Monitor Usage**: Track download statistics

### For Teachers
1. **Search Effectively**: Use filters to find relevant files
2. **Check File Details**: Review metadata before downloading
3. **Organize Downloads**: Create local folder structure
4. **Provide Feedback**: Report issues or request new content

## Future Enhancements

### Planned Features
1. **File Versioning**: Track file updates and versions
2. **Bulk Download**: Download multiple files at once
3. **File Preview**: Preview files before downloading
4. **Comments/Ratings**: Teacher feedback on files
5. **Advanced Search**: Full-text search within files
6. **File Categories**: Organize files by categories
7. **Export Statistics**: Download usage reports
8. **Mobile Support**: Mobile-optimized interface

### Technical Improvements
1. **File Compression**: Reduce storage and bandwidth usage
2. **CDN Integration**: Faster file delivery
3. **Caching**: Improve performance with caching
4. **Backup System**: Automated file backups
5. **API Rate Limiting**: Prevent abuse

## Troubleshooting

### Common Issues
1. **Upload Fails**: Check file size and type
2. **Download Fails**: Verify file exists and permissions
3. **Search Not Working**: Clear filters and try again
4. **Permission Errors**: Check user role and file visibility

### Support
- **Technical Issues**: Contact system administrator
- **Content Questions**: Contact curriculum coordinator
- **Feature Requests**: Submit through feedback system

## Conclusion

The Schemes of Work File Management System provides a robust, secure, and user-friendly platform for managing curriculum materials. With role-based access control, comprehensive search capabilities, and detailed analytics, it serves both administrators and teachers effectively.

The system is designed to be scalable, maintainable, and extensible for future enhancements while maintaining security and performance standards.
