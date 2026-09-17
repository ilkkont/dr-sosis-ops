"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  salesByDay,
  salesByCaravan,
  salesByEvent,
  salesByProduct,
  topProducts,
  totalSold,
  consumptionByItem,
  topConsumedItems,
  wasteByType,
  wasteByItem,
  significantVariances,
  caravanComparison,
  type SalesLineRow,
  type ConsumptionRow,
  type VarianceRow,
  type WasteRow,
} from "@/lib/reports";
import { formatDateTR } from "@/lib/datetime";
import { toCSV, downloadCSV } from "@/lib/csv";
import { exportReportsExcel } from "./actions";

function GroupTable({
  title,
  rows,
  keyLabel,
}: {
  title: string;
  rows: { key: string; total: number }[];
  keyLabel: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="font-display text-lg tracking-wide text-foreground">{title}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            downloadCSV(
              `${title}.csv`,
              toCSV(rows, [
                { key: "key", label: keyLabel },
                { key: "total", label: "Toplam" },
              ]),
            )
          }
        >
          <Download className="size-4" />
          CSV
        </Button>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Bu aralıkta veri yok.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{keyLabel}</TableHead>
                <TableHead className="text-right">Toplam</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell>{row.key}</TableCell>
                  <TableCell className="text-right font-medium">{row.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export function ReportsView({
  sales,
  consumption,
  variances,
  waste,
}: {
  sales: SalesLineRow[];
  consumption: ConsumptionRow[];
  variances: VarianceRow[];
  waste: WasteRow[];
}) {
  const [exporting, setExporting] = useState(false);

  async function handleExportExcel() {
    setExporting(true);
    try {
      const { base64, filename } = await exportReportsExcel({ sales, consumption, variances, waste });
      const byteChars = atob(base64);
      const bytes = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Excel dosyası oluşturulamadı.");
    } finally {
      setExporting(false);
    }
  }

  const variancesList = significantVariances(variances);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-md border bg-accent p-4">
        <p className="text-sm text-foreground">
          Bu aralıkta toplam <span className="font-medium">{totalSold(sales)}</span> ürün satıldı.
        </p>
        <Button onClick={handleExportExcel} disabled={exporting} variant="outline">
          <FileSpreadsheet className="size-4" />
          {exporting ? "Hazırlanıyor..." : "Excel'e Aktar (tüm raporlar)"}
        </Button>
      </div>

      <GroupTable title="Günlük Satış" rows={salesByDay(sales)} keyLabel="Tarih" />
      <GroupTable title="Karavan Bazlı Satış" rows={salesByCaravan(sales)} keyLabel="Karavan" />
      <GroupTable title="Etkinlik Bazlı Satış" rows={salesByEvent(sales)} keyLabel="Etkinlik" />
      <GroupTable title="Menü Ürünü Bazlı Satış" rows={salesByProduct(sales)} keyLabel="Ürün" />
      <GroupTable title="En Çok Satan Ürünler" rows={topProducts(sales)} keyLabel="Ürün" />
      <GroupTable title="Malzeme Tüketimi" rows={consumptionByItem(consumption)} keyLabel="Malzeme" />
      <GroupTable
        title="En Çok Tüketilen Malzemeler"
        rows={topConsumedItems(consumption)}
        keyLabel="Malzeme"
      />
      <GroupTable title="Fire ve İkram (Türe Göre)" rows={wasteByType(waste)} keyLabel="Tür" />
      <GroupTable title="Fire ve İkram (Malzemeye Göre)" rows={wasteByItem(waste)} keyLabel="Malzeme" />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="font-display text-lg tracking-wide text-foreground">
            Karavan Karşılaştırması
          </h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Karavan</TableHead>
                <TableHead className="text-right">Satış</TableHead>
                <TableHead className="text-right">Tüketim</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {caravanComparison(sales, consumption).map((row) => (
                <TableRow key={row.caravan}>
                  <TableCell>{row.caravan}</TableCell>
                  <TableCell className="text-right font-medium">{row.sold}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{row.consumed}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="font-display text-lg tracking-wide text-foreground">Stok Farkı</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              downloadCSV(
                "stok-farki.csv",
                toCSV(variancesList, [
                  { key: "event_date", label: "Tarih" },
                  { key: "event_name", label: "Etkinlik" },
                  { key: "caravan_name", label: "Karavan" },
                  { key: "item_name", label: "Malzeme" },
                  { key: "variance_qty", label: "Fark" },
                  { key: "variance_pct", label: "Fark %" },
                ]),
              )
            }
          >
            <Download className="size-4" />
            CSV
          </Button>
        </CardHeader>
        <CardContent>
          {variancesList.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bu aralıkta stok farkı yok.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Etkinlik</TableHead>
                  <TableHead>Karavan</TableHead>
                  <TableHead>Malzeme</TableHead>
                  <TableHead className="text-right">Fark</TableHead>
                  <TableHead className="text-right">Fark %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variancesList.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{formatDateTR(row.event_date)}</TableCell>
                    <TableCell>{row.event_name}</TableCell>
                    <TableCell>{row.caravan_name}</TableCell>
                    <TableCell>{row.item_name}</TableCell>
                    <TableCell
                      className={`text-right font-medium ${row.variance_qty < 0 ? "text-destructive" : ""}`}
                    >
                      {row.variance_qty > 0 ? "+" : ""}
                      {row.variance_qty}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row.variance_pct ?? "—"}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
