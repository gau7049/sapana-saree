"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, RefreshCw } from "lucide-react";
import { createProduct, updateProduct } from "@/actions/products";
import { handleAction } from "@/lib/action-handler";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";
import type { Product, Category } from "@/types";

interface ProductFormProps {
  product?: Product;
  categories: Category[];
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(product?.title ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const isEditing = !!product;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const price = Number(formData.get("price"));
    const compareAtRaw = formData.get("compare_at_price") as string;
    const compareAtPrice = compareAtRaw ? Number(compareAtRaw) : null;

    if (compareAtPrice !== null && compareAtPrice <= price) {
      toast.error("Compare at Price must be higher than Price.");
      return;
    }

    setLoading(true);

    try {
      const action = isEditing
        ? updateProduct(product.id, formData)
        : createProduct(formData);

      await handleAction(action);
    } catch {
      // redirect throws, which is expected for createProduct
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Product Title *</Label>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
              placeholder="e.g., Banarasi Silk Saree"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug{isEditing ? "" : " *"}</Label>
            <div className="flex gap-2">
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required={!isEditing}
                placeholder="e.g., banarasi-silk-saree"
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                title="Lowercase letters, numbers, and hyphens only"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Regenerate from title"
                onClick={() => setSlug(slugify(title))}
                disabled={!title.trim()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Changing this changes the product&apos;s public URL. Existing links to
                the old URL will stop working.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="short_description">Short Description</Label>
            <Input
              id="short_description"
              name="short_description"
              defaultValue={product?.short_description ?? ""}
              placeholder="Brief description for product cards"
              maxLength={160}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Full Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={product?.description ?? ""}
              rows={4}
              placeholder="Detailed product description"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">Price (INR) *</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product?.price}
              required
              placeholder="e.g., 2999"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="compare_at_price">Compare at Price</Label>
            <Input
              id="compare_at_price"
              name="compare_at_price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product?.compare_at_price ?? ""}
              placeholder="Original price for strikethrough"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category & Status</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              name="category_id"
              defaultValue={product?.category_id ?? ""}
              // items makes the trigger show the category NAME instead of the
              // raw UUID after selection / on the edit form.
              items={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              name="status"
              defaultValue={product?.status ?? "draft"}
              items={[
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published" },
                { value: "archived", label: "Archived" },
              ]}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              name="is_featured"
              value="true"
              defaultChecked={product?.is_featured ?? false}
            />
            <Label>Featured Product</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              name="is_available"
              value="true"
              defaultChecked={product?.is_available ?? true}
            />
            <Label>In Stock</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="material">Material</Label>
            <Input
              id="material"
              name="material"
              defaultValue={product?.material ?? ""}
              placeholder="e.g., Silk, Cotton"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="occasion">Occasion</Label>
            <Input
              id="occasion"
              name="occasion"
              defaultValue={product?.occasion ?? ""}
              placeholder="e.g., Wedding, Casual"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="work_type">Work Type</Label>
            <Input
              id="work_type"
              name="work_type"
              defaultValue={product?.work_type ?? ""}
              placeholder="e.g., Zari, Embroidery"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meta_title">Meta Title</Label>
            <Input
              id="meta_title"
              name="meta_title"
              defaultValue={product?.meta_title ?? ""}
              placeholder="SEO title (defaults to product title)"
              maxLength={70}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta_description">Meta Description</Label>
            <Textarea
              id="meta_description"
              name="meta_description"
              defaultValue={product?.meta_description ?? ""}
              rows={2}
              placeholder="SEO description (defaults to short description)"
              maxLength={160}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
