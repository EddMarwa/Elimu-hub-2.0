import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, AlignmentType, WidthType } from 'docx';
import { saveAs } from 'file-saver';

// Extend jsPDF with autoTable functionality
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

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

export class ExportService {
  
  /**
   * Export scheme of work to CSV format
   */
  static exportToCSV(scheme: SchemeOfWork): void {
    const headers = [
      'Week',
      'Topic',
      'Specific Objectives',
      'Key Inquiry Questions',
      'Learning Experiences',
      'Core Competencies',
      'Values',
      'Resources',
      'Assessment Methods'
    ];

    const csvContent = [
      // Title rows
      [`${scheme.title}`],
      [`Subject: ${scheme.subject}, Grade: ${scheme.grade}, Term: ${scheme.term}`],
      [`Strand: ${scheme.strand}, Sub-Strand: ${scheme.subStrand}`],
      [`Duration: ${scheme.duration}, Total Weeks: ${scheme.weeks}`],
      [''], // Empty row
      ['General Objectives:'],
      ...scheme.generalObjectives.map((obj: string) => [`• ${obj}`]),
      [''], // Empty row
      headers, // Column headers
      // Weekly data
      ...scheme.weeklyPlans.map((week: WeeklyPlan) => [
        week.week.toString(),
        week.topic,
        week.specificObjectives.join('; '),
        week.keyInquiryQuestions.join('; '),
        week.learningExperiences.join('; '),
        week.coreCompetencies.join(', '),
        week.values.join(', '),
        week.resources.join(', '),
        week.assessmentMethods.join(', ')
      ])
    ];

    // Convert to CSV format
    const csv = csvContent.map(row =>
      row.map((cell: any) => `"${cell?.toString().replace(/"/g, '""') || ''}"`).join(',')
    ).join('\n');

    // Create and download the file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${scheme.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_scheme_of_work.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Export scheme of work to PDF format
   */
  static exportToPDF(scheme: SchemeOfWork): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Helper function to add text with word wrap
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10, isBold: boolean = false): number => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line: string, index: number) => {
        if (y + (index * 6) > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, x, y + (index * 6));
      });
      
      return y + (lines.length * 6);
    };

    // Add header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    yPosition = addWrappedText(scheme.title, margin, yPosition, pageWidth - 2 * margin, 18, true);
    yPosition += 10;

    // Add scheme details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const details = [
      `Subject: ${scheme.subject}`,
      `Grade: ${scheme.grade}`,
      `Term: ${scheme.term}`,
      `Strand: ${scheme.strand}`,
      `Sub-Strand: ${scheme.subStrand}`,
      `Duration: ${scheme.duration}`,
      `Total Weeks: ${scheme.weeks}`
    ];

    details.forEach(detail => {
      yPosition = addWrappedText(detail, margin, yPosition, pageWidth - 2 * margin, 12);
      yPosition += 2;
    });

    yPosition += 10;

    // Add general objectives
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    yPosition = addWrappedText('General Objectives:', margin, yPosition, pageWidth - 2 * margin, 14, true);
    yPosition += 5;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    scheme.generalObjectives.forEach((objective, index) => {
      yPosition = addWrappedText(`${index + 1}. ${objective}`, margin + 5, yPosition, pageWidth - 2 * margin - 5, 11);
      yPosition += 3;
    });

    yPosition += 10;

    // Add weekly plans header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    yPosition = addWrappedText('Weekly Plans:', margin, yPosition, pageWidth - 2 * margin, 14, true);
    yPosition += 10;

    // Add weekly plans
    scheme.weeklyPlans.forEach((week, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = margin;
      }

      // Week header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      yPosition = addWrappedText(`Week ${week.week}: ${week.topic}`, margin, yPosition, pageWidth - 2 * margin, 12, true);
      yPosition += 8;

      // Week details
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const weekDetails = [
        { label: 'Specific Objectives', items: week.specificObjectives },
        { label: 'Key Inquiry Questions', items: week.keyInquiryQuestions },
        { label: 'Learning Experiences', items: week.learningExperiences },
        { label: 'Core Competencies', items: week.coreCompetencies },
        { label: 'Values', items: week.values },
        { label: 'Resources', items: week.resources },
        { label: 'Assessment Methods', items: week.assessmentMethods }
      ];

      weekDetails.forEach(detail => {
        if (detail.items.length > 0) {
          doc.setFont('helvetica', 'bold');
          yPosition = addWrappedText(`${detail.label}:`, margin + 5, yPosition, pageWidth - 2 * margin - 10, 10, true);
          yPosition += 2;
          
          doc.setFont('helvetica', 'normal');
          detail.items.forEach((item, itemIndex) => {
            if (item.trim()) {
              yPosition = addWrappedText(`• ${item}`, margin + 10, yPosition, pageWidth - 2 * margin - 15, 10);
              yPosition += 1;
            }
          });
          yPosition += 3;
        }
      });

      yPosition += 5;
    });

    // Save the PDF
    doc.save(`${scheme.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_scheme_of_work.pdf`);
  }

  /**
   * Export scheme of work to Word format
   */
  static async exportToWord(scheme: SchemeOfWork): Promise<void> {
    const children = [];

    // Title
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: scheme.title,
            bold: true,
            size: 28,
          }),
        ],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Scheme details
    const detailsData = [
      ['Subject:', scheme.subject],
      ['Grade:', scheme.grade],
      ['Term:', scheme.term],
      ['Strand:', scheme.strand],
      ['Sub-Strand:', scheme.subStrand],
      ['Duration:', scheme.duration],
      ['Total Weeks:', scheme.weeks.toString()],
    ];

    children.push(
      new Table({
        rows: detailsData.map(([label, value]) =>
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
                width: { size: 30, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: value })] })],
                width: { size: 70, type: WidthType.PERCENTAGE },
              }),
            ],
          })
        ),
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    );

    children.push(
      new Paragraph({
        children: [],
        spacing: { after: 400 },
      })
    );

    // General Objectives
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'General Objectives',
            bold: true,
            size: 24,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
      })
    );

    scheme.generalObjectives.forEach((objective, index) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}. ${objective}`,
            }),
          ],
          spacing: { after: 100 },
        })
      );
    });

    children.push(
      new Paragraph({
        children: [],
        spacing: { after: 400 },
      })
    );

    // Weekly Plans
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Weekly Plans',
            bold: true,
            size: 24,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
      })
    );

    scheme.weeklyPlans.forEach((week) => {
      // Week header
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Week ${week.week}: ${week.topic}`,
              bold: true,
              size: 20,
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        })
      );

      // Week details table
      const weekData = [
        ['Specific Objectives', week.specificObjectives.join('\n')],
        ['Key Inquiry Questions', week.keyInquiryQuestions.join('\n')],
        ['Learning Experiences', week.learningExperiences.join('\n')],
        ['Core Competencies', week.coreCompetencies.join(', ')],
        ['Values', week.values.join(', ')],
        ['Resources', week.resources.join('\n')],
        ['Assessment Methods', week.assessmentMethods.join('\n')],
      ];

      children.push(
        new Table({
          rows: weekData.map(([label, content]) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: content || 'N/A' })] })],
                  width: { size: 75, type: WidthType.PERCENTAGE },
                }),
              ],
            })
          ),
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );

      children.push(
        new Paragraph({
          children: [],
          spacing: { after: 300 },
        })
      );
    });

    // Create document
    const doc = new Document({
      sections: [
        {
          children,
        },
      ],
    });

    // Generate and save
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${scheme.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_scheme_of_work.docx`);
  }

  /**
   * Export scheme of work in multiple formats
   */
  static async exportMultiple(scheme: SchemeOfWork, formats: string[]): Promise<void> {
    const promises = [];

    if (formats.includes('csv')) {
      promises.push(Promise.resolve(this.exportToCSV(scheme)));
    }

    if (formats.includes('pdf')) {
      promises.push(Promise.resolve(this.exportToPDF(scheme)));
    }

    if (formats.includes('word')) {
      promises.push(this.exportToWord(scheme));
    }

    await Promise.all(promises);
  }
}
