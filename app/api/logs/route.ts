import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(logger.getLogs());
}

export async function DELETE() {
  logger.clear();
  return NextResponse.json({ success: true });
}
