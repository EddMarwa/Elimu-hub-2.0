import fs from 'fs';
import path from 'path';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx';
import puppeteer from 'puppeteer';
import { logger } from '../utils/logger';
import { LessonPlan, SchemeOfWork } from '../types';

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

  async exportLessonPlan(lessonPlan: LessonPlan, options: ExportOptions): Promise<string> {
    try {
      if (options.format === 'docx') {
        return await this.exportLessonPlanToDOCX(lessonPlan, options);
      } else {
        return await this.exportLessonPlanToPDF(lessonPlan, options);
      }
    } catch (error) {
      logger.error('Error exporting lesson plan:', error);
      throw error;
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

  private async exportLessonPlanToDOCX(lessonPlan: LessonPlan, options: ExportOptions): Promise<string> {
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
                text: lessonPlan.title,
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
              new TextRun({
                text: "LESSON DETAILS",
                bold: true,
                size: 20,
                color: "FFD700"
              })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "Subject: ", bold: true }),
              new TextRun({ text: lessonPlan.subject })
            ],
            spacing: { after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "Grade: ", bold: true }),
              new TextRun({ text: lessonPlan.grade })
            ],
            spacing: { after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "Duration: ", bold: true }),
              new TextRun({ text: `${lessonPlan.duration} minutes` })
            ],
            spacing: { after: 200 }
          }),

          // Learning Outcomes
          new Paragraph({
            children: [
              new TextRun({
                text: "LEARNING OUTCOMES",
                bold: true,
                size: 20,
                color: "FFD700"
              })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 }
          }),

          ...lessonPlan.learningOutcomes.map(outcome => 
            new Paragraph({
              children: [
                new TextRun({ text: "• " }),
                new TextRun({ text: outcome })
              ],
              spacing: { after: 100 }
            })
          ),

          // Core Competencies
          new Paragraph({
            children: [
              new TextRun({
                text: "CORE COMPETENCIES",
                bold: true,
                size: 20,
                color: "FFD700"
              })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 }
          }),

          ...lessonPlan.coreCompetencies.map(competency => 
            new Paragraph({
              children: [
                new TextRun({ text: "• " }),
                new TextRun({ text: competency })
              ],
              spacing: { after: 100 }
            })
          ),

          // Values
          new Paragraph({
            children: [
              new TextRun({
                text: "VALUES",
                bold: true,
                size: 20,
                color: "FFD700"
              })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 }
          }),

          ...lessonPlan.values.map(value => 
            new Paragraph({
              children: [
                new TextRun({ text: "• " }),
                new TextRun({ text: value })
              ],
              spacing: { after: 100 }
            })
          ),

          // Key Inquiry Questions
          new Paragraph({
            children: [
              new TextRun({
                text: "KEY INQUIRY QUESTIONS",
                bold: true,
                size: 20,
                color: "FFD700"
              })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 }
          }),

          ...lessonPlan.keyInquiryQuestions.map(question => 
            new Paragraph({
              children: [
                new TextRun({ text: "• " }),
                new TextRun({ text: question })
              ],
              spacing: { after: 100 }
            })
          ),

          // Learning Experiences
          new Paragraph({
            children: [
              new TextRun({
                text: "LEARNING EXPERIENCES",
                bold: true,
                size: 20,
                color: "FFD700"
              })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 }
          }),

          ...lessonPlan.learningExperiences.flatMap(experience => [
            new Paragraph({
              children: [
                new TextRun({ text: "Activity: ", bold: true }),
                new TextRun({ text: experience.activity })
              ],
              spacing: { after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Duration: ", bold: true }),
                new TextRun({ text: `${experience.duration} minutes` })
              ],
              spacing: { after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Methodology: ", bold: true }),
                new TextRun({ text: experience.methodology })
              ],
              spacing: { after: 200 }
            })
          ]),

          // Resources
          new Paragraph({
            children: [
              new TextRun({
                text: "RESOURCES",
                bold: true,
                size: 20,
                color: "FFD700"
              })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 }
          }),

          ...lessonPlan.resources.map(resource => 
            new Paragraph({
              children: [
                new TextRun({ text: "• " }),
                new TextRun({ text: resource })
              ],
              spacing: { after: 100 }
            })
          ),

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

    const filename = `lesson_plan_${lessonPlan.id}_${Date.now()}.docx`;
    const filepath = path.join(this.outputDir, filename);

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filepath, buffer);

    logger.info(`Lesson plan exported to DOCX: ${filepath}`);
    return filepath;
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

  private async exportLessonPlanToPDF(lessonPlan: LessonPlan, options: ExportOptions): Promise<string> {
    const html = this.generateLessonPlanHTML(lessonPlan);
    return await this.convertHTMLToPDF(html, `lesson_plan_${lessonPlan.id}_${Date.now()}.pdf`);
  }

  private async exportSchemeOfWorkToPDF(scheme: SchemeOfWork, options: ExportOptions): Promise<string> {
    const html = this.generateSchemeOfWorkHTML(scheme);
    return await this.convertHTMLToPDF(html, `scheme_of_work_${scheme.id}_${Date.now()}.pdf`);
  }

  private generateLessonPlanHTML(lessonPlan: LessonPlan): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${lessonPlan.title}</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; margin: 40px; color: #2E7D32; }
          .header { text-align: center; color: #0A8754; font-size: 18px; font-weight: bold; margin-bottom: 30px; }
          .title { text-align: center; color: #0A8754; font-size: 28px; font-weight: bold; margin-bottom: 20px; }
          .section-title { color: #FFD700; background: #0A8754; padding: 8px; font-weight: bold; font-size: 16px; margin: 20px 0 10px 0; }
          .detail { margin: 5px 0; }
          .detail strong { color: #0A8754; }
          ul { margin: 10px 0; padding-left: 20px; }
          li { margin: 5px 0; }
          .footer { text-align: center; font-style: italic; color: #0A8754; margin-top: 40px; }
        </style>
      </head>
      <body>
        <div class="header">ElimuHub 2.0 | CBC Compliant</div>
        <div class="title">${lessonPlan.title}</div>
        
        <div class="section-title">LESSON DETAILS</div>
        <div class="detail"><strong>Subject:</strong> ${lessonPlan.subject}</div>
        <div class="detail"><strong>Grade:</strong> ${lessonPlan.grade}</div>
        <div class="detail"><strong>Duration:</strong> ${lessonPlan.duration} minutes</div>
        
        <div class="section-title">LEARNING OUTCOMES</div>
        <ul>
          ${lessonPlan.learningOutcomes.map(outcome => `<li>${outcome}</li>`).join('')}
        </ul>
        
        <div class="section-title">CORE COMPETENCIES</div>
        <ul>
          ${lessonPlan.coreCompetencies.map(competency => `<li>${competency}</li>`).join('')}
        </ul>
        
        <div class="section-title">VALUES</div>
        <ul>
          ${lessonPlan.values.map(value => `<li>${value}</li>`).join('')}
        </ul>
        
        <div class="section-title">KEY INQUIRY QUESTIONS</div>
        <ul>
          ${lessonPlan.keyInquiryQuestions.map(question => `<li>${question}</li>`).join('')}
        </ul>
        
        <div class="section-title">LEARNING EXPERIENCES</div>
        ${lessonPlan.learningExperiences.map(exp => `
          <div style="margin: 15px 0; padding: 10px; border-left: 3px solid #FFD700;">
            <div><strong>Activity:</strong> ${exp.activity}</div>
            <div><strong>Duration:</strong> ${exp.duration} minutes</div>
            <div><strong>Methodology:</strong> ${exp.methodology}</div>
          </div>
        `).join('')}
        
        <div class="section-title">RESOURCES</div>
        <ul>
          ${lessonPlan.resources.map(resource => `<li>${resource}</li>`).join('')}
        </ul>
        
        <div class="footer">Generated via ElimuHub 2.0 | CBC Compliant</div>
      </body>
      </html>
    `;
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