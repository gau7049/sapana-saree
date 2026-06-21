"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-primary/5 via-background to-primary/10">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>New Collection Available</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Drape Yourself in
            <br />
            <span className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Timeless Elegance
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
          >
            Explore our curated collection of handpicked sarees — from luxurious
            Banarasi silks to contemporary designer pieces. Every saree tells a
            story.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex items-center justify-center gap-4"
          >
            <Link
              href="/sarees"
              className={cn(buttonVariants({ size: "lg" }), "gap-2")}
            >
              Shop Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/categories"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Browse Categories
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>
    </section>
  );
}
