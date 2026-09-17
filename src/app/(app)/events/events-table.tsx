"use client";

import Link from "next/link";
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
import { EventFormDialog } from "./event-form-dialog";
import { EVENT_STATUS_LABELS } from "@/lib/validations/event";
import { formatDateTR, formatTimeTR } from "@/lib/datetime";
import type { Database } from "@/types/database";

type Event = Database["public"]["Tables"]["events"]["Row"] & {
  caravans: { name: string } | null;
};
type Caravan = Pick<Database["public"]["Tables"]["caravans"]["Row"], "id" | "name">;

const STATUS_VARIANT: Record<Event["status"], "default" | "secondary" | "destructive" | "outline"> = {
  preparation: "outline",
  open: "default",
  closed: "secondary",
  cancelled: "destructive",
};

export function EventsTable({ events, caravans }: { events: Event[]; caravans: Caravan[] }) {
  if (events.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
        Henüz etkinlik yok.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tarih</TableHead>
            <TableHead>Etkinlik</TableHead>
            <TableHead>Karavan</TableHead>
            <TableHead className="hidden md:table-cell">Saat</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="font-medium">{formatDateTR(event.event_date)}</TableCell>
              <TableCell>
                <Link href={`/events/${event.id}`} className="hover:underline">
                  {event.name}
                </Link>
                {event.location && (
                  <p className="text-xs text-muted-foreground">{event.location}</p>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{event.caravans?.name ?? "—"}</TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {formatTimeTR(event.start_time)}–{formatTimeTR(event.end_time)}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[event.status]}>
                  {EVENT_STATUS_LABELS[event.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <EventFormDialog
                  event={event}
                  caravans={caravans}
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
