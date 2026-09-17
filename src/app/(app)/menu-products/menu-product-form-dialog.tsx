"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
  MENU_CATEGORY_LABELS,
  menuProductSchema,
  type MenuProductFormInput,
  type MenuProductInput,
} from "@/lib/validations/menu-product";
import { createMenuProduct, updateMenuProduct } from "./actions";
import type { Database } from "@/types/database";

type MenuProduct = Database["public"]["Tables"]["menu_products"]["Row"];

export function MenuProductFormDialog({
  product,
  trigger,
}: {
  product?: MenuProduct;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(product);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<MenuProductFormInput, unknown, MenuProductInput>({
    resolver: zodResolver(menuProductSchema),
    defaultValues: {
      name: product?.name ?? "",
      category: product?.category ?? "hotdog",
      display_order: product?.display_order ?? 0,
      is_active: product?.is_active ?? true,
    },
  });

  async function onSubmit(values: MenuProductInput) {
    const result = isEdit
      ? await updateMenuProduct(product!.id, values)
      : await createMenuProduct(values);

    if (result.success) {
      toast.success(isEdit ? "Ürün güncellendi." : "Ürün oluşturuldu.");
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
          <DialogTitle>{isEdit ? "Ürünü Düzenle" : "Yeni Menü Ürünü"}</DialogTitle>
          <DialogDescription>Ad, kategori, sıralama ve durum bilgilerini girin.</DialogDescription>
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
                      {Object.entries(MENU_CATEGORY_LABELS).map(([value, label]) => (
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
              <Label htmlFor="display_order">Sıra</Label>
              <Input id="display_order" type="number" min="0" {...register("display_order")} />
            </div>
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
