import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import type { ProductImage } from "@/types";

const IMAGES_FILE = join(process.cwd(), "data", "images.json");

export async function readLocalImages(): Promise<ProductImage[]> {
  try {
    const data = await readFile(IMAGES_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveLocalImages(images: ProductImage[]): Promise<void> {
  const { mkdir } = await import("fs/promises");
  const { dirname } = await import("path");
  await mkdir(dirname(IMAGES_FILE), { recursive: true });
  await writeFile(IMAGES_FILE, JSON.stringify(images, null, 2));
}
