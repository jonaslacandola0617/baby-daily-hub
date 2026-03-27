import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const item = await prisma.routineItem.update({
      where: { id: params.id },
      data: {
        ...(body.timeStart !== undefined && { timeStart: body.timeStart }),
        ...(body.timeEnd !== undefined && { timeEnd: body.timeEnd || null }),
        ...(body.activity !== undefined && { activity: body.activity }),
        ...(body.note !== undefined && { note: body.note || null }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.order !== undefined && { order: body.order }),
      },
    })
    return NextResponse.json(item)
  } catch (error) {
    console.error('[ROUTINE PATCH]', error)
    return NextResponse.json({ error: 'Failed to update routine item' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.routineItem.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ROUTINE DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete routine item' }, { status: 500 })
  }
}
