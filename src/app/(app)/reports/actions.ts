"use server";

import ExcelJS from "exceljs";
import { requireAdmin } from "@/lib/dal";
import type { SalesLineRow, ConsumptionRow, VarianceRow, WasteRow } from "@/lib/reports";

export type ExportPayload = {
  sales: SalesLineRow[];
  consumption: ConsumptionRow[];
  variances: VarianceRow[];
  waste: WasteRow[];
};

export async function exportReportsExcel(
  payload: ExportPayload,
): Promise<{ base64: string; filename: string }> {
  await requireAdmin();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Dr.Sosis Operasyon Paneli";
  workbook.created = new Date();

  const salesSheet = workbook.addWorksheet("Satış");
  salesSheet.columns = [
    { header: "Tarih", key: "event_date", width: 14 },
    { header: "Karavan", key: "caravan_name", width: 16 },
    { header: "Etkinlik", key: "event_name", width: 24 },
    { header: "Ürün", key: "product_name", width: 28 },
    { header: "Adet", key: "quantity", width: 10 },
  ];
  salesSheet.addRows(payload.sales);

  const consumptionSheet = workbook.addWorksheet("Malzeme Tüketimi");
  consumptionSheet.columns = [
    { header: "Tarih", key: "event_date", width: 14 },
    { header: "Karavan", key: "caravan_name", width: 16 },
    { header: "Malzeme", key: "item_name", width: 28 },
    { header: "Tüketim (ana birim)", key: "quantity_base", width: 20 },
  ];
  consumptionSheet.addRows(
    payload.consumption.map((row) => ({ ...row, quantity_base: Math.abs(row.quantity_base) })),
  );

  const varianceSheet = workbook.addWorksheet("Stok Farkı");
  varianceSheet.columns = [
    { header: "Tarih", key: "event_date", width: 14 },
    { header: "Etkinlik", key: "event_name", width: 24 },
    { header: "Karavan", key: "caravan_name", width: 16 },
    { header: "Malzeme", key: "item_name", width: 28 },
    { header: "Fark", key: "variance_qty", width: 12 },
    { header: "Fark %", key: "variance_pct", width: 12 },
  ];
  varianceSheet.addRows(payload.variances);

  const wasteSheet = workbook.addWorksheet("Fire ve İkram");
  wasteSheet.columns = [
    { header: "Tarih", key: "event_date", width: 14 },
    { header: "Karavan", key: "caravan_name", width: 16 },
    { header: "Malzeme", key: "item_name", width: 28 },
    { header: "Tür", key: "waste_type", width: 16 },
    { header: "Miktar", key: "quantity_base", width: 12 },
  ];
  wasteSheet.addRows(payload.waste);

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `dr-sosis-rapor-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return { base64: Buffer.from(buffer).toString("base64"), filename };
}
