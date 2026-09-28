import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTimeTR } from "@/lib/datetime";
import { formatQuantity } from "@/lib/units";
import type { Database } from "@/types/database";

type DepotMovement = Database["public"]["Tables"]["depot_movements"]["Row"] & {
  inventory_items: { name: string; unit_type: Database["public"]["Enums"]["unit_type"]; portion_kg_factor: number | null } | null;
};

const DEPOT_MOVEMENT_TYPE_LABELS: Record<DepotMovement["movement_type"], string> = {
  purchase_in: "Depoya Giriş",
  transfer_out_to_event: "Etkinliğe Gönderildi",
  transfer_in_from_event: "Etkinlikten İade",
};

export function DepotMovementsLog({ movements }: { movements: DepotMovement[] }) {
  if (movements.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
        Henüz depo hareketi yok.
      </p>
    );
  }

  return (
    <div>
      <h2 className="mb-2 font-display text-xl tracking-wide text-foreground">
        SON DEPO HAREKETLERİ
      </h2>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Malzeme</TableHead>
              <TableHead className="text-right">Miktar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell className="text-muted-foreground">
                  {formatDateTimeTR(movement.created_at)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{DEPOT_MOVEMENT_TYPE_LABELS[movement.movement_type]}</Badge>
                </TableCell>
                <TableCell>{movement.inventory_items?.name}</TableCell>
                <TableCell
                  className={`text-right font-medium ${movement.quantity_base < 0 ? "text-destructive" : ""}`}
                >
                  {movement.quantity_base > 0 ? "+" : "-"}
                  {movement.inventory_items
                    ? formatQuantity(
                        movement.inventory_items.unit_type,
                        Math.abs(movement.quantity_base),
                        movement.inventory_items.portion_kg_factor,
                      )
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
