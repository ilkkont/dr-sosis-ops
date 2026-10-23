"use client";

import { Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InventoryFormDialog } from "./inventory-form-dialog";
import { UNIT_TYPE_LABELS } from "@/lib/validations/inventory";
import { baseUnitLabel, formatQuantity } from "@/lib/units";
import { categoryName, type InventoryCategory, type ItemWithCategory } from "@/lib/inventory";

export function InventoryTable({
  items,
  categories,
}: {
  items: ItemWithCategory[];
  categories: InventoryCategory[];
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
        Henüz stok kalemi yok.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ad</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Ana Birim</TableHead>
            <TableHead className="hidden md:table-cell">Kritik Seviye</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {categoryName(item)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {item.unit_type === "count" ? baseUnitLabel(item) : UNIT_TYPE_LABELS[item.unit_type]}
                {item.unit_type === "portion" && item.portion_kg_factor
                  ? ` (1 kg = ${item.portion_kg_factor} porsiyon)`
                  : ""}
                {item.unit_type === "weight" && item.unit_label
                  ? item.pack_size
                    ? ` (1 ${item.unit_label} = ${item.pack_size} gram)`
                    : ` (${item.unit_label} — dönüşüm girilmedi)`
                  : ""}
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {formatQuantity(item, item.critical_level)}
              </TableCell>
              <TableCell>
                <Badge variant={item.is_active ? "default" : "secondary"}>
                  {item.is_active ? "Aktif" : "Pasif"}
                </Badge>
              </TableCell>
              <TableCell>
                <InventoryFormDialog
                  item={item}
                  categories={categories}
                  trigger={
                    <Button variant="ghost" size="icon" aria-label="Düzenle">
                      <Pencil className="size-4" />
                    </Button>
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
