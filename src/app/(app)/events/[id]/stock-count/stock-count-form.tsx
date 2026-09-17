"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  stockCountFormSchema,
  type StockCountFormInput,
  type StockCountInput,
} from "@/lib/validations/stock-count";
import { finalizeStockCount } from "./actions";
import type { Database } from "@/types/database";

type InventoryItem = Pick<
  Database["public"]["Tables"]["inventory_items"]["Row"],
  "id" | "name" | "category" | "unit_type"
>;
type StockCount = Database["public"]["Tables"]["stock_counts"]["Row"] & {
  stock_count_lines: Database["public"]["Tables"]["stock_count_lines"]["Row"][];
};

function varianceTone(variance: number) {
  if (variance === 0) return "text-muted-foreground";
  return variance < 0 ? "text-destructive" : "text-foreground";
}

export function StockCountForm({
  eventId,
  items,
  theoreticalByItem,
  existingCount,
}: {
  eventId: string;
  items: InventoryItem[];
  theoreticalByItem: Record<string, number>;
  existingCount: StockCount | null;
}) {
  const router = useRouter();
  const isFinalized = existingCount?.status === "finalized";

  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<StockCountFormInput, unknown, StockCountInput>({
    resolver: zodResolver(stockCountFormSchema),
    defaultValues: {
      lines: items.map((item) => {
        const existingLine = existingCount?.stock_count_lines.find(
          (l) => l.inventory_item_id === item.id,
        );
        return {
          inventory_item_id: item.id,
          physical_qty: existingLine?.physical_qty ?? undefined,
          note: existingLine?.note ?? "",
        };
      }),
    },
  });

  const watchedLines = useWatch({ control, name: "lines" });
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function onSubmit(values: StockCountInput) {
    const result = await finalizeStockCount(eventId, values);
    setConfirmOpen(false);
    if (result.success) {
      toast.success("Sayım kesinleştirildi.");
      router.push(`/events/${eventId}/close`);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(() => setConfirmOpen(true))} className="space-y-4">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Malzeme</TableHead>
              <TableHead className="text-right">Teorik Kalan</TableHead>
              <TableHead className="text-right">Fiziksel Kalan</TableHead>
              <TableHead className="text-right">Fark</TableHead>
              <TableHead className="text-right">Fark %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => {
              const theoretical = theoreticalByItem[item.id] ?? 0;
              const physical = watchedLines?.[index]?.physical_qty;
              const hasPhysical = typeof physical === "number" && !Number.isNaN(physical);
              const variance = hasPhysical ? physical - theoretical : null;
              const variancePct =
                hasPhysical && theoretical !== 0 ? ((variance as number) / theoretical) * 100 : null;

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{theoretical}</TableCell>
                  <TableCell className="text-right">
                    {isFinalized ? (
                      hasPhysical ? (
                        (physical as number)
                      ) : (
                        "—"
                      )
                    ) : (
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        className="ml-auto w-28 text-right"
                        {...register(`lines.${index}.physical_qty`)}
                      />
                    )}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${variance !== null ? varianceTone(variance) : ""}`}>
                    {variance !== null ? variance.toFixed(2) : "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {variancePct !== null ? `${variancePct.toFixed(1)}%` : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {isFinalized ? (
        <Badge variant="secondary">Sayım kesinleşti — salt okunur</Badge>
      ) : !confirmOpen ? (
        <Button type="submit" className="bg-red text-white hover:bg-red-deep">
          Sayımı Kesinleştir
        </Button>
      ) : (
        <div className="space-y-3 rounded-md border border-red/30 bg-accent p-4">
          <p className="text-sm text-foreground">
            Sayım kesinleştirildiğinde defter fiziksel gerçekliğe eşitlenir ve bu işlem geri
            alınamaz. Devam etmek istiyor musunuz?
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={isSubmitting}
              className="bg-red text-white hover:bg-red-deep"
              onClick={handleSubmit(onSubmit)}
            >
              {isSubmitting ? "Kesinleştiriliyor..." : "Evet, Kesinleştir"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Vazgeç
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
