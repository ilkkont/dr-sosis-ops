import { redirect } from "next/navigation";

// "/" her zaman authenticated bir kullanıcı tarafından görülür: proxy.ts,
// oturumu olmayan istekleri zaten "/login" sayfasına yönlendirir.
export default function Home() {
  redirect("/dashboard");
}
