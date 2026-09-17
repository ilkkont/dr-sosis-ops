"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { closeEvent } from "./actions";

export function CloseEventButton({
  eventId,
  disabled,
  disabledReason,
}: {
  eventId: string;
  disabled: boolean;
  disabledReason?: string;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleClose() {
    setLoading(true);
    const result = await closeEvent(eventId);
    setLoading(false);
    if (result.success) {
      toast.success("Etkinlik kapatıldı.");
      router.push(`/events/${eventId}`);
    } else {
      toast.error(result.error);
    }
  }

  if (disabled) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        {disabledReason ?? "Etkinlik kapatılamıyor."}
      </div>
    );
  }

  if (!confirmOpen) {
    return (
      <Button className="bg-red text-white hover:bg-red-deep" onClick={() => setConfirmOpen(true)}>
        <Lock className="size-4" />
        Etkinliği Kapat
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-red/30 bg-accent p-4">
      <p className="text-sm text-foreground">
        Etkinlik kapatıldığında durumu &quot;Kapandı&quot; olarak işaretlenir. Emin misiniz?
      </p>
      <div className="flex gap-2">
        <Button
          disabled={loading}
          className="bg-red text-white hover:bg-red-deep"
          onClick={handleClose}
        >
          {loading ? "Kapatılıyor..." : "Evet, Kapat"}
        </Button>
        <Button variant="outline" onClick={() => setConfirmOpen(false)}>
          Vazgeç
        </Button>
      </div>
    </div>
  );
}
