"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeroSection({ imageUrl }: { imageUrl?: string | null }) {
  return (
    <section className="bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-5 lg:gap-12">
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <span className="inline-block border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                New Arrivals
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl"
            >
              Exquisite Sarees for Every Occasion
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
                className={cn(buttonVariants({ size: "lg" }), "gap-2 px-6")}
              >
                Shop Now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/categories"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "px-6"
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
                <Check className="h-3.5 w-3.5" />
                Free Delivery
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                100% Authentic
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
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
            <div className="relative aspect-4/3 overflow-hidden border border-border bg-muted">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt="Sapana Saree — premium collection"
                  fill
                  priority
                  sizes="(max-width: 1024px) 0px, 40vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="rounded-full border border-border p-4">
                    <span className="text-4xl">🪡</span>
                  </div>
                  <p className="text-sm font-medium text-foreground/70">
                    Premium Collection
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Replace with your hero image
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
