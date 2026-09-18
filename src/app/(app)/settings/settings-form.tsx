"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NEGATIVE_STOCK_POLICY_DESCRIPTIONS,
  NEGATIVE_STOCK_POLICY_LABELS,
  type NegativeStockPolicy,
} from "@/lib/validations/settings";
import { updateNegativeStockPolicy } from "./actions";

export function SettingsForm({ negativeStockPolicy }: { negativeStockPolicy: NegativeStockPolicy }) {
  const [value, setValue] = useState(negativeStockPolicy);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: string | null) {
    if (!next) return;
    const previous = value;
    setValue(next as NegativeStockPolicy);
    startTransition(async () => {
      const result = await updateNegativeStockPolicy(next);
      if (result.success) {
        toast.success("Ayar güncellendi.");
      } else {
        setValue(previous);
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Negatif Stok Politikası</CardTitle>
        <CardDescription>
          Bir satış kesinleştirildiğinde teorik stok negatife düşecekse sistemin nasıl
          davranacağını belirler.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Select value={value} onValueChange={handleChange} disabled={isPending}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(NEGATIVE_STOCK_POLICY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {NEGATIVE_STOCK_POLICY_DESCRIPTIONS[value]}
        </p>
      </CardContent>
    </Card>
  );
}
