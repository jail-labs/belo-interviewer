import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { messages, respondentId } = await req.json();

  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
  const filename = `belo-interview-${respondentId || "anon"}-${timestamp}.txt`;

  let transcript = `FRAGRANCE RESEARCH — VALIDATION INTERVIEW\n`;
  transcript += `Respondent: ${respondentId || "Anonymous"}\n`;
  transcript += `Date: ${new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n`;
  transcript += `Topic: Luxury Fragrance Experience & Post-Purchase Innovation\n`;
  transcript += `${"=".repeat(60)}\n\n`;

  for (const msg of messages) {
    const role = msg.role === "assistant" ? "INTERVIEWER" : "RESPONDENT";
    transcript += `[${role}]\n${msg.content}\n\n`;
  }

  transcript += `${"=".repeat(60)}\n`;
  transcript += `END OF TRANSCRIPT\n`;
  transcript += `Total messages: ${messages.length}\n`;
  transcript += `Export time: ${new Date().toISOString()}\n`;

  return new NextResponse(transcript, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
