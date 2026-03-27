import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const { date, text, order } = body
    if (!date || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const appointment = await prisma.appointment.create({
      data: { date, text, order: order ?? 0 },
    })
    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('[APPOINTMENTS POST]', error)
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
  }
}
