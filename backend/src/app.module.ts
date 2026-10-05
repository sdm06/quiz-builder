import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from './config/env.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { QuizzesModule } from './quizzes/quizzes.module.js';
import { HealthModule } from './health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        const result = envSchema.safeParse(config);
        if (!result.success) {
          console.error('❌ Invalid environment variables:', result.error.flatten().fieldErrors);
          throw new Error('Invalid environment variables');
        }
        return result.data;
      },
    }),
    PrismaModule,
    QuizzesModule,
    HealthModule,
  ],
})
export class AppModule {}