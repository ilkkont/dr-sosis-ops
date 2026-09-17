"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";

export function MobileNav({ fullName }: { fullName: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label="Menüyü aç"
          />
        }
      >
        <Menu className="size-6" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
      >
        <SheetHeader className="border-b border-sidebar-border">
          <SheetTitle className="sr-only">Gezinme menüsü</SheetTitle>
          <Image
            src="/brand/logo-white.png"
            alt="Dr.Sosis"
            width={140}
            height={70}
            className="h-auto w-28"
          />
        </SheetHeader>
        <div className="flex h-[calc(100%-5rem)] flex-col justify-between p-4">
          <NavLinks onNavigate={() => setOpen(false)} />
          <UserMenu fullName={fullName} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
