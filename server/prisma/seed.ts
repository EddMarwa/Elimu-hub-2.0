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
