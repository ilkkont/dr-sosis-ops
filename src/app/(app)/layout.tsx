import Image from "next/image";
import { requireAdmin } from "@/lib/dal";
import { NavLinks } from "@/components/app-shell/nav-links";
import { UserMenu } from "@/components/app-shell/user-menu";
import { MobileNav } from "@/components/app-shell/mobile-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();

  return (
    <div className="flex min-h-full">
      {/* Masaüstü: sabit sol menü */}
      <aside
        data-slot="app-sidebar"
        className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex"
      >
        <div className="p-5">
          <Image
            src="/brand/logo-white.png"
            alt="Dr.Sosis"
            width={160}
            height={80}
            className="h-auto w-32"
          />
        </div>
        <div className="flex flex-1 flex-col justify-between overflow-y-auto p-4 pt-0">
          <NavLinks />
          <UserMenu fullName={profile.full_name} />
        </div>
      </aside>

      <div className="flex min-h-full flex-1 flex-col">
        {/* Mobil: üst bar + drawer */}
        <header
          data-slot="app-mobile-header"
          className="flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 md:hidden"
        >
          <Image
            src="/brand/logo-white.png"
            alt="Dr.Sosis"
            width={120}
            height={60}
            className="h-auto w-24"
          />
          <MobileNav fullName={profile.full_name} />
        </header>

        <main data-slot="app-main" className="flex-1 bg-background p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
