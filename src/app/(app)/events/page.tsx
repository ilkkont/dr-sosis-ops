import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { EventFormDialog } from "./event-form-dialog";
import { EventsTable } from "./events-table";

export const metadata: Metadata = {
  title: "Etkinlikler | Dr.Sosis Operasyon Paneli",
};

export default async function EventsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: events }, { data: caravans }] = await Promise.all([
    supabase
      .from("events")
      .select("*, caravans(name)")
      .order("event_date", { ascending: false })
      .order("start_time", { ascending: false }),
    supabase.from("caravans").select("id, name").eq("status", "active").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-foreground">ETKİNLİKLER</h1>
          <p className="text-muted-foreground">
            Etkinlik oluşturma ve karavan ataması. Aynı karavan çakışan saatlerde iki
            etkinliğe atanamaz.
          </p>
        </div>
        <EventFormDialog
          caravans={caravans ?? []}
          trigger={
            <Button className="bg-red text-white hover:bg-red-deep">
              <Plus className="size-4" />
              Yeni Etkinlik
            </Button>
          }
        />
      </div>

      <EventsTable events={events ?? []} caravans={caravans ?? []} />
    </div>
  );
}
