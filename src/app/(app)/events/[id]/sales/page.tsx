import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { SalesForm } from "./sales-form";

export const metadata: Metadata = {
  title: "Satış Girişi | Dr.Sosis Operasyon Paneli",
};

export default async function SalesPage({
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

  const [{ data: products }, { data: latestBatch }, { data: inventoryItems }] = await Promise.all([
    supabase
      .from("menu_products")
      .select("*")
      .eq("is_active", true)
      .order("display_order"),
    supabase
      .from("sales_batches")
      .select("*, sales_lines(menu_product_id, quantity)")
      .eq("event_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("inventory_items").select("id, name"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" render={<Link href={`/events/${id}`} />}>
          <ArrowLeft className="size-4" />
          Etkinliğe Dön
        </Button>
      </div>

      <div>
        <h1 className="font-display text-3xl tracking-wide text-foreground">SATIŞ GİRİŞİ</h1>
        <p className="text-muted-foreground">
          {event.name} · {event.caravans?.name}
        </p>
      </div>

      <SalesForm
        eventId={id}
        products={products ?? []}
        initialBatch={latestBatch ?? null}
        inventoryItems={inventoryItems ?? []}
      />
    </div>
  );
}
