"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  stockLoadFormSchema,
  type StockLoadFormInput,
  type StockLoadInput,
} from "@/lib/validations/stock-load";
import {
  defaultUnitChoice,
  formatQuantity,
  fromBaseUnit,
  toBaseUnit,
  unitOptions,
} from "@/lib/units";
import { categoryName, startsNewCategory, type ItemWithCategory } from "@/lib/inventory";
import { updateEventStockFromDepot } from "./actions";

export function StockLoadForm({
  eventId,
  items,
  depotBalanceByItem,
  sentByItem,
}: {
  eventId: string;
  items: ItemWithCategory[];
  depotBalanceByItem: Record<string, number>;
  sentByItem: Record<string, number>;
}) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<StockLoadFormInput, unknown, StockLoadInput>({
    resolver: zodResolver(stockLoadFormSchema),
    defaultValues: {
      lines: items.map((item) => {
        const defaultChoice = defaultUnitChoice(item);
        return {
          inventory_item_id: item.id,
          quantity: fromBaseUnit(sentByItem[item.id] ?? 0, item, defaultChoice),
          unit_choice: defaultChoice,
        };
      }),
    },
  });

  async function onSubmit(values: StockLoadInput) {
    const lines = values.lines.map((line) => {
      const item = items.find((i) => i.id === line.inventory_item_id)!;
      return {
        inventory_item_id: line.inventory_item_id,
        new_total_base: toBaseUnit(line.quantity ?? 0, item, line.unit_choice),
        current_total_base: sentByItem[line.inventory_item_id] ?? 0,
      };
    });

    const result = await updateEventStockFromDepot(eventId, lines);

    if (result.success) {
      toast.success("Stok girişi güncellendi.");
      router.refresh();
      return;
    }

    if ("insufficientItems" in result && result.insufficientItems.length > 0) {
      const names = result.insufficientItems
        .map((entry) => {
          const item = items.find((i) => i.id === entry.inventory_item_id);
          return item ? `${item.name} (depoda ${formatQuantity(item, entry.depot_balance)} var)` : entry.inventory_item_id;
        })
        .join(", ");
      toast.error(`Depoda yeterli stok yok: ${names}`);
      return;
    }

    toast.error(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-3">
        {items.map((item, index) => {
          const showCategoryHeader = startsNewCategory(items, index);
          const options = unitOptions(item);
          const depotBalance = depotBalanceByItem[item.id] ?? 0;
          return (
            <div key={item.id}>
              {showCategoryHeader && (
                <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground first:mt-0">
                  {categoryName(item)}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 rounded-md border p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Depo bakiyesi: {formatQuantity(item, depotBalance)}
                  </p>
                </div>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  className="w-28"
                  {...register(`lines.${index}.quantity`)}
                />
                {options.length > 1 ? (
                  <Controller
                    control={control}
                    name={`lines.${index}.unit_choice`}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                ) : (
                  <span className="w-28 text-sm text-muted-foreground">
                    {options[0].label}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Button type="submit" disabled={isSubmitting} className="bg-red text-white hover:bg-red-deep">
        {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </form>
  );
}
