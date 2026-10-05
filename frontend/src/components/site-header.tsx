"use client";

import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="border-b sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/quizzes" className="flex items-center gap-2 font-semibold text-xl">
          <BookOpen className="h-5 w-5 text-primary" />
          Quiz Builder
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Button asChild size="sm" className="gap-2">
            <Link href="/quizzes/create">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Quiz</span>
              <span className="sr-only sm:hidden">Create Quiz</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}