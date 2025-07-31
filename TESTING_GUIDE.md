# Testing the New Template Management and Export Features

## Prerequisites

1. Ensure all dependencies are installed:
```bash
cd client
npm install jspdf jspdf-autotable docx @types/file-saver --legacy-peer-deps
```

2. Make sure the backend server is running with the updated schema:
```bash
cd server
npx prisma generate
npm run dev
```

## Testing the Template Manager

1. **Navigate to Scheme of Work Generator**
   - Go to the main application
   - Navigate to "Scheme of Work Generator"

2. **Open Template Manager**
   - Look for the "Template Management" section
   - Click "Manage Templates" button
   - This opens the comprehensive template management dialog

3. **Upload a Template**
   - Click "Choose File" in the upload section
   - Select a sample scheme of work file (PDF, Word, Excel, CSV, or text)
   - Optionally set subject and grade metadata
   - Click "Upload" to save the template

4. **Browse and Filter Templates**
   - Use the search bar to find templates by filename
   - Filter by subject or grade using the dropdown menus
   - View template details including file size and upload date

5. **Select a Template**
   - Click on any template in the list to select it
   - Notice the visual feedback showing the selected template
   - The selected template will guide AI generation

## Testing the Export Features

1. **Generate a Scheme of Work**
   - Fill in basic information (subject, grade, term, strand)
   - Select a template if desired
   - Click "Generate with AI" to create a scheme
   - Wait for the AI to generate the complete scheme

2. **Open Export Dialog**
   - After generation, click "Export Scheme" button
   - This opens the advanced export dialog

3. **Select Export Formats**
   - Choose one or more export formats:
     - CSV/Excel: For spreadsheet editing
     - PDF: For professional documents
     - Word: For further editing
   - Notice the format descriptions and recommendations

4. **Export the Scheme**
   - Click "Export" button
   - Watch the progress indicators for each format
   - Files will automatically download to your device

## Testing Template-Driven AI Generation

1. **Without Template**
   - Generate a scheme without selecting a template
   - Notice the default AI formatting

2. **With Template**
   - Select a template using the Template Manager
   - Generate a new scheme
   - Compare the output format to see how the template influences the AI

## Verifying Export Quality

1. **CSV Export**
   - Open the downloaded CSV file in Excel or Google Sheets
   - Verify all scheme data is properly formatted in columns
   - Check that special characters are properly escaped

2. **PDF Export**
   - Open the PDF file
   - Verify professional formatting with proper headers
   - Check that weekly plans are clearly organized
   - Ensure the document is print-ready

3. **Word Export**
   - Open the DOCX file in Microsoft Word
   - Verify tables are properly formatted
   - Check that the document is editable
   - Ensure proper heading hierarchy

## Template Management Features to Test

1. **File Type Support**
   - Test uploading different file types (PDF, Word, Excel, CSV, text)
   - Verify appropriate file icons are displayed
   - Confirm file type validation works

2. **Search and Filter**
   - Upload multiple templates with different subjects/grades
   - Test the search functionality with various keywords
   - Use the filter dropdowns to narrow down results

3. **Template Deletion**
   - Try deleting a template
   - Confirm the deletion confirmation dialog appears
   - Verify the template is removed from the list

4. **Metadata Management**
   - Upload templates with and without metadata
   - Verify metadata is displayed correctly
   - Test filtering by metadata fields

## Error Scenarios to Test

1. **Invalid File Upload**
   - Try uploading an unsupported file type
   - Verify error message appears
   - Test file size limits (try uploading a file > 10MB)

2. **Export Without Scheme**
   - Try opening export dialog without generating a scheme
   - Verify appropriate warning message

3. **Network Errors**
   - Test behavior when backend is unavailable
   - Verify error handling and user feedback

## Expected Outcomes

✅ **Template Manager should:**
- Open in a modal dialog
- Display uploaded templates with proper icons
- Allow searching and filtering
- Enable template selection and deletion
- Provide upload feedback and validation

✅ **Export Dialog should:**
- Show scheme summary
- Allow multiple format selection
- Provide export progress feedback
- Download files in selected formats
- Display usage tips and recommendations

✅ **Generated Files should:**
- CSV: Open correctly in spreadsheet applications
- PDF: Display professionally formatted content
- Word: Be editable with proper table structure

✅ **Template-Driven AI should:**
- Generate schemes following template structure when template is selected
- Use default format when no template is selected
- Include template-specific formatting cues

## Troubleshooting

If you encounter issues:

1. **Compilation Errors**: Ensure all dependencies are installed with `--legacy-peer-deps` flag
2. **File Upload Issues**: Check backend file upload configuration and disk space
3. **Export Failures**: Verify browser allows downloads and check console for errors
4. **Template Not Loading**: Ensure backend API endpoints are accessible

The system should now provide a comprehensive, professional solution for scheme of work template management and multi-format export capabilities.
