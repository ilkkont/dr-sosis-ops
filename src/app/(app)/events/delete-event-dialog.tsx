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
import { cancelEvent, deleteEventPermanently } from "./actions";

export function DeleteEventDialog({ eventId, eventName }: { eventId: string; eventName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<"cancel" | "delete" | null>(null);

  async function handleCancel() {
    setLoading("cancel");
    const result = await cancelEvent(eventId);
    setLoading(null);
    if (result.success) {
      toast.success("Etkinlik iptal edildi.");
      setOpen(false);
    } else {
      toast.error(result.error);
    }
  }

  async function handleDelete() {
    setLoading("delete");
    const result = await deleteEventPermanently(eventId);
    setLoading(null);
    if (result.success) {
      toast.success("Etkinlik kalıcı olarak silindi.");
      setOpen(false);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Etkinliği Sil">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>&quot;{eventName}&quot; etkinliğini kaldır</DialogTitle>
          <DialogDescription>
            İki seçenek var: <strong>İptal Et</strong> etkinliği pasifleştirir, tüm stok/satış
            geçmişi korunur ve geri alınabilir. <strong>Kalıcı Olarak Sil</strong> ise etkinliği
            ve ona bağlı TÜM stok hareketlerini, satışları ve sayımları veritabanından tamamen
            siler — bu işlem geri alınamaz.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <div className="flex w-full justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Vazgeç
            </Button>
            <Button disabled={loading !== null} variant="secondary" onClick={handleCancel}>
              {loading === "cancel" ? "İptal ediliyor..." : "İptal Et"}
            </Button>
            <Button
              disabled={loading !== null}
              className="bg-red text-white hover:bg-red-deep"
              onClick={handleDelete}
            >
              {loading === "delete" ? "Siliniyor..." : "Kalıcı Olarak Sil"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
