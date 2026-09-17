import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type VersionRow = {
  id: string;
  version_no: number;
  valid_from: string;
  valid_to: string | null;
  is_active: boolean;
  notes: string | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function RecipeHistory({ versions }: { versions: VersionRow[] }) {
  if (versions.length <= 1) return null;

  return (
    <div>
      <h2 className="mb-2 font-display text-xl tracking-wide text-foreground">
        REÇETE GEÇMİŞİ
      </h2>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Versiyon</TableHead>
              <TableHead>Geçerlilik</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="hidden md:table-cell">Not</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((version) => (
              <TableRow key={version.id}>
                <TableCell className="font-medium">v{version.version_no}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(version.valid_from)} —{" "}
                  {version.valid_to ? formatDate(version.valid_to) : "günümüz"}
                </TableCell>
                <TableCell>
                  <Badge variant={version.is_active ? "default" : "secondary"}>
                    {version.is_active ? "Aktif" : "Geçmiş"}
                  </Badge>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {version.notes ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
