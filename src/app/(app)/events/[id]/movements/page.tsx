import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { MovementForm } from "./movement-form";
import { MovementsLog } from "./movements-log";

export const metadata: Metadata = {
  title: "Stok Hareketleri | Dr.Sosis Operasyon Paneli",
};

export default async function MovementsPage({
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

  const [{ data: items }, { data: otherEvents }, { data: recentMovements }] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("*")
      .eq("is_active", true)
      .order("category")
      .order("name"),
    supabase
      .from("events")
      .select("id, name, event_date, caravan_id, caravans(name)")
      .neq("id", id)
      .in("status", ["preparation", "open"])
      .order("event_date", { ascending: false })
      .limit(30),
    supabase
      .from("stock_movements")
      .select("*, inventory_items(name)")
      .eq("event_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const eventOptions = (otherEvents ?? []).map((e) => ({
    id: e.id,
    label: `${e.name} (${e.caravans?.name ?? ""})`,
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
          STOK HAREKETLERİ
        </h1>
        <p className="text-muted-foreground">
          {event.name} · {event.caravans?.name} — ek giriş, iade, transfer, fire, ikram,
          personel yemeği ve hatalı ürün kayıtları.
        </p>
      </div>

      <MovementForm eventId={id} items={items ?? []} eventOptions={eventOptions} />

      <MovementsLog movements={recentMovements ?? []} />
    </div>
  );
}
