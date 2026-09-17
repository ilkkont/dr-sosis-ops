import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CloseEventButton } from "./close-event-button";
import { PrintButton } from "@/components/print-button";

export const metadata: Metadata = {
  title: "Etkinliği Kapat | Dr.Sosis Operasyon Paneli",
};

const WASTE_TYPE_LABELS: Record<string, string> = {
  fire: "Fire",
  complimentary: "İkram",
  staff_meal: "Personel Yemeği",
  defective: "Hatalı Ürün",
};

export default async function CloseEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!event) {
    notFound();
  }

  const [{ data: salesBatch }, { data: wasteRecords }, { data: stockCount }] = await Promise.all([
    supabase
      .from("sales_batches")
      .select("*, sales_lines(quantity, menu_products(name))")
      .eq("event_id", id)
      .eq("status", "finalized")
      .maybeSingle(),
    supabase
      .from("waste_records")
      .select("*, inventory_items(name)")
      .eq("event_id", id),
    supabase
      .from("stock_counts")
      .select("*, stock_count_lines(*, inventory_items(name))")
      .eq("event_id", id)
      .maybeSingle(),
  ]);

  const isCountFinalized = stockCount?.status === "finalized";
  const alreadyClosed = event.status === "closed";
  const totalSold = (salesBatch?.sales_lines ?? []).reduce((sum, l) => sum + l.quantity, 0);
  const nonZeroVariances = (stockCount?.stock_count_lines ?? []).filter(
    (l) => l.variance_qty !== 0,
  );

  let disabledReason: string | undefined;
  if (alreadyClosed) disabledReason = "Bu etkinlik zaten kapatılmış.";
  else if (event.status === "cancelled") disabledReason = "İptal edilmiş bir etkinlik kapatılamaz.";
  else if (!isCountFinalized)
    disabledReason = "Kapatmadan önce gün sonu sayımını kesinleştirmelisiniz.";

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between">
        <Button variant="ghost" size="sm" render={<Link href={`/events/${id}`} />}>
          <ArrowLeft className="size-4" />
          Etkinliğe Dön
        </Button>
        <PrintButton />
      </div>

      <div>
        <h1 className="font-display text-3xl tracking-wide text-foreground">
          ETKİNLİĞİ KAPAT
        </h1>
        <p className="text-muted-foreground">{event.name} — gün sonu raporu özeti.</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg tracking-wide text-foreground">SATIŞ ÖZETİ</h2>
        </CardHeader>
        <CardContent>
          {!salesBatch ? (
            <p className="text-sm text-muted-foreground">Kesinleşmiş satış yok.</p>
          ) : (
            <>
              <p className="mb-2 text-sm text-muted-foreground">Toplam {totalSold} ürün satıldı.</p>
              <ul className="space-y-1 text-sm">
                {salesBatch.sales_lines
                  .filter((l) => l.quantity > 0)
                  .map((line, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{line.menu_products?.name}</span>
                      <span className="font-medium">{line.quantity}</span>
                    </li>
                  ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg tracking-wide text-foreground">
            FİRE VE İKRAM ÖZETİ
          </h2>
        </CardHeader>
        <CardContent>
          {!wasteRecords || wasteRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">Fire veya ikram kaydı yok.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {wasteRecords.map((record) => (
                <li key={record.id} className="flex justify-between">
                  <span>
                    {record.inventory_items?.name} —{" "}
                    <span className="text-muted-foreground">
                      {WASTE_TYPE_LABELS[record.waste_type]}
                    </span>
                  </span>
                  <span className="font-medium">{record.quantity_base}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg tracking-wide text-foreground">
            FİZİKSEL SAYIM FARKI
          </h2>
        </CardHeader>
        <CardContent>
          {!isCountFinalized ? (
            <p className="text-sm text-muted-foreground">Sayım henüz kesinleşmemiş.</p>
          ) : nonZeroVariances.length === 0 ? (
            <p className="text-sm text-muted-foreground">Fark yok — teorik ve fiziksel eşit.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {nonZeroVariances.map((line) => (
                <li key={line.id} className="flex justify-between">
                  <span>{line.inventory_items?.name}</span>
                  <span
                    className={`font-medium ${line.variance_qty < 0 ? "text-destructive" : ""}`}
                  >
                    {line.variance_qty > 0 ? "+" : ""}
                    {line.variance_qty} ({line.variance_pct ?? 0}%)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="no-print">
        <CloseEventButton
          eventId={id}
          disabled={Boolean(disabledReason)}
          disabledReason={disabledReason}
        />
      </div>
    </div>
  );
}
