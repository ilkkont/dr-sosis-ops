import type { Metadata } from "next";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Giriş | Dr.Sosis Operasyon Paneli",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-8 bg-coal px-4 py-12">
      <Image
        src="/brand/logo-white.png"
        alt="Dr.Sosis"
        width={200}
        height={100}
        className="h-auto w-36"
        priority
      />

      <Card className="w-full max-w-sm border-anthracite-3 bg-white">
        <CardHeader>
          <h1 className="font-display text-2xl tracking-wide text-anthracite">
            OPERASYON PANELİ
          </h1>
          <p className="text-sm text-muted-foreground">
            Yalnızca yetkili admin hesapları giriş yapabilir.
          </p>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
