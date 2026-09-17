"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  INVENTORY_CATEGORY_LABELS,
  UNIT_TYPE_LABELS,
  inventoryItemSchema,
  type InventoryItemFormInput,
  type InventoryItemInput,
} from "@/lib/validations/inventory";
import { createInventoryItem, updateInventoryItem } from "./actions";
import type { Database } from "@/types/database";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

export function InventoryFormDialog({
  item,
  trigger,
}: {
  item?: InventoryItem;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(item);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<InventoryItemFormInput, unknown, InventoryItemInput>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      name: item?.name ?? "",
      category: item?.category ?? "other",
      unit_type: item?.unit_type ?? "count",
      portion_kg_factor: item?.portion_kg_factor ?? undefined,
      critical_level: item?.critical_level ?? 0,
      is_active: item?.is_active ?? true,
    },
  });

  const unitType = useWatch({ control, name: "unit_type" });

  async function onSubmit(values: InventoryItemInput) {
    const result = isEdit
      ? await updateInventoryItem(item!.id, values)
      : await createInventoryItem(values);

    if (result.success) {
      toast.success(isEdit ? "Stok kalemi güncellendi." : "Stok kalemi oluşturuldu.");
      setOpen(false);
      if (!isEdit) reset();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next && !isEdit) reset();
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Stok Kalemini Düzenle" : "Yeni Stok Kalemi"}</DialogTitle>
          <DialogDescription>
            Ad, kategori, ana birim, kritik stok seviyesi ve durum bilgilerini girin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Ad</Label>
            <Input
              id="name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              {...register("name")}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(INVENTORY_CATEGORY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_type">Ana Birim</Label>
              <Controller
                control={control}
                name="unit_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="unit_type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(UNIT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {unitType === "portion" && (
            <div className="space-y-2">
              <Label htmlFor="portion_kg_factor">1 kg = kaç porsiyon?</Label>
              <Input
                id="portion_kg_factor"
                type="number"
                step="0.001"
                min="0"
                aria-invalid={!!errors.portion_kg_factor}
                aria-describedby={errors.portion_kg_factor ? "portion_kg_factor-error" : undefined}
                {...register("portion_kg_factor")}
              />
              {errors.portion_kg_factor && (
                <p id="portion_kg_factor-error" className="text-sm text-destructive">
                  {errors.portion_kg_factor.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="critical_level">
              Kritik Stok Seviyesi ({UNIT_TYPE_LABELS[unitType]})
            </Label>
            <Input
              id="critical_level"
              type="number"
              step="0.001"
              min="0"
              aria-invalid={!!errors.critical_level}
              aria-describedby={errors.critical_level ? "critical_level-error" : undefined}
              {...register("critical_level")}
            />
            {errors.critical_level && (
              <p id="critical_level-error" className="text-sm text-destructive">
                {errors.critical_level.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="is_active">Aktif</Label>
            <Controller
              control={control}
              name="is_active"
              render={({ field }) => (
                <Switch id="is_active" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="bg-red text-white hover:bg-red-deep">
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
