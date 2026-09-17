import { LogOut } from "lucide-react";
import { logout } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(name: string | null) {
  if (!name) return "DR";
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function UserMenu({ fullName }: { fullName: string | null }) {
  return (
    <div className="flex items-center gap-3 rounded-md p-2">
      <Avatar className="size-9 border border-sidebar-border">
        <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground">
          {initials(fullName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-sidebar-foreground">
          {fullName ?? "Admin"}
        </p>
      </div>
      <form action={logout}>
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          aria-label="Çıkış yap"
        >
          <LogOut className="size-4" />
        </Button>
      </form>
    </div>
  );
}
