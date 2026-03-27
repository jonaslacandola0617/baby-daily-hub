import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        ...(body.date !== undefined && { date: body.date }),
        ...(body.text !== undefined && { text: body.text }),
        ...(body.order !== undefined && { order: body.order }),
      },
    })
    return NextResponse.json(appointment)
  } catch (error) {
    console.error('[APPOINTMENT PATCH]', error)
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.appointment.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[APPOINTMENT DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 })
  }
}
