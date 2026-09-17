import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { StockCountForm } from "./stock-count-form";

export const metadata: Metadata = {
  title: "Gün Sonu Sayımı | Dr.Sosis Operasyon Paneli",
};

export default async function StockCountPage({
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

  const [{ data: items }, { data: balances }, { data: existingCount }] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id, name, category, unit_type")
      .eq("is_active", true)
      .order("category")
      .order("name"),
    supabase
      .from("v_stock_balances")
      .select("inventory_item_id, balance")
      .eq("event_id", id)
      .eq("caravan_id", event.caravan_id),
    supabase
      .from("stock_counts")
      .select("*, stock_count_lines(*)")
      .eq("event_id", id)
      .maybeSingle(),
  ]);

  const theoreticalByItem = new Map((balances ?? []).map((b) => [b.inventory_item_id, b.balance]));

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" render={<Link href={`/events/${id}`} />}>
          <ArrowLeft className="size-4" />
          Etkinliğe Dön
        </Button>
      </div>

      <div>
        <h1 className="font-display text-3xl tracking-wide text-foreground">GÜN SONU SAYIMI</h1>
        <p className="text-muted-foreground">
          {event.name} · {event.caravans?.name}
        </p>
      </div>

      <StockCountForm
        eventId={id}
        items={items ?? []}
        theoreticalByItem={Object.fromEntries(theoreticalByItem)}
        existingCount={existingCount ?? null}
      />
    </div>
  );
}
