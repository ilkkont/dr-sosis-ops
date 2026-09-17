"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { caravanSchema, CARAVAN_STATUS_LABELS, type CaravanInput } from "@/lib/validations/caravan";
import { createCaravan, updateCaravan } from "./actions";
import type { Database } from "@/types/database";

type Caravan = Database["public"]["Tables"]["caravans"]["Row"];

export function CaravanFormDialog({
  caravan,
  trigger,
}: {
  caravan?: Caravan;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(caravan);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CaravanInput>({
    resolver: zodResolver(caravanSchema),
    defaultValues: {
      name: caravan?.name ?? "",
      plate: caravan?.plate ?? "",
      status: caravan?.status ?? "active",
      description: caravan?.description ?? "",
    },
  });

  async function onSubmit(values: CaravanInput) {
    const result = isEdit
      ? await updateCaravan(caravan!.id, values)
      : await createCaravan(values);

    if (result.success) {
      toast.success(isEdit ? "Karavan güncellendi." : "Karavan oluşturuldu.");
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
          <DialogTitle>{isEdit ? "Karavanı Düzenle" : "Yeni Karavan"}</DialogTitle>
          <DialogDescription>
            Karavan adı, plaka, durum ve açıklama bilgilerini girin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Karavan Adı</Label>
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

          <div className="space-y-2">
            <Label htmlFor="plate">Plaka</Label>
            <Input id="plate" {...register("plate")} placeholder="Opsiyonel" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Durum</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CARAVAN_STATUS_LABELS).map(([value, label]) => (
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
            <Label htmlFor="description">Açıklama</Label>
            <Textarea id="description" {...register("description")} placeholder="Opsiyonel" />
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
