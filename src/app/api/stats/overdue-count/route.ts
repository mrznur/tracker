import { NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { overdueWhereClause } from '@/server/timezone';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const count = await prisma.loan.count({ where: overdueWhereClause() });
  return NextResponse.json({ count });
}
