import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Package, ShoppingCart, ArrowLeftRight, ClipboardList, Lock } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EVENT_STATUS_LABELS } from "@/lib/validations/event";
import { formatDateTR, formatTimeTR } from "@/lib/datetime";
import { formatQuantity } from "@/lib/units";

export const metadata: Metadata = {
  title: "Etkinlik Detayı | Dr.Sosis Operasyon Paneli",
};

const STATUS_VARIANT = {
  preparation: "outline",
  open: "default",
  closed: "secondary",
  cancelled: "destructive",
} as const;

export default async function EventDetailPage({
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

  const { data: balances } = await supabase
    .from("v_stock_balances")
    .select("inventory_item_id, balance, inventory_items(name, unit_type, portion_kg_factor)")
    .eq("event_id", id)
    .eq("caravan_id", event.caravan_id);

  const nonZeroBalances = (balances ?? []).filter((b) => b.balance !== 0);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" render={<Link href="/events" />}>
          <ArrowLeft className="size-4" />
          Etkinliklere Dön
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-foreground">
            {event.name.toUpperCase()}
          </h1>
          <p className="text-muted-foreground">
            {formatDateTR(event.event_date)} · {formatTimeTR(event.start_time)}–
            {formatTimeTR(event.end_time)} · {event.caravans?.name}
            {event.location ? ` · ${event.location}` : ""}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[event.status]} className="text-sm">
          {EVENT_STATUS_LABELS[event.status]}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Button
          variant="outline"
          className="h-auto justify-start gap-3 py-4"
          render={<Link href={`/events/${event.id}/stock-load`} />}
        >
          <Package className="size-5" />
          <div className="text-left">
            <p className="font-medium">Stok Girişi</p>
            <p className="text-xs text-muted-foreground">Depodan gönder / düzenle</p>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto justify-start gap-3 py-4"
          render={<Link href={`/events/${event.id}/sales`} />}
        >
          <ShoppingCart className="size-5" />
          <div className="text-left">
            <p className="font-medium">Satış Girişi</p>
            <p className="text-xs text-muted-foreground">Gün sonu satış adetlerini gir</p>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto justify-start gap-3 py-4"
          render={<Link href={`/events/${event.id}/movements`} />}
        >
          <ArrowLeftRight className="size-5" />
          <div className="text-left">
            <p className="font-medium">Stok Hareketleri</p>
            <p className="text-xs text-muted-foreground">Transfer, fire, ikram, iade</p>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto justify-start gap-3 py-4"
          render={<Link href={`/events/${event.id}/stock-count`} />}
        >
          <ClipboardList className="size-5" />
          <div className="text-left">
            <p className="font-medium">Gün Sonu Sayımı</p>
            <p className="text-xs text-muted-foreground">Teorik / fiziksel fark</p>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto justify-start gap-3 py-4"
          render={<Link href={`/events/${event.id}/close`} />}
        >
          <Lock className="size-5" />
          <div className="text-left">
            <p className="font-medium">Etkinliği Kapat</p>
            <p className="text-xs text-muted-foreground">Özet ve kapatma onayı</p>
          </div>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-display text-xl tracking-wide text-foreground">
            GÜNCEL STOK BAKİYESİ
          </h2>
        </CardHeader>
        <CardContent>
          {nonZeroBalances.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Bu etkinlikte henüz stok hareketi yok.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Malzeme</TableHead>
                    <TableHead className="text-right">Bakiye</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nonZeroBalances.map((row) => (
                    <TableRow key={row.inventory_item_id}>
                      <TableCell>{row.inventory_items?.name}</TableCell>
                      <TableCell className="text-right font-medium">
                        {row.inventory_items
                          ? formatQuantity(
                              row.inventory_items.unit_type,
                              row.balance,
                              row.inventory_items.portion_kg_factor,
                            )
                          : row.balance}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
