import { webhookCallback } from "grammy";
import { bot } from "@/lib/bot";
import { NextRequest, NextResponse } from "next/server";

// Using grammy's built-in webhook callback adapter for web standards (Next.js App Router compatible)
const handleUpdate = webhookCallback(bot, "std/http");

export const maxDuration = 60; // Set Vercel function max duration if needed, 60s for slow AI responses
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Convert NextRequest to standard Request object if needed, but NextRequest IS a standard Request
    const response = await handleUpdate(req);
    return response;
  } catch (error) {
    console.error("Webhook route encountered an error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// A simple GET endpoint to check if the webhook route is live
export async function GET() {
  return NextResponse.json({ status: "Webhook endpoint is live. Use POST to send Telegram updates." });
}
