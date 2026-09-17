import { z } from "zod";

export const menuCategorySchema = z.enum(["hotdog", "hotdog_potato", "side", "drink"]);

export const MENU_CATEGORY_LABELS: Record<z.infer<typeof menuCategorySchema>, string> = {
  hotdog: "Hot Dog",
  hotdog_potato: "Hot Dog + Patates",
  side: "Yan Ürün",
  drink: "İçecek",
};

export const menuProductSchema = z.object({
  name: z.string().min(1, { message: "Ad gerekli." }).max(100),
  category: menuCategorySchema,
  display_order: z.coerce.number().int().min(0),
  is_active: z.boolean(),
});

export type MenuProductFormInput = z.input<typeof menuProductSchema>;
export type MenuProductInput = z.output<typeof menuProductSchema>;

export const recipeItemLineSchema = z.object({
  inventory_item_id: z.string().min(1, { message: "Malzeme seçin." }),
  quantity: z.coerce.number().positive({ message: "Miktar 0'dan büyük olmalı." }),
});

export const recipeFormSchema = z.object({
  items: z.array(recipeItemLineSchema),
  notes: z.string().max(300).optional().or(z.literal("")),
});

export type RecipeFormInput = z.input<typeof recipeFormSchema>;
export type RecipeInput = z.output<typeof recipeFormSchema>;
