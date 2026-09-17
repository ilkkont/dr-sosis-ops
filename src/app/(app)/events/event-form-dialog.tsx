"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  EVENT_STATUS_LABELS,
  eventFormSchema,
  type EventFormInput,
  type EventInput,
} from "@/lib/validations/event";
import { splitISOToDateAndTime } from "@/lib/datetime";
import { createEvent, updateEvent } from "./actions";
import type { Database } from "@/types/database";

type Event = Database["public"]["Tables"]["events"]["Row"];
type Caravan = Pick<Database["public"]["Tables"]["caravans"]["Row"], "id" | "name">;

export function EventFormDialog({
  event,
  caravans,
  trigger,
}: {
  event?: Event;
  caravans: Caravan[];
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(event);

  const eventStart = event ? splitISOToDateAndTime(event.start_time) : null;
  const eventEnd = event ? splitISOToDateAndTime(event.end_time) : null;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EventFormInput, unknown, EventInput>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      event_date: event?.event_date ?? eventStart?.date ?? "",
      name: event?.name ?? "",
      location: event?.location ?? "",
      caravan_id: event?.caravan_id ?? "",
      start_time: eventStart?.time ?? "",
      end_time: eventEnd?.time ?? "",
      expected_attendance: event?.expected_attendance ?? undefined,
      responsible_person: event?.responsible_person ?? "",
      note: event?.note ?? "",
      status: event?.status ?? "preparation",
    },
  });

  async function onSubmit(values: EventInput) {
    const result = isEdit ? await updateEvent(event!.id, values) : await createEvent(values);

    if (result.success) {
      toast.success(isEdit ? "Etkinlik güncellendi." : "Etkinlik oluşturuldu.");
      setOpen(false);
      if (!isEdit) reset();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next && !isEdit) reset();
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Etkinliği Düzenle" : "Yeni Etkinlik"}</DialogTitle>
          <DialogDescription>
            Tarih, karavan, saat ve etkinlik bilgilerini girin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_date">Tarih</Label>
              <Input
                id="event_date"
                type="date"
                aria-invalid={!!errors.event_date}
                aria-describedby={errors.event_date ? "event_date-error" : undefined}
                {...register("event_date")}
              />
              {errors.event_date && (
                <p id="event_date-error" className="text-sm text-destructive">
                  {errors.event_date.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="caravan_id">Karavan</Label>
              <Controller
                control={control}
                name="caravan_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="caravan_id" className="w-full">
                      <SelectValue placeholder="Karavan seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {caravans.map((caravan) => (
                        <SelectItem key={caravan.id} value={caravan.id}>
                          {caravan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.caravan_id && (
                <p className="text-sm text-destructive">{errors.caravan_id.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Etkinlik Adı</Label>
            <Input
              id="name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              {...register("name")}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Lokasyon</Label>
            <Input id="location" {...register("location")} placeholder="Opsiyonel" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Başlangıç Saati</Label>
              <Input
                id="start_time"
                type="time"
                aria-invalid={!!errors.start_time}
                aria-describedby={errors.start_time ? "start_time-error" : undefined}
                {...register("start_time")}
              />
              {errors.start_time && (
                <p id="start_time-error" className="text-sm text-destructive">
                  {errors.start_time.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">Bitiş Saati</Label>
              <Input
                id="end_time"
                type="time"
                aria-invalid={!!errors.end_time}
                aria-describedby={errors.end_time ? "end_time-error" : undefined}
                {...register("end_time")}
              />
              {errors.end_time && (
                <p id="end_time-error" className="text-sm text-destructive">
                  {errors.end_time.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expected_attendance">Tahmini Katılımcı</Label>
              <Input
                id="expected_attendance"
                type="number"
                min="0"
                {...register("expected_attendance")}
                placeholder="Opsiyonel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EVENT_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible_person">Sorumlu Kişi</Label>
            <Input id="responsible_person" {...register("responsible_person")} placeholder="Opsiyonel" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Not</Label>
            <Textarea id="note" {...register("note")} placeholder="Opsiyonel" />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="bg-red text-white hover:bg-red-deep">
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
