"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Save, ClipboardCheck, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuantityStepper } from "./quantity-stepper";
import { MENU_CATEGORY_LABELS } from "@/lib/validations/menu-product";
import {
  saveDraftSales,
  finalizeSales,
  correctSales,
  type NegativeStockItem,
} from "./actions";
import type { Database } from "@/types/database";

type MenuProduct = Database["public"]["Tables"]["menu_products"]["Row"];
type SalesBatch = Database["public"]["Tables"]["sales_batches"]["Row"] & {
  sales_lines: { menu_product_id: string; quantity: number }[];
};

function draftStorageKey(eventId: string) {
  return `dr-sosis-sales-draft-${eventId}`;
}

function buildInitialQuantities(
  products: MenuProduct[],
  batch: SalesBatch | null,
  eventId: string,
): Record<string, number> {
  const base: Record<string, number> = Object.fromEntries(products.map((p) => [p.id, 0]));

  if (batch) {
    for (const line of batch.sales_lines) {
      base[line.menu_product_id] = line.quantity;
    }
    return base;
  }

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(draftStorageKey(eventId));
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, number>;
        for (const key of Object.keys(base)) {
          if (typeof saved[key] === "number") base[key] = saved[key];
        }
      }
    } catch {
      // localStorage okunamazsa sessizce sıfırdan başla
    }
  }

  return base;
}

export function SalesForm({
  eventId,
  products,
  initialBatch,
  inventoryItems,
}: {
  eventId: string;
  products: MenuProduct[];
  initialBatch: SalesBatch | null;
  inventoryItems: { id: string; name: string }[];
}) {
  const inventoryNameById = useMemo(
    () => new Map(inventoryItems.map((item) => [item.id, item.name])),
    [inventoryItems],
  );
  const isFinalized = initialBatch?.status === "finalized";
  const [editing, setEditing] = useState(!isFinalized);
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    buildInitialQuantities(products, initialBatch, eventId),
  );
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [correctionKey] = useState(() => crypto.randomUUID());
  const [batchId, setBatchId] = useState<string | null>(initialBatch?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [negativeItems, setNegativeItems] = useState<NegativeStockItem[] | null>(null);

  useEffect(() => {
    if (!editing || isFinalized) return;
    try {
      window.localStorage.setItem(draftStorageKey(eventId), JSON.stringify(quantities));
    } catch {
      // yok sayılabilir
    }
  }, [quantities, editing, isFinalized, eventId]);

  const grouped = useMemo(() => {
    const byCategory = new Map<string, MenuProduct[]>();
    for (const product of products) {
      const list = byCategory.get(product.category) ?? [];
      list.push(product);
      byCategory.set(product.category, list);
    }
    return byCategory;
  }, [products]);

  const nonZeroLines = useMemo(
    () =>
      products
        .filter((p) => quantities[p.id] > 0)
        .map((p) => ({ product: p, quantity: quantities[p.id] })),
    [products, quantities],
  );

  const totalItems = nonZeroLines.reduce((sum, line) => sum + line.quantity, 0);

  function setQuantity(productId: string, value: number) {
    setQuantities((prev) => ({ ...prev, [productId]: value }));
  }

  async function handleSaveDraft() {
    setSaving(true);
    const lines = products.map((p) => ({ menu_product_id: p.id, quantity: quantities[p.id] }));
    const result = await saveDraftSales(eventId, idempotencyKey, lines);
    setSaving(false);

    if (result.success) {
      setBatchId(result.batchId);
      try {
        window.localStorage.removeItem(draftStorageKey(eventId));
      } catch {
        // yok sayılabilir
      }
      toast.success("Taslak kaydedildi.");
    } else {
      toast.error(result.error);
    }
  }

  async function handleFinalize(overrideNegative = false) {
    setFinalizing(true);

    // Taslak henüz DB'ye yazılmamışsa önce kaydet.
    let targetBatchId = batchId;
    if (!targetBatchId) {
      const lines = products.map((p) => ({ menu_product_id: p.id, quantity: quantities[p.id] }));
      const draftResult = await saveDraftSales(eventId, idempotencyKey, lines);
      if (!draftResult.success) {
        setFinalizing(false);
        toast.error(draftResult.error);
        return;
      }
      targetBatchId = draftResult.batchId;
      setBatchId(targetBatchId);
    }

    const result = await finalizeSales(eventId, targetBatchId, overrideNegative);
    setFinalizing(false);
    setConfirmOpen(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    if (result.status === "would_go_negative") {
      setNegativeItems(result.items);
      return;
    }

    setNegativeItems(null);
    try {
      window.localStorage.removeItem(draftStorageKey(eventId));
    } catch {
      // yok sayılabilir
    }
    toast.success(
      result.status === "already_finalized"
        ? "Bu satış zaten kesinleşmişti."
        : "Satış kesinleştirildi ve stok tüketimi işlendi.",
    );
    setEditing(false);
  }

  async function handleCorrect(overrideNegative = false) {
    if (!initialBatch) return;
    setFinalizing(true);
    const lines = nonZeroLines.map((line) => ({
      menu_product_id: line.product.id,
      quantity: line.quantity,
    }));
    const result = await correctSales(
      eventId,
      initialBatch.id,
      correctionKey,
      lines,
      overrideNegative,
    );
    setFinalizing(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    if (result.status === "would_go_negative") {
      setNegativeItems(result.items);
      return;
    }
    setNegativeItems(null);
    toast.success("Satış düzeltmesi kesinleştirildi.");
    setEditing(false);
  }

  if (isFinalized && !editing) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h2 className="font-display text-xl tracking-wide text-foreground">
                KESİNLEŞMİŞ SATIŞ
              </h2>
              <p className="text-sm text-muted-foreground">
                Toplam {totalItems} ürün. Değişiklik yapmak için düzeltme akışını kullanın.
              </p>
            </div>
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
              Düzelt
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {nonZeroLines.map((line) => (
                <li key={line.product.id} className="flex justify-between">
                  <span>{line.product.name}</span>
                  <span className="font-medium">{line.quantity}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {isFinalized && (
        <div className="rounded-md border border-red/30 bg-accent p-3 text-sm text-foreground">
          Bu etkinlik için satış zaten kesinleşmiş. Aşağıdaki değişiklikleri kaydettiğinizde eski
          tüketim otomatik olarak tersine çevrilip yeni tutarlar için tüketim oluşturulacak.
        </div>
      )}

      {Array.from(grouped.entries()).map(([category, items]) => (
        <div key={category}>
          <h2 className="mb-2 font-display text-lg tracking-wide text-foreground">
            {MENU_CATEGORY_LABELS[category as MenuProduct["category"]]}
          </h2>
          <div className="space-y-2">
            {items.map((product) => (
              <div
                key={product.id}
                className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm font-medium">{product.name}</span>
                <QuantityStepper
                  value={quantities[product.id] ?? 0}
                  onChange={(v) => setQuantity(product.id, v)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background p-4 shadow-lg md:sticky md:rounded-md md:border">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Toplam <span className="font-medium text-foreground">{totalItems}</span> ürün
          </p>
          <div className="flex gap-2">
            {!isFinalized && (
              <Button variant="outline" disabled={saving} onClick={handleSaveDraft}>
                <Save className="size-4" />
                {saving ? "Kaydediliyor..." : "Taslağı Kaydet"}
              </Button>
            )}
            <Button
              className="bg-red text-white hover:bg-red-deep"
              disabled={totalItems === 0}
              onClick={() => setConfirmOpen(true)}
            >
              <ClipboardCheck className="size-4" />
              {isFinalized ? "Düzeltmeyi Kesinleştir" : "Kesinleştir"}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Satış Özeti</DialogTitle>
            <DialogDescription>
              Kesinleştirmeden önce satılan ürünleri kontrol edin. Kesinleştirme, reçetelere göre
              stok tüketimi oluşturur ve geri alınamaz (yalnızca düzeltme ile telafi edilir).
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">
            {nonZeroLines.map((line) => (
              <li key={line.product.id} className="flex justify-between border-b py-1 last:border-0">
                <span>{line.product.name}</span>
                <span className="font-medium">{line.quantity}</span>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button
              disabled={finalizing}
              className="bg-red text-white hover:bg-red-deep"
              onClick={() => (isFinalized ? handleCorrect() : handleFinalize())}
            >
              {finalizing ? "Kesinleştiriliyor..." : "Onayla ve Kesinleştir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={negativeItems !== null} onOpenChange={(open) => !open && setNegativeItems(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Negatif Stok Uyarısı</DialogTitle>
            <DialogDescription>
              Bu satış aşağıdaki malzemeleri negatif stoğa düşürecek. Yine de devam etmek
              istediğinize emin misiniz? Bu onay audit kaydına işlenir.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-1 text-sm">
            {negativeItems?.map((item) => (
              <li key={item.inventory_item_id} className="flex justify-between">
                <span>{inventoryNameById.get(item.inventory_item_id) ?? item.inventory_item_id}</span>
                <span className="text-destructive">
                  {item.current} elde var, {item.needed} gerekiyor
                </span>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNegativeItems(null)}>
              Vazgeç
            </Button>
            <Button
              disabled={finalizing}
              className="bg-red text-white hover:bg-red-deep"
              onClick={() => (isFinalized ? handleCorrect(true) : handleFinalize(true))}
            >
              Yine de Kesinleştir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
