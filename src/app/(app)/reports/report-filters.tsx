"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ReportFilters({
  caravans,
  from,
  to,
  caravanId,
}: {
  caravans: { id: string; name: string }[];
  from: string;
  to: string;
  caravanId: string;
}) {
  const router = useRouter();
  const [fromValue, setFromValue] = useState(from);
  const [toValue, setToValue] = useState(to);
  const [caravanValue, setCaravanValue] = useState(caravanId);

  function apply() {
    const params = new URLSearchParams();
    params.set("from", fromValue);
    params.set("to", toValue);
    if (caravanValue !== "all") params.set("caravan", caravanValue);
    router.push(`/reports?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-md border p-4">
      <div className="space-y-2">
        <Label htmlFor="from">Başlangıç</Label>
        <Input id="from" type="date" value={fromValue} onChange={(e) => setFromValue(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="to">Bitiş</Label>
        <Input id="to" type="date" value={toValue} onChange={(e) => setToValue(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="caravan">Karavan</Label>
        <Select value={caravanValue} onValueChange={(value) => setCaravanValue(value ?? "all")}>
          <SelectTrigger id="caravan" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Karavanlar</SelectItem>
            {caravans.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={apply} className="bg-red text-white hover:bg-red-deep">
        Uygula
      </Button>
    </div>
  );
}
