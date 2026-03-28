import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const appointments = await prisma.appointment.findMany({ orderBy: { order: 'asc' } })
    return NextResponse.json(appointments)
  } catch (error) {
    console.error('[APPOINTMENTS GET]', error)
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Allow empty date/text on creation — user fills them in after
    const appointment = await prisma.appointment.create({
      data: {
        date:  body.date  ?? '',
        text:  body.text  ?? '',
        order: body.order ?? 0,
      },
    })
    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('[APPOINTMENTS POST]', error)
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
  }
}
