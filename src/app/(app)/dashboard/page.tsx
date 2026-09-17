import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EVENT_STATUS_LABELS } from "@/lib/validations/event";
import { todayIstanbul, formatDateTR, formatDateTimeTR } from "@/lib/datetime";
import { salesByCaravan, topProducts, totalSold, type SalesLineRow } from "@/lib/reports";

export const metadata: Metadata = {
  title: "Panel | Dr.Sosis Operasyon Paneli",
};

export default async function DashboardPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const today = todayIstanbul();

  const [
    { data: todayEvents },
    { data: openEvents },
    { data: todaySales },
    { data: inventoryItems },
    { data: balances },
    { data: unclosedPastEvents },
    { data: finalizedCounts },
    { data: recentMovements },
  ] = await Promise.all([
    supabase.from("events").select("id, caravan_id, caravans(name)").eq("event_date", today),
    supabase
      .from("events")
      .select("id, name, event_date, caravans(name)")
      .eq("status", "open")
      .order("event_date", { ascending: false }),
    supabase
      .from("sales_lines")
      .select(
        "quantity, menu_products(name), sales_batches!inner(status, events!inner(event_date, caravan_id, caravans(name)))",
      )
      .eq("sales_batches.status", "finalized")
      .eq("sales_batches.events.event_date", today),
    supabase
      .from("inventory_items")
      .select("id, name, critical_level")
      .eq("is_active", true)
      .gt("critical_level", 0),
    supabase.from("v_stock_balances").select("inventory_item_id, event_id, caravan_id, balance"),
    supabase
      .from("events")
      .select("id, name, event_date, caravans(name)")
      .in("status", ["preparation", "open"])
      .lt("event_date", today)
      .order("event_date", { ascending: true }),
    supabase
      .from("stock_counts")
      .select("event_id, events(name, event_date), stock_count_lines(variance_pct)")
      .eq("status", "finalized"),
    supabase
      .from("stock_movements")
      .select("*, inventory_items(name), caravans(name)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const sales: SalesLineRow[] = (todaySales ?? []).map((row) => ({
    quantity: row.quantity,
    event_date: row.sales_batches.events.event_date,
    caravan_name: row.sales_batches.events.caravans?.name ?? "—",
    event_name: "",
    product_name: row.menu_products?.name ?? "—",
  }));

  const workingCaravans = new Map(
    (todayEvents ?? []).map((e) => [e.caravan_id, e.caravans?.name ?? "—"]),
  );

  const criticalAlerts = (balances ?? [])
    .map((b) => {
      const item = (inventoryItems ?? []).find((i) => i.id === b.inventory_item_id);
      if (!item) return null;
      if (b.balance >= item.critical_level) return null;
      return { itemName: item.name, balance: b.balance, criticalLevel: item.critical_level };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  const highVarianceEvents = (finalizedCounts ?? [])
    .map((count) => {
      const worst = count.stock_count_lines.reduce(
        (max, line) => Math.max(max, Math.abs(line.variance_pct ?? 0)),
        0,
      );
      return { eventName: count.events?.name ?? "—", eventDate: count.events?.event_date, worst };
    })
    .filter((c) => c.worst > 10)
    .sort((a, b) => b.worst - a.worst);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-foreground">PANEL</h1>
        <p className="text-muted-foreground">
          Hoş geldiniz, {profile.full_name ?? "Admin"} — {formatDateTR(new Date())} özeti.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <p className="text-sm text-muted-foreground">Bugün Çalışan Karavan</p>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl text-foreground">{workingCaravans.size}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm text-muted-foreground">Açık Etkinlik</p>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl text-foreground">{openEvents?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm text-muted-foreground">Bugünkü Toplam Satış</p>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl text-foreground">{totalSold(sales)} ürün</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-display text-lg tracking-wide text-foreground">
              KARAVAN BAZLI SATIŞ (BUGÜN)
            </h2>
          </CardHeader>
          <CardContent>
            {salesByCaravan(sales).length === 0 ? (
              <p className="text-sm text-muted-foreground">Bugün henüz satış yok.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {salesByCaravan(sales).map((row) => (
                  <li key={row.key} className="flex justify-between">
                    <span>{row.key}</span>
                    <span className="font-medium">{row.total}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-lg tracking-wide text-foreground">
              EN ÇOK SATAN ÜRÜNLER (BUGÜN)
            </h2>
          </CardHeader>
          <CardContent>
            {topProducts(sales, 5).length === 0 ? (
              <p className="text-sm text-muted-foreground">Bugün henüz satış yok.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {topProducts(sales, 5).map((row) => (
                  <li key={row.key} className="flex justify-between">
                    <span>{row.key}</span>
                    <span className="font-medium">{row.total}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-display text-lg tracking-wide text-foreground">
              KRİTİK STOK UYARILARI
            </h2>
          </CardHeader>
          <CardContent>
            {criticalAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Kritik seviyenin altında kalem yok.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {criticalAlerts.map((alert, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{alert.itemName}</span>
                    <span className="font-medium text-destructive">
                      {alert.balance} / {alert.criticalLevel}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-lg tracking-wide text-foreground">
              KAPATILMAMIŞ GEÇMİŞ ETKİNLİKLER
            </h2>
          </CardHeader>
          <CardContent>
            {!unclosedPastEvents || unclosedPastEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bekleyen etkinlik yok.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {unclosedPastEvents.map((event) => (
                  <li key={event.id}>
                    <Link href={`/events/${event.id}`} className="flex justify-between hover:underline">
                      <span>
                        {event.name} ({event.caravans?.name})
                      </span>
                      <span className="text-muted-foreground">{formatDateTR(event.event_date)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {highVarianceEvents.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-display text-lg tracking-wide text-foreground">
              STOK FARKI YÜKSEK ETKİNLİKLER (%10&apos;dan fazla)
            </h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {highVarianceEvents.map((e, i) => (
                <li key={i} className="flex justify-between">
                  <span>
                    {e.eventName} ({e.eventDate ? formatDateTR(e.eventDate) : ""})
                  </span>
                  <span className="font-medium text-destructive">%{e.worst.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-2 font-display text-lg tracking-wide text-foreground">
          SON STOK HAREKETLERİ
        </h2>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Karavan</TableHead>
                <TableHead>Malzeme</TableHead>
                <TableHead className="text-right">Miktar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(recentMovements ?? []).map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="text-muted-foreground">
                    {formatDateTimeTR(movement.created_at)}
                  </TableCell>
                  <TableCell>{movement.caravans?.name}</TableCell>
                  <TableCell>{movement.inventory_items?.name}</TableCell>
                  <TableCell
                    className={`text-right font-medium ${movement.quantity_base < 0 ? "text-destructive" : ""}`}
                  >
                    {movement.quantity_base > 0 ? "+" : ""}
                    {movement.quantity_base}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {openEvents && openEvents.length > 0 && (
        <div>
          <h2 className="mb-2 font-display text-lg tracking-wide text-foreground">
            AÇIK ETKİNLİKLER
          </h2>
          <ul className="space-y-1 text-sm">
            {openEvents.map((event) => (
              <li key={event.id}>
                <Link href={`/events/${event.id}`} className="flex justify-between hover:underline">
                  <span>
                    {event.name} ({event.caravans?.name})
                  </span>
                  <Badge variant="default">{EVENT_STATUS_LABELS.open}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
