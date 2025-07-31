import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Description as WordIcon,
  TableView as ExcelIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { ExportService } from '../../utils/exportService';

interface WeeklyPlan {
  week: number;
  topic: string;
  specificObjectives: string[];
  keyInquiryQuestions: string[];
  learningExperiences: string[];
  coreCompetencies: string[];
  values: string[];
  resources: string[];
  assessmentMethods: string[];
}

interface SchemeOfWork {
  title: string;
  subject: string;
  grade: string;
  term: string;
  strand: string;
  subStrand: string;
  duration: string;
  weeks: number;
  generalObjectives: string[];
  weeklyPlans: WeeklyPlan[];
}

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  scheme: SchemeOfWork | null;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ open, onClose, scheme }) => {
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['csv']);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ [key: string]: boolean }>({});

  const exportOptions = [
    {
      id: 'csv',
      label: 'Excel/CSV Format',
      description: 'Compatible with Microsoft Excel and Google Sheets',
      icon: <ExcelIcon sx={{ color: '#388e3c' }} />,
      recommended: true,
    },
    {
      id: 'pdf',
      label: 'PDF Document',
      description: 'Professional document ready for printing and sharing',
      icon: <PdfIcon sx={{ color: '#d32f2f' }} />,
      recommended: true,
    },
    {
      id: 'word',
      label: 'Word Document',
      description: 'Editable Microsoft Word format (.docx)',
      icon: <WordIcon sx={{ color: '#1976d2' }} />,
      recommended: false,
    },
  ];

  const handleFormatToggle = (formatId: string) => {
    setSelectedFormats(prev => {
      if (prev.includes(formatId)) {
        return prev.filter(id => id !== formatId);
      } else {
        return [...prev, formatId];
      }
    });
  };

  const handleExport = async () => {
    if (!scheme || selectedFormats.length === 0) {
      toast.error('Please select at least one export format');
      return;
    }

    setExporting(true);
    setExportProgress({});

    try {
      // Export each format sequentially to avoid overwhelming the browser
      for (const format of selectedFormats) {
        setExportProgress(prev => ({ ...prev, [format]: false }));
        
        try {
          switch (format) {
            case 'csv':
              ExportService.exportToCSV(scheme);
              break;
            case 'pdf':
              ExportService.exportToPDF(scheme);
              break;
            case 'word':
              await ExportService.exportToWord(scheme);
              break;
          }
          
          setExportProgress(prev => ({ ...prev, [format]: true }));
          
          // Small delay between exports
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error exporting ${format}:`, error);
          toast.error(`Failed to export ${format.toUpperCase()} format`);
        }
      }

      const successCount = Object.values(exportProgress).filter(Boolean).length;
      if (successCount > 0) {
        toast.success(`Successfully exported in ${successCount} format${successCount > 1 ? 's' : ''}!`);
      }
      
      // Close dialog after successful export
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export scheme of work');
    } finally {
      setExporting(false);
    }
  };

  const handleSelectAll = () => {
    setSelectedFormats(exportOptions.map(option => option.id));
  };

  const handleClearAll = () => {
    setSelectedFormats([]);
  };

  const isValidScheme = scheme && scheme.title && scheme.weeklyPlans && scheme.weeklyPlans.length > 0;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DownloadIcon />
          <Typography variant="h6">Export Scheme of Work</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {!isValidScheme ? (
          <Alert severity="warning">
            Please generate a complete scheme of work before exporting.
          </Alert>
        ) : (
          <>
            {/* Scheme Summary */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {scheme.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {scheme.subject} • {scheme.grade} • {scheme.term}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {scheme.weeks} weeks • {scheme.weeklyPlans.length} weekly plans
                </Typography>
              </CardContent>
            </Card>

            {/* Export Options */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Export Formats</Typography>
                <Box>
                  <Button size="small" onClick={handleSelectAll} sx={{ mr: 1 }}>
                    Select All
                  </Button>
                  <Button size="small" onClick={handleClearAll}>
                    Clear All
                  </Button>
                </Box>
              </Box>

              <List>
                {exportOptions.map((option) => (
                  <ListItem key={option.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                    <ListItemIcon>
                      {option.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {option.label}
                          </Typography>
                          {option.recommended && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                bgcolor: 'primary.main', 
                                color: 'white', 
                                px: 1, 
                                py: 0.25, 
                                borderRadius: 0.5 
                              }}
                            >
                              Recommended
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={option.description}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedFormats.includes(option.id)}
                          onChange={() => handleFormatToggle(option.id)}
                          disabled={exporting}
                        />
                      }
                      label=""
                      sx={{ m: 0 }}
                    />
                    {exporting && selectedFormats.includes(option.id) && (
                      <Box sx={{ ml: 1 }}>
                        {exportProgress[option.id] ? (
                          <CheckIcon color="success" />
                        ) : (
                          <LinearProgress 
                            sx={{ width: 20, height: 2 }} 
                          />
                        )}
                      </Box>
                    )}
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* Export Progress */}
            {exporting && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Exporting files...
                </Typography>
                <LinearProgress />
              </Box>
            )}

            {/* Usage Tips */}
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2" component="div">
                <strong>Export Tips:</strong>
                <Box component="ul" sx={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <Box component="li">CSV files can be opened in Excel for editing and formatting</Box>
                  <Box component="li">PDF files are perfect for official documentation and printing</Box>
                  <Box component="li">Word files allow further customization and editing</Box>
                </Box>
              </Typography>
            </Alert>
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={exporting}>
          {exporting ? 'Exporting...' : 'Cancel'}
        </Button>
        <Button 
          onClick={handleExport} 
          variant="contained"
          disabled={!isValidScheme || selectedFormats.length === 0 || exporting}
          startIcon={<DownloadIcon />}
        >
          {exporting ? 'Exporting...' : `Export ${selectedFormats.length} Format${selectedFormats.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;
