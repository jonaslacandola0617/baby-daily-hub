import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const toy = await prisma.toy.update({
      where: { id: params.id },
      data: {
        ...(body.name        !== undefined && { name:        body.name.trim() }),
        ...(body.category    !== undefined && { category:    body.category }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        ...(body.emoji       !== undefined && { emoji:       body.emoji }),
        ...(body.isActive    !== undefined && { isActive:    body.isActive }),
        ...(body.isFavourite !== undefined && { isFavourite: body.isFavourite }),
        ...(body.loveCount   !== undefined && { loveCount:   body.loveCount }),
        ...(body.lastActiveAt!== undefined && { lastActiveAt:body.lastActiveAt ? new Date(body.lastActiveAt) : null }),
      },
    })
    return NextResponse.json(toy)
  } catch (error) {
    console.error('[TOY PATCH]', error)
    return NextResponse.json({ error: 'Failed to update toy' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.toy.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[TOY DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete toy' }, { status: 500 })
  }
}
