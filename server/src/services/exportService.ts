import fs from 'fs';
import path from 'path';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx';
import puppeteer from 'puppeteer';
import { logger } from '../utils/logger';
import { SchemeOfWork } from '../types';

export interface ExportOptions {
  format: 'docx' | 'pdf';
  includeHeader?: boolean;
  includeLogo?: boolean;
  customStyles?: any;
}

export class ExportService {
  private static instance: ExportService;
  private outputDir: string;

  private constructor() {
    this.outputDir = path.join(process.cwd(), 'backend', 'outputs');
    this.ensureOutputDirectory();
  }

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      logger.info(`Created output directory: ${this.outputDir}`);
    }
  }



  async exportSchemeOfWork(scheme: SchemeOfWork, options: ExportOptions): Promise<string> {
    try {
      if (options.format === 'docx') {
        return await this.exportSchemeOfWorkToDOCX(scheme, options);
      } else {
        return await this.exportSchemeOfWorkToPDF(scheme, options);
      }
    } catch (error) {
      logger.error('Error exporting scheme of work:', error);
      throw error;
    }
  }



  private async exportSchemeOfWorkToDOCX(scheme: SchemeOfWork, options: ExportOptions): Promise<string> {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Header
          new Paragraph({
            children: [
              new TextRun({
                text: "ElimuHub 2.0 | CBC Compliant",
                bold: true,
                size: 24,
                color: "0A8754"
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),

          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: `SCHEME OF WORK - ${scheme.title}`,
                bold: true,
                size: 32,
                color: "0A8754"
              })
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
          }),

          // Basic Information
          new Paragraph({
            children: [
              new TextRun({ text: "Subject: ", bold: true }),
              new TextRun({ text: scheme.subject }),
              new TextRun({ text: " | Grade: ", bold: true }),
              new TextRun({ text: scheme.grade }),
              new TextRun({ text: " | Term: ", bold: true }),
              new TextRun({ text: scheme.term.toString() })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
          }),

          // Weekly Plans Table
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE
            },
            rows: [
              // Header row
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Week", bold: true })] })],
                    shading: { fill: "0A8754" }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Topic", bold: true })] })],
                    shading: { fill: "0A8754" }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Learning Outcomes", bold: true })] })],
                    shading: { fill: "0A8754" }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Activities", bold: true })] })],
                    shading: { fill: "0A8754" }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Resources", bold: true })] })],
                    shading: { fill: "0A8754" }
                  })
                ]
              }),
              // Data rows
              ...scheme.weeks.map(week => 
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: week.week.toString() })] })]
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: week.topic })] })]
                    }),
                    new TableCell({
                      children: week.learningOutcomes.map(outcome => 
                        new Paragraph({ children: [new TextRun({ text: `• ${outcome}` })] })
                      )
                    }),
                    new TableCell({
                      children: week.learningExperiences.map(activity => 
                        new Paragraph({ children: [new TextRun({ text: `• ${activity}` })] })
                      )
                    }),
                    new TableCell({
                      children: week.resources.map(resource => 
                        new Paragraph({ children: [new TextRun({ text: `• ${resource}` })] })
                      )
                    })
                  ]
                })
              )
            ]
          }),

          // Footer
          new Paragraph({
            children: [
              new TextRun({
                text: "Generated via ElimuHub 2.0 | CBC Compliant",
                italics: true,
                size: 18,
                color: "0A8754"
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400 }
          })
        ]
      }]
    });

    const filename = `scheme_of_work_${scheme.id}_${Date.now()}.docx`;
    const filepath = path.join(this.outputDir, filename);

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filepath, buffer);

    logger.info(`Scheme of work exported to DOCX: ${filepath}`);
    return filepath;
  }



  private async exportSchemeOfWorkToPDF(scheme: SchemeOfWork, options: ExportOptions): Promise<string> {
    const html = this.generateSchemeOfWorkHTML(scheme);
    return await this.convertHTMLToPDF(html, `scheme_of_work_${scheme.id}_${Date.now()}.pdf`);
  }

  private generateSchemeOfWorkHTML(scheme: SchemeOfWork): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Scheme of Work - ${scheme.title}</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; margin: 20px; color: #2E7D32; }
          .header { text-align: center; color: #0A8754; font-size: 18px; font-weight: bold; margin-bottom: 30px; }
          .title { text-align: center; color: #0A8754; font-size: 28px; font-weight: bold; margin-bottom: 20px; }
          .info { text-align: center; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #0A8754; color: white; padding: 10px; text-align: left; }
          td { padding: 8px; border: 1px solid #ddd; vertical-align: top; }
          tr:nth-child(even) { background: #f9f9f9; }
          .footer { text-align: center; font-style: italic; color: #0A8754; margin-top: 40px; }
        </style>
      </head>
      <body>
        <div class="header">ElimuHub 2.0 | CBC Compliant</div>
        <div class="title">SCHEME OF WORK - ${scheme.title}</div>
        <div class="info">
          <strong>Subject:</strong> ${scheme.subject} | 
          <strong>Grade:</strong> ${scheme.grade} | 
          <strong>Term:</strong> ${scheme.term}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Week</th>
              <th>Topic</th>
              <th>Learning Outcomes</th>
              <th>Activities</th>
              <th>Resources</th>
            </tr>
          </thead>
          <tbody>
            ${scheme.weeks.map(week => `
              <tr>
                <td>${week.week}</td>
                <td>${week.topic}</td>
                <td>
                  <ul>
                    ${week.learningOutcomes.map(outcome => `<li>${outcome}</li>`).join('')}
                  </ul>
                </td>
                <td>
                  <ul>
                    ${week.learningExperiences.map(activity => `<li>${activity}</li>`).join('')}
                  </ul>
                </td>
                <td>
                  <ul>
                    ${week.resources.map(resource => `<li>${resource}</li>`).join('')}
                  </ul>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">Generated via ElimuHub 2.0 | CBC Compliant</div>
      </body>
      </html>
    `;
  }

  private async convertHTMLToPDF(html: string, filename: string): Promise<string> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const filepath = path.join(this.outputDir, filename);
    await page.pdf({
      path: filepath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    await browser.close();
    
    logger.info(`Document exported to PDF: ${filepath}`);
    return filepath;
  }
}

export default ExportService;