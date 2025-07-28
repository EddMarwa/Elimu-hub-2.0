import { PrismaClient, UserRole, DocumentType, ProcessingStatus, TemplateType } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

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
      password: '$2a$10$K1/qkKUB8B2VW5ZKJ9ZrY.5OPQKVPhHY9YzLHq7tE2C8W9P3sZ1Eq', // 'password123'
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
      password: '$2a$10$K1/qkKUB8B2VW5ZKJ9ZrY.5OPQKVPhHY9YzLHq7tE2C8W9P3sZ1Eq', // 'password123'
    },
  });

  // Create default templates
  const lessonPlanTemplate = await prisma.template.upsert({
    where: { id: 'default-lesson-plan' },
    update: {},
    create: {
      id: 'default-lesson-plan',
      name: 'CBC Lesson Plan Template',
      type: TemplateType.LESSON_PLAN,
      content: JSON.stringify({
        structure: [
          'Learning Outcomes',
          'Core Competencies',
          'Values',
          'Key Inquiry Questions',
          'Learning Experiences',
          'Assessment Criteria',
          'Resources'
        ],
        coreCompetencies: [
          'Communication and Collaboration',
          'Critical Thinking and Problem Solving',
          'Imagination and Creativity',
          'Citizenship',
          'Digital Literacy',
          'Learning to Learn',
          'Self-Efficacy'
        ],
        values: [
          'Love',
          'Responsibility',
          'Respect',
          'Unity',
          'Peace',
          'Patriotism',
          'Social Justice'
        ]
      }),
      isDefault: true,
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

  // Create sample lesson plan
  const sampleLessonPlan = await prisma.lessonPlan.create({
    data: {
      title: 'Introduction to Fractions',
      subject: 'Mathematics',
      grade: 'Grade 4',
      duration: 40,
      learningOutcomes: JSON.stringify([
        'Define what a fraction is',
        'Identify numerator and denominator',
        'Represent fractions using diagrams'
      ]),
      coreCompetencies: JSON.stringify([
        'Critical Thinking and Problem Solving',
        'Communication and Collaboration'
      ]),
      values: JSON.stringify(['Responsibility', 'Respect']),
      keyInquiryQuestions: JSON.stringify([
        'What is a fraction?',
        'How can we represent parts of a whole?',
        'When do we use fractions in real life?'
      ]),
      learningExperiences: JSON.stringify([
        {
          activity: 'Fraction pizza activity',
          duration: 15,
          methodology: 'Hands-on manipulation',
          resources: ['Paper circles', 'Colored pencils'],
          assessment: 'Observation'
        }
      ]),
      assessmentCriteria: JSON.stringify([
        {
          criterion: 'Understanding fractions',
          exceeding: 'Explains fractions and creates own examples',
          meeting: 'Identifies and explains basic fractions',
          approaching: 'Recognizes fractions with support',
          below: 'Struggles to identify fractions'
        }
      ]),
      resources: JSON.stringify([
        'Mathematics textbook Grade 4',
        'Fraction manipulatives',
        'Whiteboard and markers'
      ]),
      reflection: 'Students showed good understanding of basic fraction concepts.',
      createdBy: teacherUser.id,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`👤 Admin user: ${adminUser.email}`);
  console.log(`👨‍🏫 Teacher user: ${teacherUser.email}`);
  console.log(`📋 Lesson plan template: ${lessonPlanTemplate.name}`);
  console.log(`📅 Scheme template: ${schemeOfWorkTemplate.name}`);
  console.log(`📖 Sample lesson plan: ${sampleLessonPlan.title}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
