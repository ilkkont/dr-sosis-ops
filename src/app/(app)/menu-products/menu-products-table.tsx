"use client";

import Link from "next/link";
import { Pencil, ChefHat } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MenuProductFormDialog } from "./menu-product-form-dialog";
import { MENU_CATEGORY_LABELS } from "@/lib/validations/menu-product";
import type { Database } from "@/types/database";

type MenuProduct = Database["public"]["Tables"]["menu_products"]["Row"];

export function MenuProductsTable({ products }: { products: MenuProduct[] }) {
  if (products.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
        Henüz menü ürünü yok.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ad</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {MENU_CATEGORY_LABELS[product.category]}
              </TableCell>
              <TableCell>
                <Badge variant={product.is_active ? "default" : "secondary"}>
                  {product.is_active ? "Aktif" : "Pasif"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Reçete"
                    render={<Link href={`/menu-products/${product.id}/recipe`} />}
                  >
                    <ChefHat className="size-4" />
                  </Button>
                  <MenuProductFormDialog
                    product={product}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Düzenle">
                        <Pencil className="size-4" />
                      </Button>
                    }
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
