import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

export function initEmailTransporter() {
  if (process.env.NODE_ENV !== "production") {
    console.log("📭 Email disabled for env:", process.env.NODE_ENV);
    return;
  }

  if (transporter) return;

  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASS,
    },
  });

  transporter.verify((error) => {
    if (error) {
      console.error("❌ Email transporter error:", error);
    } else {
      console.log("📨 Email transporter ready (production)");
    }
  });
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (process.env.NODE_ENV !== "production") {
    console.log("📭 Email skipped (env:", process.env.NODE_ENV, ")");
    return;
  }

  if (!transporter) {
    throw new Error("Email transporter not initialized");
  }

  await transporter.sendMail({
    from: `ChitChat <${process.env.EMAIL}>`,
    to,
    subject,
    html,
  });
}
