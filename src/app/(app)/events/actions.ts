"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { eventFormSchema, type EventInput } from "@/lib/validations/event";
import { combineDateTimeToISO } from "@/lib/datetime";

export type ActionResult = { success: true } | { success: false; error: string };

function toRow(input: EventInput) {
  return {
    event_date: input.event_date,
    name: input.name,
    location: input.location || null,
    caravan_id: input.caravan_id,
    start_time: combineDateTimeToISO(input.event_date, input.start_time),
    end_time: combineDateTimeToISO(input.event_date, input.end_time),
    expected_attendance: input.expected_attendance ?? null,
    responsible_person: input.responsible_person || null,
    note: input.note || null,
    status: input.status,
  };
}

function friendlyError(code: string | undefined): string {
  // events_no_overlap exclusion constraint ihlali
  if (code === "23P01") {
    return "Bu karavan seçilen zaman aralığında başka bir etkinliğe atanmış. Farklı bir saat veya karavan seçin.";
  }
  return "İşlem gerçekleştirilemedi.";
}

export async function createEvent(input: EventInput): Promise<ActionResult> {
  const profile = await requireAdmin();

  const parsed = eventFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Geçersiz form verisi." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({ ...toRow(parsed.data), created_by: profile.id })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: friendlyError(error?.code) };
  }

  await logAudit(supabase, {
    userId: profile.id,
    action: "event.create",
    entityType: "events",
    entityId: data.id,
    newValue: parsed.data,
  });

  revalidatePath("/events");
  return { success: true };
}

export async function updateEvent(id: string, input: EventInput): Promise<ActionResult> {
  const profile = await requireAdmin();

  const parsed = eventFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Geçersiz form verisi." };
  }

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("events").update(toRow(parsed.data)).eq("id", id);

  if (error) {
    return { success: false, error: friendlyError(error.code) };
  }

  await logAudit(supabase, {
    userId: profile.id,
    action: "event.update",
    entityType: "events",
    entityId: id,
    oldValue: before,
    newValue: parsed.data,
  });

  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
  return { success: true };
}
