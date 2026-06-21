"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;

  const { error } = await supabase.from("categories").insert({
    name,
    slug: generateSlug(name),
    description: (formData.get("description") as string) || null,
    parent_id: (formData.get("parent_id") as string) || null,
    is_active: formData.get("is_active") !== "false",
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return { success: "Category created." };
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .update({
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      parent_id: (formData.get("parent_id") as string) || null,
      is_active: formData.get("is_active") !== "false",
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return { success: "Category updated." };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return { success: "Category deleted." };
}
