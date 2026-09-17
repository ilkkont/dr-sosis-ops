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
import type { Database } from "@/types/database";

type Movement = Database["public"]["Tables"]["stock_movements"]["Row"] & {
  inventory_items: { name: string } | null;
};

const MOVEMENT_TYPE_LABELS: Record<Movement["movement_type"], string> = {
  initial_load: "Başlangıç Yüklemesi",
  additional_entry: "Ek Stok Girişi",
  return_to_depot: "Depoya İade",
  transfer_out: "Transfer (Çıkış)",
  transfer_in: "Transfer (Giriş)",
  recipe_consumption: "Satış Tüketimi",
  waste: "Fire",
  complimentary: "İkram",
  staff_meal: "Personel Yemeği",
  defective: "Hatalı Ürün",
  count_adjustment: "Sayım Düzeltmesi",
  sale_reversal_adjustment: "Satış Düzeltmesi",
};

export function MovementsLog({ movements }: { movements: Movement[] }) {
  if (movements.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
        Henüz stok hareketi yok.
      </p>
    );
  }

  return (
    <div>
      <h2 className="mb-2 font-display text-xl tracking-wide text-foreground">
        SON HAREKETLER
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
                  <Badge variant="outline">{MOVEMENT_TYPE_LABELS[movement.movement_type]}</Badge>
                </TableCell>
                <TableCell>{movement.inventory_items?.name}</TableCell>
                <TableCell
                  className={`text-right font-medium ${movement.quantity_base < 0 ? "text-destructive" : ""}`}
                >
                  {movement.quantity_base > 0 ? "+" : ""}
                  {movement.quantity_base}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
