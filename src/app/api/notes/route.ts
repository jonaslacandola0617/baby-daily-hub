import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { today } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const all = searchParams.get('all')

    if (all === 'true') {
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
    }

    const targetDate = date || today()
    const note = await prisma.note.findUnique({ where: { date: targetDate } })
    if (!note) {
      return NextResponse.json({ date: targetDate, dailyNotes: null, parentNotes: null })
    }
    return NextResponse.json(note)
  } catch (error) {
    console.error('[NOTES GET]', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const date = body.date || today()
    const note = await prisma.note.upsert({
      where: { date },
      update: {
        ...(body.dailyNotes !== undefined && { dailyNotes: body.dailyNotes }),
        ...(body.parentNotes !== undefined && { parentNotes: body.parentNotes }),
      },
      create: {
        date,
        dailyNotes: body.dailyNotes ?? null,
        parentNotes: body.parentNotes ?? null,
      },
    })
    return NextResponse.json(note)
  } catch (error) {
    console.error('[NOTES PUT]', error)
    return NextResponse.json({ error: 'Failed to update notes' }, { status: 500 })
  }
}
