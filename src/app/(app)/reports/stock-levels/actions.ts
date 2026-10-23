"use server";

import ExcelJS from "exceljs";
import { requireAdmin } from "@/lib/dal";

export type StockLevelsExport = {
  headers: string[];
  rows: string[][];
};

export async function exportStockLevelsExcel(
  payload: StockLevelsExport,
): Promise<{ base64: string; filename: string }> {
  await requireAdmin();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Dr.Sosis Operasyon Paneli";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Stok Durumu");
  sheet.columns = payload.headers.map((header, index) => ({
    header,
    key: `c${index}`,
    width: index < 2 ? 26 : 18,
  }));
  sheet.addRows(
    payload.rows.map((row) => Object.fromEntries(row.map((cell, index) => [`c${index}`, cell]))),
  );

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `dr-sosis-stok-durumu-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return { base64: Buffer.from(buffer).toString("base64"), filename };
}
