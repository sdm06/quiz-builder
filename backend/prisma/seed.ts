import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import 'dotenv/config';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.warn('🌱 Seeding database...');

  await prisma.quiz.deleteMany();

  // Quiz 1: Boolean questions
  const quiz1 = await prisma.quiz.create({
    data: {
      title: 'True or False: JavaScript Fundamentals',
      questions: {
        create: [
          {
            type: 'BOOLEAN',
            text: 'JavaScript is a statically typed language.',
            booleanAnswer: false,
            order: 0,
          },
          {
            type: 'BOOLEAN',
            text: 'JavaScript arrays are zero-indexed.',
            booleanAnswer: true,
            order: 1,
          },
          {
            type: 'BOOLEAN',
            text: 'The "typeof null" returns "null".',
            booleanAnswer: false,
            order: 2,
          },
        ],
      },
    },
    include: { questions: true },
  });
  console.warn(`✅ Created quiz: ${quiz1.title} (${quiz1.questions.length} questions)`);

  // Quiz 2: Input (short answer) questions
  const quiz2 = await prisma.quiz.create({
    data: {
      title: 'Short Answer: Web Development Concepts',
      questions: {
        create: [
          {
            type: 'INPUT',
            text: 'What does HTTP stand for?',
            textAnswer: 'HyperText Transfer Protocol',
            order: 0,
          },
          {
            type: 'INPUT',
            text: 'What is the primary purpose of a CDN?',
            textAnswer: 'Content Delivery Network - to serve content from servers geographically closer to users',
            order: 1,
          },
          {
            type: 'INPUT',
            text: 'Name one CSS framework that uses utility-first classes.',
            textAnswer: 'Tailwind CSS',
            order: 2,
          },
        ],
      },
    },
    include: { questions: true },
  });
  console.warn(`✅ Created quiz: ${quiz2.title} (${quiz2.questions.length} questions)`);

  // Quiz 3: Checkbox (multiple choice) questions
  const quiz3 = await prisma.quiz.create({
    data: {
      title: 'Multiple Choice: TypeScript Features',
      questions: {
        create: [
          {
            type: 'CHECKBOX',
            text: 'Which of the following are valid TypeScript primitive types? (Select all that apply)',
            order: 0,
            options: {
              create: [
                { text: 'string', isCorrect: true },
                { text: 'number', isCorrect: true },
                { text: 'boolean', isCorrect: true },
                { text: 'character', isCorrect: false },
                { text: 'float', isCorrect: false },
              ],
            },
          },
          {
            type: 'CHECKBOX',
            text: 'Which features were introduced in TypeScript 5.0? (Select all that apply)',
            order: 1,
            options: {
              create: [
                { text: 'Decorators (standard)', isCorrect: true },
                { text: 'const type parameters', isCorrect: true },
                { text: 'Multiple configuration files in extends', isCorrect: true },
                { text: 'All of the above', isCorrect: false },
              ],
            },
          },
          {
            type: 'CHECKBOX',
            text: 'What does the "never" type represent? (Select all that apply)',
            order: 2,
            options: {
              create: [
                { text: 'A function that never returns (throws or infinite loop)', isCorrect: true },
                { text: 'A type that can hold any value', isCorrect: false },
                { text: 'A type that can never hold a value', isCorrect: true },
                { text: 'A type that only accepts null', isCorrect: false },
              ],
            },
          },
        ],
      },
    },
    include: { questions: { include: { options: true } } },
  });
  console.warn(`✅ Created quiz: ${quiz3.title} (${quiz3.questions.length} questions)`);

  // Verify all quizzes
  const allQuizzes = await prisma.quiz.findMany({
    include: { questions: { include: { options: true } } },
    orderBy: { createdAt: 'asc' },
  });

  console.warn('\n📊 Seed summary:');
  allQuizzes.forEach((quiz) => {
    const types = new Set(quiz.questions.map((q) => q.type));
    console.warn(`  - ${quiz.title}: ${quiz.questions.length} questions [${Array.from(types).join(', ')}]`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });