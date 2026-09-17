import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dr.Sosis Operasyon Paneli",
  description:
    "Dr.Sosis karavanları için stok, satış ve etkinlik operasyon paneli.",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#08090b",
  width: "device-width",
  initialScale: 1,
  // maximumScale kasıtlı olarak sabitlenmedi: WCAG 1.4.4 (Resize Text)
  // kullanıcıların sayfayı %200'e kadar yakınlaştırabilmesini gerektirir;
  // pinch-zoom'u kapatmak düşük görme keskinliğine sahip kullanıcılar için
  // erişilebilirlik ihlalidir.
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${bebas.variable} ${manrope.variable} h-full`}>
      <body className="h-full antialiased">
        {children}
        <Toaster position="top-center" richColors closeButton />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
