import { PrismaClient, UserRole, DocumentType, ProcessingStatus, TemplateType } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash the password properly
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@elimuhub.com' },
    update: {},
    create: {
      email: 'admin@elimuhub.com',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      school: 'ElimuHub System',
      county: 'Nairobi',
      subjects: JSON.stringify(['Mathematics', 'Science', 'English']),
      password: hashedPassword,
    },
  });

  // Create sample teacher user
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@elimuhub.com' },
    update: {},
    create: {
      email: 'teacher@elimuhub.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.TEACHER,
      school: 'Sample Primary School',
      county: 'Nairobi',
      subjects: JSON.stringify(['Mathematics', 'Science']),
      password: hashedPassword,
    },
  });



  const schemeOfWorkTemplate = await prisma.template.upsert({
    where: { id: 'default-scheme' },
    update: {},
    create: {
      id: 'default-scheme',
      name: 'CBC Scheme of Work Template',
      type: TemplateType.SCHEME_OF_WORK,
      content: JSON.stringify({
        structure: [
          'Overall Objectives',
          'Weekly Plans',
          'Core Competencies',
          'Values',
          'Assessment Methods'
        ],
        weeklyStructure: [
          'Topic',
          'Sub-topics',
          'Learning Outcomes',
          'Key Inquiry Questions',
          'Learning Experiences',
          'Core Competencies',
          'Values',
          'Assessment Methods',
          'Resources'
        ]
      }),
      isDefault: true,
    },
  });

  // Seed Lesson Plans
  const lessonPlan1 = await prisma.lessonPlan.create({
    data: {
      title: 'Mathematics - Fractions Grade 5',
      description: 'A comprehensive lesson plan for teaching fractions to Grade 5 students',
      grade: 'Grade 5',
      subject: 'Mathematics',
      tags: JSON.stringify(['fractions', 'mathematics', 'grade5']),
      fileUrl: 'uploads/lesson-plans/sample-math-fractions.pdf',
      fileType: 'application/pdf',
      uploadedBy: adminUser.id,
    },
  });
  const lessonPlan2 = await prisma.lessonPlan.create({
    data: {
      title: 'Science - Plants Grade 4',
      description: 'Interactive lesson plan covering plant life cycles for Grade 4 students',
      grade: 'Grade 4',
      subject: 'Science',
      tags: JSON.stringify(['plants', 'life-cycle', 'science', 'grade4']),
      fileUrl: 'uploads/lesson-plans/sample-science-plants.pdf',
      fileType: 'application/pdf',
      uploadedBy: teacherUser.id,
    },
  });

  // Seed Library Sections, Subfolders, and Files
  const section = await prisma.librarySection.create({
    data: {
      name: 'General Library',
      description: 'Main library section',
      order: 1,
    },
  });
  const subfolder = await prisma.librarySubfolder.create({
    data: {
      name: 'Grade 5 Notes',
      sectionId: section.id,
      order: 1,
    },
  });
  await prisma.libraryFile.create({
    data: {
      filename: 'sample-notes.txt',
      originalName: 'Sample Notes.txt',
      filePath: 'uploads/library/sample-notes.txt',
      fileType: 'DOCUMENT',
      fileSize: 1024,
      mimeType: 'text/plain',
      sectionId: section.id,
      subfolderId: subfolder.id,
      uploadedBy: adminUser.id,
      description: 'Sample notes for Grade 5',
      tags: JSON.stringify(['notes', 'grade5']),
      status: 'APPROVED',
    },
  });


  console.log('✅ Database seeded successfully!');
  console.log(`👤 Admin user: ${adminUser.email}`);
  console.log(`👨‍🏫 Teacher user: ${teacherUser.email}`);

  console.log(`📅 Scheme template: ${schemeOfWorkTemplate.name}`);

}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
