import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { today } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || today()
    const tracker = await prisma.dailyTracker.findUnique({ where: { date } })
    if (!tracker) {
      return NextResponse.json({ date, sleepHours: 11, napHours: 1.5, waterCups: 0, diaperCount: 0, temperature: null, weight: null, medicine: null, mood: null })
    }
    return NextResponse.json(tracker)
  } catch (error) {
    console.error('[TRACKER GET]', error)
    return NextResponse.json({ error: 'Failed to fetch tracker' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const date = body.date || today()
    const tracker = await prisma.dailyTracker.upsert({
      where: { date },
      update: {
        ...(body.sleepHours !== undefined && { sleepHours: body.sleepHours }),
        ...(body.napHours !== undefined && { napHours: body.napHours }),
        ...(body.waterCups !== undefined && { waterCups: body.waterCups }),
        ...(body.diaperCount !== undefined && { diaperCount: body.diaperCount }),
        ...(body.temperature !== undefined && { temperature: body.temperature }),
        ...(body.weight !== undefined && { weight: body.weight }),
        ...(body.medicine !== undefined && { medicine: body.medicine }),
        ...(body.mood !== undefined && { mood: body.mood }),
      },
      create: {
        date,
        sleepHours: body.sleepHours ?? 11,
        napHours: body.napHours ?? 1.5,
        waterCups: body.waterCups ?? 0,
        diaperCount: body.diaperCount ?? 0,
        temperature: body.temperature ?? null,
        weight: body.weight ?? null,
        medicine: body.medicine ?? null,
        mood: body.mood ?? null,
      },
    })
    return NextResponse.json(tracker)
  } catch (error) {
    console.error('[TRACKER PUT]', error)
    return NextResponse.json({ error: 'Failed to update tracker' }, { status: 500 })
  }
}
