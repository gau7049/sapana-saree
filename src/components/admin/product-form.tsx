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
import { Loader2 } from "lucide-react";
import { createProduct, updateProduct } from "@/actions/products";
import { toast } from "sonner";
import type { Product, Category } from "@/types";

interface ProductFormProps {
  product?: Product;
  categories: Category[];
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!product;

  async function handleSubmit(formData: FormData) {
    setLoading(true);

    const result = isEditing
      ? await updateProduct(product.id, formData)
      : await createProduct(formData);

    if (result && "error" in result) {
      toast.error(result.error);
      setLoading(false);
    } else if (result && "success" in result) {
      toast.success(result.success);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
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
              defaultValue={product?.title}
              required
              placeholder="e.g., Banarasi Silk Saree - Red"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product?.price}
                required
                placeholder="2999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="compare_at_price">Compare at Price (₹)</Label>
              <Input
                id="compare_at_price"
                name="compare_at_price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product?.compare_at_price ?? ""}
                placeholder="3999"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="short_description">Short Description</Label>
            <Input
              id="short_description"
              name="short_description"
              defaultValue={product?.short_description ?? ""}
              placeholder="Brief one-line description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Full Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={5}
              defaultValue={product?.description ?? ""}
              placeholder="Detailed product description"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                name="category_id"
                defaultValue={product?.category_id ?? ""}
                className="flex h-8 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <select
                name="status"
                defaultValue={product?.status ?? "draft"}
                className="flex h-8 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="is_featured"
              name="is_featured"
              value="true"
              defaultChecked={product?.is_featured ?? false}
            />
            <Label htmlFor="is_featured">Featured product</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                name="color"
                defaultValue={product?.color ?? ""}
                placeholder="e.g., Red, Blue"
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
                placeholder="e.g., Embroidery, Zari"
              />
            </div>
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
              placeholder="Custom title for search engines"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta_description">Meta Description</Label>
            <Textarea
              id="meta_description"
              name="meta_description"
              rows={2}
              defaultValue={product?.meta_description ?? ""}
              placeholder="Custom description for search engines (max 160 chars)"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Save Changes" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
