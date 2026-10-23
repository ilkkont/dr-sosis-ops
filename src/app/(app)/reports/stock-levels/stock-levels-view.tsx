"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toCSV, downloadCSV } from "@/lib/csv";
import { exportStockLevelsExcel } from "./actions";

export function StockLevelsView({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  const [exporting, setExporting] = useState(false);

  function handleCSV() {
    const records = rows.map((row) =>
      Object.fromEntries(row.map((cell, index) => [`c${index}`, cell])),
    );
    downloadCSV(
      "stok-durumu.csv",
      toCSV(
        records,
        headers.map((label, index) => ({ key: `c${index}`, label })),
      ),
    );
  }

  async function handleExcel() {
    setExporting(true);
    try {
      const { base64, filename } = await exportStockLevelsExcel({ headers, rows });
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleCSV} disabled={rows.length === 0}>
          <Download className="size-4" />
          CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExcel}
          disabled={exporting || rows.length === 0}
        >
          <FileSpreadsheet className="size-4" />
          {exporting ? "Hazırlanıyor..." : "Excel"}
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Gösterilecek stok kaydı yok.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header, index) => (
                  <TableHead key={header + index} className={index >= 2 ? "text-right" : ""}>
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {row.map((cell, index) => (
                    <TableCell
                      key={index}
                      className={
                        index === 0
                          ? "text-muted-foreground"
                          : index === 1
                            ? "font-medium"
                            : "text-right"
                      }
                    >
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
