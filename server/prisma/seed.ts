import { PrismaClient, UserRole, DocumentType, ProcessingStatus, TemplateType } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';
import { seedAdminUsers } from './seed/create-admin-users';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting ElimuHub 2.0 Database Seeding...\n');

  try {
    // Step 1: Seed Admin Users
    console.log('👥 Step 1: Creating Admin Users...');
    await seedAdminUsers();
    console.log('✅ Admin users seeding completed\n');

    // Step 2: Create default scheme of work template
    console.log('📋 Step 2: Creating Default Templates...');
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
    console.log('✅ Default templates created\n');

    // Step 3: Create sample lesson plans
    console.log('📚 Step 3: Creating Sample Lesson Plans...');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@elimuhub.com' }
    });

    const teacherUser = await prisma.user.findUnique({
      where: { email: 'teacher@elimuhub.com' }
    });

    if (adminUser) {
      await prisma.lessonPlan.upsert({
        where: { id: 'sample-math-lesson' },
        update: {},
        create: {
          id: 'sample-math-lesson',
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
    }

    if (teacherUser) {
      await prisma.lessonPlan.upsert({
        where: { id: 'sample-science-lesson' },
        update: {},
        create: {
          id: 'sample-science-lesson',
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
    }
    console.log('✅ Sample lesson plans created\n');

    // Step 4: Create library structure
    console.log('📚 Step 4: Creating Library Structure...');
    const section = await prisma.librarySection.upsert({
      where: { name: 'General Library' },
      update: {},
      create: {
        name: 'General Library',
        description: 'Main library section for educational resources',
        order: 1,
      },
    });

    const subfolder = await prisma.librarySubfolder.upsert({
      where: { 
        sectionId_name: {
          sectionId: section.id,
          name: 'Grade 5 Notes'
        }
      },
      update: {},
      create: {
        name: 'Grade 5 Notes',
        sectionId: section.id,
        order: 1,
      },
    });

    // Create sample library file
    if (adminUser) {
      await prisma.libraryFile.upsert({
        where: { id: 'sample-notes-file' },
        update: {},
        create: {
          id: 'sample-notes-file',
          filename: 'sample-notes.txt',
          originalName: 'Sample Notes.txt',
          filePath: 'uploads/library/sample-notes.txt',
          fileType: 'DOCUMENT',
          fileSize: 1024,
          mimeType: 'text/plain',
          sectionId: section.id,
          subfolderId: subfolder.id,
          uploadedBy: adminUser.id,
          description: 'Sample notes for Grade 5 students',
          tags: JSON.stringify(['notes', 'grade5', 'sample']),
          status: 'APPROVED',
        },
      });
    }
    console.log('✅ Library structure created\n');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Seeding Summary:');
    console.log('   ✅ Admin users created/verified');
    console.log('   ✅ Default templates configured');
    console.log('   ✅ Sample lesson plans added');
    console.log('   ✅ Library structure initialized');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  });
