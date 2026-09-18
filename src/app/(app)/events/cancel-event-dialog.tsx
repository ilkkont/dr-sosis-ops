"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cancelEvent } from "./actions";

export function CancelEventDialog({ eventId, eventName }: { eventId: string; eventName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    const result = await cancelEvent(eventId);
    setLoading(false);
    if (result.success) {
      toast.success("Etkinlik iptal edildi.");
      setOpen(false);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Etkinliği İptal Et">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Etkinliği iptal et</DialogTitle>
          <DialogDescription>
            &quot;{eventName}&quot; etkinliği iptal edilecek. Etkinlik kaydı ve geçmişi (stok
            hareketleri, satışlar) silinmez, yalnızca durumu &quot;İptal&quot; olarak
            işaretlenir ve listelerde pasif görünür. Bu işlem geri alınamaz.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Vazgeç
          </Button>
          <Button
            disabled={loading}
            className="bg-red text-white hover:bg-red-deep"
            onClick={handleConfirm}
          >
            {loading ? "İptal ediliyor..." : "Evet, İptal Et"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
