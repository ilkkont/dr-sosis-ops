"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function QuantityStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Input
        type="number"
        min="0"
        value={value === 0 ? "" : value}
        onChange={(e) => onChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
        placeholder="0"
        className="h-10 w-16 text-center"
      />
      <Button type="button" variant="outline" size="sm" className="h-10" onClick={() => onChange(value + 1)}>
        +1
      </Button>
      <Button type="button" variant="outline" size="sm" className="h-10" onClick={() => onChange(value + 5)}>
        +5
      </Button>
      <Button type="button" variant="outline" size="sm" className="h-10" onClick={() => onChange(value + 10)}>
        +10
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-10 text-muted-foreground"
        onClick={() => onChange(0)}
      >
        Sıfırla
      </Button>
    </div>
  );
}
