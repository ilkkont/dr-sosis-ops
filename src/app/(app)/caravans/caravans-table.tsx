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
import { CaravanFormDialog } from "./caravan-form-dialog";
import { CARAVAN_STATUS_LABELS } from "@/lib/validations/caravan";
import type { Database } from "@/types/database";

type Caravan = Database["public"]["Tables"]["caravans"]["Row"];

const STATUS_VARIANT: Record<Caravan["status"], "default" | "secondary" | "destructive"> = {
  active: "default",
  maintenance: "secondary",
  inactive: "destructive",
};

export function CaravansTable({ caravans }: { caravans: Caravan[] }) {
  if (caravans.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
        Henüz karavan yok.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ad</TableHead>
            <TableHead>Plaka</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead className="hidden md:table-cell">Açıklama</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {caravans.map((caravan) => (
            <TableRow key={caravan.id}>
              <TableCell className="font-medium">{caravan.name}</TableCell>
              <TableCell className="text-muted-foreground">{caravan.plate ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[caravan.status]}>
                  {CARAVAN_STATUS_LABELS[caravan.status]}
                </Badge>
              </TableCell>
              <TableCell className="hidden max-w-xs truncate text-muted-foreground md:table-cell">
                {caravan.description ?? "—"}
              </TableCell>
              <TableCell>
                <CaravanFormDialog
                  caravan={caravan}
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
