"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  MOVEMENT_KIND_LABELS,
  movementFormSchema,
  type MovementFormInput,
  type MovementInput,
} from "@/lib/validations/movement";
import { baseUnitLabel, supportsKgToggle } from "@/lib/units";
import { recordMovement } from "./actions";
import type { Database } from "@/types/database";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

export function MovementForm({
  eventId,
  items,
  eventOptions,
}: {
  eventId: string;
  items: InventoryItem[];
  eventOptions: { id: string; label: string }[];
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MovementFormInput, unknown, MovementInput>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      kind: "additional_entry",
      inventory_item_id: "",
      quantity: undefined,
      unit_choice: "base",
      reason: "",
      target_event_id: "",
    },
  });

  const kind = useWatch({ control, name: "kind" });
  const selectedItemId = useWatch({ control, name: "inventory_item_id" });
  const selectedItem = items.find((i) => i.id === selectedItemId);

  async function onSubmit(values: MovementInput) {
    const item = items.find((i) => i.id === values.inventory_item_id);
    if (!item) {
      toast.error("Malzeme seçin.");
      return;
    }

    const result = await recordMovement(eventId, values, {
      unit_type: item.unit_type,
      portion_kg_factor: item.portion_kg_factor,
    });

    if (result.success) {
      toast.success("Hareket kaydedildi.");
      reset({
        kind: values.kind,
        inventory_item_id: "",
        quantity: undefined,
        unit_choice: "base",
        reason: "",
        target_event_id: "",
      });
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-display text-xl tracking-wide text-foreground">YENİ HAREKET</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kind">Hareket Türü</Label>
            <Controller
              control={control}
              name="kind"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="kind" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MOVEMENT_KIND_LABELS).map(([value, label]) => (
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
            <Label htmlFor="inventory_item_id">Malzeme</Label>
            <Controller
              control={control}
              name="inventory_item_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="inventory_item_id" className="w-full">
                    <SelectValue placeholder="Malzeme seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.inventory_item_id && (
              <p className="text-sm text-destructive">{errors.inventory_item_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Miktar</Label>
              <Input
                id="quantity"
                type="number"
                step="0.001"
                min="0"
                aria-invalid={!!errors.quantity}
                aria-describedby={errors.quantity ? "quantity-error" : undefined}
                {...register("quantity")}
              />
              {errors.quantity && (
                <p id="quantity-error" className="text-sm text-destructive">
                  {errors.quantity.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_choice">Birim</Label>
              {selectedItem && supportsKgToggle(selectedItem.unit_type) ? (
                <Controller
                  control={control}
                  name="unit_choice"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="unit_choice" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="base">{baseUnitLabel(selectedItem.unit_type)}</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              ) : (
                <div className="flex h-9 items-center text-sm text-muted-foreground">
                  {selectedItem ? baseUnitLabel(selectedItem.unit_type) : "—"}
                </div>
              )}
            </div>
          </div>

          {kind === "transfer" && (
            <div className="space-y-2">
              <Label htmlFor="target_event_id">Hedef Etkinlik / Karavan</Label>
              <Controller
                control={control}
                name="target_event_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="target_event_id" className="w-full">
                      <SelectValue placeholder="Hedef seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.target_event_id && (
                <p className="text-sm text-destructive">{errors.target_event_id.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Açıklama</Label>
            <Textarea id="reason" {...register("reason")} placeholder="Opsiyonel" />
          </div>

          <Button type="submit" disabled={isSubmitting} className="bg-red text-white hover:bg-red-deep">
            {isSubmitting ? "Kaydediliyor..." : "Hareketi Kaydet"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
