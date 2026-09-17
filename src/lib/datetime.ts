/**
 * Türkiye 2016'dan beri kalıcı olarak UTC+03:00'te (yaz saati uygulaması
 * yok), bu yüzden Europe/Istanbul dönüşümü için ayrı bir saat dilimi
 * kütüphanesine ihtiyaç duymadan sabit ofset kullanılabilir.
 */
const TR_OFFSET = "+03:00";

/** Europe/Istanbul'da bugünün tarihi, "YYYY-MM-DD" biçiminde. */
export function todayIstanbul(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
}

/** "YYYY-MM-DD" + "HH:mm" (Europe/Istanbul yerel saati) -> UTC ISO string. */
export function combineDateTimeToISO(date: string, time: string): string {
  return new Date(`${date}T${time}:00${TR_OFFSET}`).toISOString();
}

/** Bir UTC ISO string'ini Europe/Istanbul'da "YYYY-MM-DD" ve "HH:mm" alanlarına ayırır. */
export function splitISOToDateAndTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

/** GG.AA.YYYY biçiminde tarih (Europe/Istanbul). */
export function formatDateTR(value: string | Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

/** HH:mm biçiminde saat (Europe/Istanbul). */
export function formatTimeTR(value: string | Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

/** GG.AA.YYYY HH:mm biçiminde tarih + saat (Europe/Istanbul). */
export function formatDateTimeTR(value: string | Date): string {
  return `${formatDateTR(value)} ${formatTimeTR(value)}`;
}
