import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateQuizDto } from './dto/create-quiz.dto.js';

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateQuizDto) {
    const quiz = await this.prisma.quiz.create({
      data: {
        title: dto.title,
        questions: {
          create: dto.questions.map((q, index) => ({
            type: q.type,
            text: q.text,
            booleanAnswer: q.type === 'BOOLEAN' ? q.booleanAnswer : null,
            textAnswer: q.type === 'INPUT' ? q.textAnswer : null,
            order: q.order ?? index,
            options: q.type === 'CHECKBOX' && q.options?.length
              ? { create: q.options.map((opt) => ({ text: opt.text, isCorrect: opt.isCorrect })) }
              : undefined,
          })),
        },
      },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' },
        },
      },
    });
    return quiz;
  }

  async findAll() {
    return this.prisma.quiz.findMany({
      select: {
        id: true,
        title: true,
        createdAt: true,
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!quiz) {
      throw new NotFoundException(`Quiz with id "${id}" not found`);
    }
    return quiz;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.quiz.delete({ where: { id } });
    return { success: true, id };
  }
}