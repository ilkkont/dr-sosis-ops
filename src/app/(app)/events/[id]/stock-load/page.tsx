import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { StockLoadForm } from "./stock-load-form";

export const metadata: Metadata = {
  title: "Stok Girişi | Dr.Sosis Operasyon Paneli",
};

export default async function StockLoadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*, caravans(name)")
    .eq("id", id)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  const [{ data: items }, { data: depotBalances }, { data: sentMovements }] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("*")
      .eq("is_active", true)
      .order("category")
      .order("name"),
    supabase.from("v_depot_balances").select("inventory_item_id, balance"),
    supabase
      .from("stock_movements")
      .select("inventory_item_id, quantity_base")
      .eq("event_id", id)
      .eq("source_type", "depot"),
  ]);

  const depotBalanceByItem = new Map(
    (depotBalances ?? []).map((b) => [b.inventory_item_id, b.balance]),
  );

  const sentByItem = new Map<string, number>();
  for (const movement of sentMovements ?? []) {
    sentByItem.set(
      movement.inventory_item_id,
      (sentByItem.get(movement.inventory_item_id) ?? 0) + movement.quantity_base,
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" render={<Link href={`/events/${id}`} />}>
          <ArrowLeft className="size-4" />
          Etkinliğe Dön
        </Button>
      </div>

      <div>
        <h1 className="font-display text-3xl tracking-wide text-foreground">STOK GİRİŞİ</h1>
        <p className="text-muted-foreground">
          {event.name} · {event.caravans?.name} karavanına Ana Depo&apos;dan stok gönderin.
          Miktarları değiştirip kaydederek daha önce gönderdiğiniz stoğu da düzenleyebilirsiniz.
        </p>
      </div>

      <StockLoadForm
        eventId={id}
        items={items ?? []}
        depotBalanceByItem={Object.fromEntries(depotBalanceByItem)}
        sentByItem={Object.fromEntries(sentByItem)}
      />
    </div>
  );
}
