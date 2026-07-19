"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/actions/categories";
import { handleAction } from "@/lib/action-handler";
import { Badge } from "@/components/ui/badge";
import { CategoryImageUpload } from "@/components/admin/category-image-upload";
import type { Category } from "@/types";

export function CategoryManager({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const roots = categories.filter((c) => !c.parent_id);
  const children = categories.filter((c) => c.parent_id);
  const deleteTargetSubCount = deleteTarget
    ? children.filter((c) => c.parent_id === deleteTarget.id).length
    : 0;

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await handleAction(createCategory(formData), {
      onSuccess: () => {
        setCreateOpen(false);
        router.refresh();
      },
    });
    setLoading(false);
  }

  async function handleUpdate(id: string, formData: FormData) {
    setLoading(true);
    await handleAction(updateCategory(id, formData), {
      onSuccess: () => router.refresh(),
    });
    setLoading(false);
  }

  async function handleDelete(id: string) {
    setLoading(true);
    await handleAction(deleteCategory(id), {
      onSuccess: () => {
        setDeleteTarget(null);
        router.refresh();
      },
    });
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger render={<Button className="gap-2" />}>
          <Plus className="h-4 w-4" />
          Add Category
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Name *</Label>
              <Input id="new-name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-desc">Description</Label>
              <Textarea id="new-desc" name="description" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Parent Category</Label>
              <select
                name="parent_id"
                className="flex h-8 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="">None (top-level)</option>
                {roots.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {roots.map((category) => {
          const subs = children.filter((c) => c.parent_id === category.id);
          return (
            <div key={category.id} className="rounded-lg border bg-card">
              <CategoryRow
                category={category}
                roots={roots}
                onUpdate={handleUpdate}
                onDelete={setDeleteTarget}
                loading={loading}
              />
              {subs.length > 0 && (
                <div className="border-t pl-8">
                  {subs.map((sub) => (
                    <CategoryRow
                      key={sub.id}
                      category={sub}
                      roots={roots}
                      onUpdate={handleUpdate}
                      onDelete={setDeleteTarget}
                      loading={loading}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{deleteTarget?.name}&rdquo;?</DialogTitle>
            <DialogDescription>
              Products in this category are not deleted — they become
              uncategorized and stay in the store.
              {deleteTargetSubCount > 0 &&
                ` Its ${deleteTargetSubCount} ${
                  deleteTargetSubCount === 1 ? "subcategory" : "subcategories"
                } will become top-level.`}{" "}
              This cannot be undone. To hide the category without deleting it,
              edit it and mark it inactive instead.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              disabled={loading}
              onClick={() => {
                if (deleteTarget) handleDelete(deleteTarget.id);
              }}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryRow({
  category,
  roots,
  onUpdate,
  onDelete,
  loading,
}: {
  category: Category;
  roots: Category[];
  onUpdate: (id: string, formData: FormData) => Promise<void>;
  onDelete: (category: Category) => void;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center gap-2.5">
        <div className="relative h-9 w-12 shrink-0 overflow-hidden rounded border bg-muted">
          {category.image_url ? (
            <Image
              src={category.image_url}
              alt={category.name}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm">🪡</div>
          )}
        </div>
        <span className="font-medium">{category.name}</span>
        {!category.is_active && (
          <Badge variant="secondary" className="text-xs">
            Inactive
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Dialog>
          <DialogTrigger render={<Button variant="ghost" size="icon-xs" />}>
            <Pencil className="h-3 w-3" />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
            </DialogHeader>
            {/* Uploads save immediately, independent of the form below. */}
            <CategoryImageUpload
              categoryId={category.id}
              imageUrl={category.image_url}
            />
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onUpdate(category.id, new FormData(e.currentTarget));
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input name="name" defaultValue={category.name} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  name="description"
                  rows={2}
                  defaultValue={category.description ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Parent</Label>
                <select
                  name="parent_id"
                  defaultValue={category.parent_id ?? ""}
                  className="flex h-8 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option value="">None</option>
                  {roots
                    .filter((c) => c.id !== category.id) // can't be its own parent
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  name="is_active"
                  value="true"
                  defaultChecked={category.is_active}
                />
                <Label>Active</Label>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button type="submit" disabled={loading}>
                  Save
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Delete ${category.name}`}
          onClick={() => onDelete(category)}
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
