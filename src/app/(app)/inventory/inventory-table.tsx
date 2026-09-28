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
import { INVENTORY_CATEGORY_LABELS, UNIT_TYPE_LABELS } from "@/lib/validations/inventory";
import { formatQuantity } from "@/lib/units";
import type { Database } from "@/types/database";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

export function InventoryTable({ items }: { items: InventoryItem[] }) {
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
                {INVENTORY_CATEGORY_LABELS[item.category]}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {UNIT_TYPE_LABELS[item.unit_type]}
                {item.unit_type === "portion" && item.portion_kg_factor
                  ? ` (1 kg = ${item.portion_kg_factor} porsiyon)`
                  : ""}
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {formatQuantity(item.unit_type, item.critical_level, item.portion_kg_factor)}
              </TableCell>
              <TableCell>
                <Badge variant={item.is_active ? "default" : "secondary"}>
                  {item.is_active ? "Aktif" : "Pasif"}
                </Badge>
              </TableCell>
              <TableCell>
                <InventoryFormDialog
                  item={item}
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
