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
import { defaultUnitChoice, fromBaseUnit, toBaseUnit, unitOptions } from "@/lib/units";
import { categoryName, startsNewCategory, type ItemWithCategory } from "@/lib/inventory";
import { setCaravanStock } from "./actions";

export function CaravanStockForm({
  caravanId,
  items,
  balanceByItem,
}: {
  caravanId: string;
  items: ItemWithCategory[];
  balanceByItem: Record<string, number>;
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
        const choice = defaultUnitChoice(item);
        return {
          inventory_item_id: item.id,
          quantity: fromBaseUnit(balanceByItem[item.id] ?? 0, item, choice),
          unit_choice: choice,
        };
      }),
    },
  });

  async function onSubmit(values: StockLoadInput) {
    const changed = values.lines
      .map((line) => {
        const item = items.find((i) => i.id === line.inventory_item_id)!;
        return {
          inventory_item_id: line.inventory_item_id,
          new_total_base: toBaseUnit(line.quantity ?? 0, item, line.unit_choice),
          current: balanceByItem[line.inventory_item_id] ?? 0,
        };
      })
      .filter((line) => Math.abs(line.new_total_base - line.current) > 0.0005)
      .map(({ inventory_item_id, new_total_base }) => ({ inventory_item_id, new_total_base }));

    if (changed.length === 0) {
      toast.info("Değişiklik yok.");
      return;
    }

    const result = await setCaravanStock(caravanId, changed);
    if (result.success) {
      toast.success(`Karavan stoğu güncellendi (${result.changed} kalem).`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-3">
        {items.map((item, index) => {
          const options = unitOptions(item);
          return (
            <div key={item.id}>
              {startsNewCategory(items, index) && (
                <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground first:mt-0">
                  {categoryName(item)}
                </p>
              )}
              <div className="flex items-center gap-3 rounded-md border p-3">
                <span className="flex-1 text-sm font-medium">{item.name}</span>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  className="w-28"
                  aria-label={`${item.name} miktarı`}
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
                  <span className="w-28 text-sm text-muted-foreground">{options[0].label}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Button type="submit" disabled={isSubmitting} className="bg-red text-white hover:bg-red-deep">
        {isSubmitting ? "Kaydediliyor..." : "Karavan Stoğunu Kaydet"}
      </Button>
    </form>
  );
}
