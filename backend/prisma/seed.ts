import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import 'dotenv/config';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
});

const prisma = new PrismaClient({ adapter });

type SeedQuestion =
  | { type: 'BOOLEAN'; text: string; booleanAnswer: boolean }
  | { type: 'INPUT'; text: string; textAnswer: string }
  | { type: 'CHECKBOX'; text: string; options: Array<{ text: string; isCorrect: boolean }> };

type SeedQuiz = { title: string; questions: SeedQuestion[] };

/**
 * Sample content covering all three question types. `order` is derived from the
 * array index so the questions always come back in the intended order.
 */
const SEED_QUIZZES: SeedQuiz[] = [
  {
    title: 'True or False: JavaScript Fundamentals',
    questions: [
      { type: 'BOOLEAN', text: 'JavaScript is a statically typed language.', booleanAnswer: false },
      { type: 'BOOLEAN', text: 'JavaScript arrays are zero-indexed.', booleanAnswer: true },
      { type: 'BOOLEAN', text: 'The "typeof null" returns "null".', booleanAnswer: false },
      { type: 'BOOLEAN', text: '"use strict" is opt-in for modules.', booleanAnswer: true },
    ],
  },
  {
    title: 'Short Answer: Web Development Concepts',
    questions: [
      { type: 'INPUT', text: 'What does HTTP stand for?', textAnswer: 'HyperText Transfer Protocol' },
      { type: 'INPUT', text: 'Name one CSS framework that uses utility-first classes.', textAnswer: 'Tailwind CSS' },
      { type: 'INPUT', text: 'Which HTTP status code means "Not Found"?', textAnswer: '404' },
      { type: 'INPUT', text: 'What is the primary purpose of a CDN?', textAnswer: 'Content Delivery Network' },
    ],
  },
  {
    title: 'Multiple Choice: TypeScript Features',
    questions: [
      {
        type: 'CHECKBOX',
        text: 'Which of the following are valid TypeScript primitive types? (Select all that apply)',
        options: [
          { text: 'string', isCorrect: true },
          { text: 'number', isCorrect: true },
          { text: 'boolean', isCorrect: true },
          { text: 'character', isCorrect: false },
          { text: 'float', isCorrect: false },
        ],
      },
      {
        type: 'CHECKBOX',
        text: 'What does the "never" type represent? (Select all that apply)',
        options: [
          { text: 'A function that never returns (throws or infinite loop)', isCorrect: true },
          { text: 'A type that can never hold a value', isCorrect: true },
          { text: 'A type that can hold any value', isCorrect: false },
          { text: 'A type that only accepts null', isCorrect: false },
        ],
      },
      {
        type: 'CHECKBOX',
        text: 'Which of these are valid ways to declare a variable in JavaScript? (Select all that apply)',
        options: [
          { text: 'let', isCorrect: true },
          { text: 'const', isCorrect: true },
          { text: 'var', isCorrect: true },
          { text: 'define', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'Mixed Practice: Web Fundamentals',
    questions: [
      { type: 'BOOLEAN', text: 'The DOM stands for Document Object Model.', booleanAnswer: true },
      { type: 'INPUT', text: 'Which protocol does HTTPS use by default on port 443?', textAnswer: 'TLS' },
      {
        type: 'CHECKBOX',
        text: 'Which of these are front-end build tools? (Select all that apply)',
        options: [
          { text: 'Vite', isCorrect: true },
          { text: 'esbuild', isCorrect: true },
          { text: 'PostgreSQL', isCorrect: false },
        ],
      },
      { type: 'BOOLEAN', text: 'CSS grid and flexbox are the same layout system.', booleanAnswer: false },
      { type: 'INPUT', text: 'What is the default port for a Node.js HTTP server?', textAnswer: '3000' },
    ],
  },
];

const force = process.argv.includes('--force') || process.env.SEED_FORCE === '1';

/** Maps the seed shape onto the Prisma nested-create shape. */
function toCreateData(quiz: SeedQuiz) {
  return {
    title: quiz.title,
    questions: {
      create: quiz.questions.map((question, index) => {
        const base = { type: question.type, text: question.text, order: index };

        switch (question.type) {
          case 'BOOLEAN':
            return { ...base, booleanAnswer: question.booleanAnswer, textAnswer: null };
          case 'INPUT':
            return { ...base, booleanAnswer: null, textAnswer: question.textAnswer };
          case 'CHECKBOX':
            return {
              ...base,
              booleanAnswer: null,
              textAnswer: null,
              options: {
                create: question.options.map((option) => ({
                  text: option.text,
                  isCorrect: option.isCorrect,
                })),
              },
            };
        }
      }),
    },
  };
}

async function main() {
  const existing = await prisma.quiz.count();

  // Seeding runs automatically on container start, so it must be a no-op when
  // there is already data. `--force` (or SEED_FORCE=1) wipes and re-seeds.
  if (existing > 0 && !force) {
    console.warn(`🌱 Skipping seed: database already has ${existing} quiz(es).`);
    console.warn('   Use `pnpm db:seed:force` to wipe and re-seed.');
    return;
  }

  console.warn('🌱 Seeding database...');

  if (existing > 0) {
    await prisma.quiz.deleteMany();
    console.warn(`   Removed ${existing} existing quiz(es).`);
  }

  for (const quiz of SEED_QUIZZES) {
    await prisma.quiz.create({ data: toCreateData(quiz) });
  }

  const allQuizzes = await prisma.quiz.findMany({
    include: { questions: { include: { options: true } } },
    orderBy: { createdAt: 'asc' },
  });

  console.warn('\n📊 Seed summary:');
  for (const quiz of allQuizzes) {
    const types = [...new Set(quiz.questions.map((q) => q.type))].join(', ');
    console.warn(`  - ${quiz.title}: ${quiz.questions.length} questions [${types}]`);
  }
  console.warn(`\n✅ Seeded ${allQuizzes.length} quizzes.`);
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });