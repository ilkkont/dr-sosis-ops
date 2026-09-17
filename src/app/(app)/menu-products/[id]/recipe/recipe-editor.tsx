"use client";

import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  recipeFormSchema,
  type RecipeFormInput,
  type RecipeInput,
} from "@/lib/validations/menu-product";
import { UNIT_TYPE_LABELS } from "@/lib/validations/inventory";
import { saveRecipeVersion } from "../../actions";

type InventoryItemOption = {
  id: string;
  name: string;
  unit_type: "count" | "weight" | "portion";
};

export function RecipeEditor({
  menuProductId,
  inventoryItems,
  activeItems,
  activeNotes,
}: {
  menuProductId: string;
  inventoryItems: InventoryItemOption[];
  activeItems: { inventory_item_id: string; quantity: number }[];
  activeNotes: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RecipeFormInput, unknown, RecipeInput>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      items: activeItems.length > 0 ? activeItems : [],
      notes: activeNotes,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const itemById = new Map(inventoryItems.map((item) => [item.id, item]));

  async function onSubmit(values: RecipeInput) {
    const result = await saveRecipeVersion(menuProductId, values);
    setConfirmOpen(false);
    if (result.success) {
      toast.success("Yeni reçete versiyonu kaydedildi.");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-display text-xl tracking-wide text-foreground">
          AKTİF REÇETE
        </h2>
        <p className="text-sm text-muted-foreground">
          Kaydettiğinizde yeni bir versiyon açılır; geçmiş satışlar eski
          versiyonu kullanmaya devam eder, bozulmaz.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(() => setConfirmOpen(true))} className="space-y-4">
          <div className="space-y-3">
            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Bu üründe henüz malzeme tanımlı değil.
              </p>
            )}
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label>Malzeme</Label>
                  <Controller
                    control={control}
                    name={`items.${index}.inventory_item_id`}
                    render={({ field: selectField }) => (
                      <Select value={selectField.value} onValueChange={selectField.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Malzeme seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventoryItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="w-32 space-y-2">
                  <Label>
                    Miktar
                    {itemById.get(field.inventory_item_id)
                      ? ` (${UNIT_TYPE_LABELS[itemById.get(field.inventory_item_id)!.unit_type]})`
                      : ""}
                  </Label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    {...register(`items.${index}.quantity`)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Malzemeyi kaldır"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {errors.items && (
              <p className="text-sm text-destructive">Tüm satırlarda malzeme ve miktar seçilmeli.</p>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => append({ inventory_item_id: "", quantity: 1 })}
          >
            <Plus className="size-4" />
            Malzeme Ekle
          </Button>

          <div className="space-y-2">
            <Label htmlFor="notes">Not (opsiyonel)</Label>
            <Textarea id="notes" {...register("notes")} placeholder="Bu versiyon hakkında not" />
          </div>

          {!confirmOpen ? (
            <Button type="submit" className="bg-red text-white hover:bg-red-deep">
              Yeni Versiyon Olarak Kaydet
            </Button>
          ) : (
            <div className="space-y-3 rounded-md border border-red/30 bg-accent p-4">
              <p className="text-sm text-foreground">
                {fields.length} malzeme ile yeni bir reçete versiyonu açılacak. Emin misiniz?
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={isSubmitting}
                  className="bg-red text-white hover:bg-red-deep"
                  onClick={handleSubmit(onSubmit)}
                >
                  {isSubmitting ? "Kaydediliyor..." : "Evet, Kaydet"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
                  Vazgeç
                </Button>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
