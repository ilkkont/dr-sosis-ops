"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { InventoryCategory } from "@/lib/inventory";
import { createInventoryCategory, updateInventoryCategory } from "./categories-actions";

function CategoryRow({ category }: { category?: InventoryCategory }) {
  const [name, setName] = useState(category?.name ?? "");
  const [sortOrder, setSortOrder] = useState(String(category?.sort_order ?? 110));
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const input = { name: name.trim(), sort_order: Number(sortOrder), is_active: isActive };
    const result = category
      ? await updateInventoryCategory(category.id, input)
      : await createInventoryCategory(input);
    setSaving(false);

    if (result.success) {
      toast.success(category ? "Kategori güncellendi." : "Kategori eklendi.");
      if (!category) {
        setName("");
        setSortOrder("110");
        setIsActive(true);
      }
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Yeni kategori adı"
        aria-label="Kategori adı"
        className="flex-1"
      />
      <Input
        type="number"
        min="0"
        value={sortOrder}
        onChange={(event) => setSortOrder(event.target.value)}
        aria-label="Sıra"
        className="w-20"
      />
      <Switch checked={isActive} onCheckedChange={setIsActive} aria-label="Aktif" />
      <Button
        type="button"
        size="sm"
        disabled={saving || name.trim() === ""}
        className="bg-red text-white hover:bg-red-deep"
        onClick={save}
      >
        {category ? "Kaydet" : "Ekle"}
      </Button>
    </div>
  );
}

export function CategoriesDialog({
  categories,
  trigger,
}: {
  categories: InventoryCategory[];
  trigger: React.ReactElement;
}) {
  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Kategoriler</DialogTitle>
          <DialogDescription>
            Kategori adı, sıra (küçük olan önce) ve durum. Pasif kategoriler listelerde
            gizlenmez, yalnızca yeni kalem eklerken seçilemez.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {categories.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </div>
        <div className="border-t pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Yeni kategori
          </p>
          <CategoryRow />
        </div>
      </DialogContent>
    </Dialog>
  );
}
