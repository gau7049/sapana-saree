import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, subject, message } = body;

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = await createClient();

  const { error: dbError } = await supabase.from("contact_messages").insert({
    name,
    email,
    subject: subject || null,
    message,
  });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Send email notification via Resend if configured
  if (process.env.RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Sapana Saree <onboarding@resend.dev>",
          to: ["delivered@resend.dev"],
          subject: `New Contact: ${subject || "No subject"}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ""}
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, "<br>")}</p>
          `,
        }),
      });
    } catch {
      // Email is best-effort, don't fail the request
    }
  }

  return NextResponse.json({ success: true });
}
