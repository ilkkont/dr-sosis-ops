"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
  depotStockEntryFormSchema,
  type DepotStockEntryFormInput,
  type DepotStockEntryInput,
} from "@/lib/validations/depot";
import { baseUnitLabel, supportsKgToggle, toBaseUnit } from "@/lib/units";
import { INVENTORY_CATEGORY_LABELS } from "@/lib/validations/inventory";
import { addDepotStock } from "./actions";
import type { Database } from "@/types/database";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

export function WarehouseStockForm({ items }: { items: InventoryItem[] }) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<DepotStockEntryFormInput, unknown, DepotStockEntryInput>({
    resolver: zodResolver(depotStockEntryFormSchema),
    defaultValues: {
      lines: items.map((item) => ({
        inventory_item_id: item.id,
        quantity: undefined,
        unit_choice: "base",
      })),
      description: "",
    },
  });

  async function onSubmit(values: DepotStockEntryInput) {
    const lines = values.lines
      .filter((line) => line.quantity && line.quantity > 0)
      .map((line) => {
        const item = items.find((i) => i.id === line.inventory_item_id)!;
        return {
          inventory_item_id: line.inventory_item_id,
          quantity_base: toBaseUnit(
            line.quantity!,
            item.unit_type,
            line.unit_choice,
            item.portion_kg_factor,
          ),
        };
      });

    const result = await addDepotStock(lines, values.description || null);

    if (result.success) {
      toast.success("Depoya stok eklendi.");
      reset({
        lines: items.map((item) => ({
          inventory_item_id: item.id,
          quantity: undefined,
          unit_choice: "base",
        })),
        description: "",
      });
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-3">
        {items.map((item, index) => {
          const showCategoryHeader = index === 0 || items[index - 1].category !== item.category;
          return (
            <div key={item.id}>
              {showCategoryHeader && (
                <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground first:mt-0">
                  {INVENTORY_CATEGORY_LABELS[item.category]}
                </p>
              )}
              <div className="flex items-center gap-3 rounded-md border p-3">
                <span className="flex-1 text-sm font-medium">{item.name}</span>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  className="w-28"
                  {...register(`lines.${index}.quantity`)}
                />
                {supportsKgToggle(item.unit_type) ? (
                  <Controller
                    control={control}
                    name={`lines.${index}.unit_choice`}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="base">{baseUnitLabel(item.unit_type)}</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                ) : (
                  <span className="w-28 text-sm text-muted-foreground">
                    {baseUnitLabel(item.unit_type)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Açıklama (opsiyonel)</Label>
        <Textarea id="description" {...register("description")} placeholder="Örn. tedarikçi, fatura no" />
      </div>

      <Button type="submit" disabled={isSubmitting} className="bg-red text-white hover:bg-red-deep">
        {isSubmitting ? "Ekleniyor..." : "Depoya Ekle"}
      </Button>
    </form>
  );
}
