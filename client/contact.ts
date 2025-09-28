// api/contact.ts  (Vercel serverless function)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { name = "", email = "", message = "" } = (req.body ?? {}) as any;
  if (!message || message.length < 5) return res.status(400).json({ ok: false, error: "Message too short" });

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
    });

    await transporter.sendMail({
      from: `"ArmyBuilder Contact" <no-reply@yourdomain.com>`,
      to: process.env.CONTACT_TO!,      // your inbox
      replyTo: email || undefined,
      subject: `Contact form: ${name || "Anonymous"}`,
      text: `From: ${name}\nEmail: ${email}\n\n${message}`,
    });

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
}
