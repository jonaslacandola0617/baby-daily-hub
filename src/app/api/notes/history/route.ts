import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const notes = await prisma.note.findMany({
      orderBy: { date: 'desc' },
      where: {
        OR: [
          { dailyNotes: { not: null } },
          { parentNotes: { not: null } },
        ],
      },
    })
    return NextResponse.json(notes)
  } catch (error) {
    console.error('[NOTES HISTORY GET]', error)
    return NextResponse.json({ error: 'Failed to fetch notes history' }, { status: 500 })
  }
}
