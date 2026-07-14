import { Resend } from "resend";

let resendSingleton: Resend | null = null;

// Lazily constructed so the app still builds/runs without a Resend key —
// only the reminder cron job needs this, and it fails gracefully without one.
function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set. Add it to .env after creating a free Resend account.");
  }
  if (!resendSingleton) {
    resendSingleton = new Resend(process.env.RESEND_API_KEY);
  }
  return resendSingleton;
}

const FROM_ADDRESS = process.env.EMAIL_FROM ?? "Rotanza <onboarding@resend.dev>";

export async function sendReservationReminder(params: {
  to: string;
  title: string;
  type: string;
  date: string;
  time: string | null;
  locale: string;
}) {
  const resend = getResend();
  const isTr = params.locale === "tr";

  const typeLabelTr: Record<string, string> = { flight: "Uçuş", hotel: "Otel", restaurant: "Restoran", activity: "Aktivite" };
  const typeLabelEn: Record<string, string> = { flight: "Flight", hotel: "Hotel", restaurant: "Restaurant", activity: "Activity" };
  const typeLabel = isTr ? (typeLabelTr[params.type] ?? params.type) : (typeLabelEn[params.type] ?? params.type);

  const subject = isTr
    ? `Hatırlatma: ${params.title} yaklaşıyor`
    : `Reminder: ${params.title} is coming up`;

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #042a24;">${isTr ? "Rezervasyon hatırlatması" : "Reservation reminder"}</h2>
      <p style="color: #10201c; font-size: 15px; line-height: 1.5;">
        ${isTr ? "Yaklaşan rezervasyonunuz:" : "Your upcoming reservation:"}
      </p>
      <div style="background: #f4f0e6; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <div style="font-size: 12px; text-transform: uppercase; color: #14ab89; font-weight: 600;">${typeLabel}</div>
        <div style="font-size: 16px; font-weight: 600; color: #042a24; margin-top: 4px;">${params.title}</div>
        <div style="font-size: 14px; color: #6b7d78; margin-top: 4px;">
          ${params.date}${params.time ? " · " + params.time : ""}
        </div>
      </div>
      <p style="color: #6b7d78; font-size: 13px;">Rotanza</p>
    </div>
  `;

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: params.to,
    subject,
    html,
  });
}
