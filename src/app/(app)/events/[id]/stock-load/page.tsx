import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { StockLoadForm } from "./stock-load-form";
import { formatDateTR } from "@/lib/datetime";

export const metadata: Metadata = {
  title: "Başlangıç Stoku | Dr.Sosis Operasyon Paneli",
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

  const [{ data: items }, { data: previousCounts }] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("*")
      .eq("is_active", true)
      .order("category")
      .order("name"),
    supabase
      .from("stock_counts")
      .select("id, counted_at, events(name, event_date, caravan_id, caravans(name))")
      .eq("status", "finalized")
      .neq("event_id", id)
      .order("counted_at", { ascending: false })
      .limit(20),
  ]);

  const previousCountOptions = (previousCounts ?? []).map((count) => ({
    id: count.id,
    label: `${count.events?.name ?? "Etkinlik"} — ${
      count.events?.event_date ? formatDateTR(count.events.event_date) : ""
    } (${count.events?.caravans?.name ?? ""})`,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" render={<Link href={`/events/${id}`} />}>
          <ArrowLeft className="size-4" />
          Etkinliğe Dön
        </Button>
      </div>

      <div>
        <h1 className="font-display text-3xl tracking-wide text-foreground">
          BAŞLANGIÇ STOKU
        </h1>
        <p className="text-muted-foreground">
          {event.name} · {event.caravans?.name} karavanına yüklenecek stok.
        </p>
      </div>

      <StockLoadForm
        eventId={id}
        items={items ?? []}
        previousCounts={previousCountOptions}
      />
    </div>
  );
}
