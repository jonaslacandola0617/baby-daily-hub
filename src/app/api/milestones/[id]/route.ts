import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const milestone = await prisma.milestone.update({
      where: { id: params.id },
      data: {
        ...(body.text !== undefined && { text: body.text }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.order !== undefined && { order: body.order }),
      },
    })
    return NextResponse.json(milestone)
  } catch (error) {
    console.error('[MILESTONE PATCH]', error)
    return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.milestone.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[MILESTONE DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 })
  }
}
