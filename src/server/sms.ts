/**
 * SMS delivery behind an adapter — ARCHITECTURE.md §6. With Twilio env vars set
 * (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM) codes go out as real
 * texts. Without them the pilot runs in on-screen mode: the code is logged
 * server-side and returned to the client, which shows it clearly labelled as
 * pilot behaviour. Flipping to real SMS is configuration, not code.
 */
export type SmsResult = { delivered: boolean; devCode?: string };

export async function sendLoginCode(phone: string, code: string): Promise<SmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;

  if (sid && token && from) {
    const body = new URLSearchParams({
      To: phone,
      From: from,
      Body: `Dashfixe: o seu código é ${code}. Your code is ${code}.`,
    });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    if (!res.ok) throw new Error(`sms provider replied ${res.status}`);
    return { delivered: true };
  }

  console.warn(`[dashfixe pilot] login code for ${phone}: ${code}`);
  return { delivered: false, devCode: code };
}
