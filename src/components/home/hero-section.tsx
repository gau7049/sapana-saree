"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section className="bg-linear-to-r from-primary/[0.03] to-accent/[0.06]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-5 lg:gap-12">
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                New Arrivals
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl"
            >
              Exquisite Sarees for{" "}
              <span className="text-primary">Every Occasion</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.16 }}
              className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              From luxurious Banarasi silks to everyday cotton weaves. Handpicked
              sarees at prices you&apos;ll love.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.24 }}
              className="mt-6 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/sarees"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "gap-2 rounded-lg px-6"
                )}
              >
                Shop Now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/categories"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "rounded-lg px-6"
                )}
              >
                Browse Categories
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-[10px] text-green-700">
                  ✓
                </span>
                Free Delivery
              </span>
              <span className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-[10px] text-green-700">
                  ✓
                </span>
                100% Authentic
              </span>
              <span className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-[10px] text-green-700">
                  ✓
                </span>
                Easy Returns
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden lg:col-span-2 lg:block"
          >
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary/8 via-accent/10 to-primary/5">
              <div className="flex aspect-4/3 flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <span className="text-4xl">🪡</span>
                </div>
                <p className="text-sm font-medium text-foreground/70">
                  Premium Collection
                </p>
                <p className="text-xs text-muted-foreground">
                  Replace with your hero image
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
