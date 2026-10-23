import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTimeTR } from "@/lib/datetime";
import { formatQuantity, type UnitItem } from "@/lib/units";
import type { Database } from "@/types/database";

type CaravanMovement = Database["public"]["Tables"]["caravan_stock_movements"]["Row"] & {
  inventory_items: (UnitItem & { name: string }) | null;
};

export function CaravanMovementsLog({ movements }: { movements: CaravanMovement[] }) {
  if (movements.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
        Bu karavan için henüz stok hareketi yok.
      </p>
    );
  }

  return (
    <div>
      <h2 className="mb-2 font-display text-xl tracking-wide text-foreground">
        SON STOK GÜNCELLEMELERİ
      </h2>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>Malzeme</TableHead>
              <TableHead className="text-right">Değişim</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell className="text-muted-foreground">
                  {formatDateTimeTR(movement.created_at)}
                </TableCell>
                <TableCell>{movement.inventory_items?.name}</TableCell>
                <TableCell
                  className={`text-right font-medium ${movement.quantity_base < 0 ? "text-destructive" : ""}`}
                >
                  {movement.quantity_base > 0 ? "+" : "-"}
                  {movement.inventory_items
                    ? formatQuantity(movement.inventory_items, Math.abs(movement.quantity_base))
                    : Math.abs(movement.quantity_base)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
