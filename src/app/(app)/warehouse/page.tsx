import type { Metadata } from "next";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { INVENTORY_CATEGORY_LABELS } from "@/lib/validations/inventory";
import { formatQuantity } from "@/lib/units";
import { WarehouseStockForm } from "./warehouse-stock-form";
import { DepotMovementsLog } from "./depot-movements-log";

export const metadata: Metadata = {
  title: "Ana Depo | Dr.Sosis Operasyon Paneli",
};

export default async function WarehousePage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: items }, { data: balances }, { data: movements }] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("*")
      .eq("is_active", true)
      .order("category")
      .order("name"),
    supabase.from("v_depot_balances").select("inventory_item_id, balance"),
    supabase
      .from("depot_movements")
      .select("*, inventory_items(name, unit_type, portion_kg_factor)")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const balanceByItem = new Map((balances ?? []).map((b) => [b.inventory_item_id, b.balance]));
  const nonZeroItems = (items ?? []).filter((item) => (balanceByItem.get(item.id) ?? 0) !== 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-foreground">ANA DEPO</h1>
        <p className="text-muted-foreground">
          Tüm satın alınan stok buraya girilir; etkinliklere buradan gönderilir.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-display text-xl tracking-wide text-foreground">DEPO BAKİYESİ</h2>
        </CardHeader>
        <CardContent>
          {nonZeroItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Depoda henüz stok yok.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Malzeme</TableHead>
                    <TableHead className="text-right">Bakiye</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nonZeroItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground">
                        {INVENTORY_CATEGORY_LABELS[item.category]}
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">
                        {formatQuantity(
                          item.unit_type,
                          balanceByItem.get(item.id) ?? 0,
                          item.portion_kg_factor,
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-display text-xl tracking-wide text-foreground">DEPOYA STOK EKLE</h2>
        </CardHeader>
        <CardContent>
          <WarehouseStockForm items={items ?? []} />
        </CardContent>
      </Card>

      <DepotMovementsLog movements={movements ?? []} />
    </div>
  );
}
