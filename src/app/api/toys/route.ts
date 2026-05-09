import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const toys = await prisma.toy.findMany({
      orderBy: [{ isActive: 'desc' }, { isFavourite: 'desc' }, { order: 'asc' }],
    })
    return NextResponse.json(toys)
  } catch (error) {
    console.error('[TOYS GET]', error)
    return NextResponse.json({ error: 'Failed to fetch toys' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, category, description, emoji } = body
    if (!name?.trim() || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 })
    }
    const count = await prisma.toy.count()
    const toy = await prisma.toy.create({
      data: {
        name:        name.trim(),
        category,
        description: description?.trim() || null,
        emoji:       emoji || '🧸',
        order:       count,
      },
    })
    return NextResponse.json(toy, { status: 201 })
  } catch (error) {
    console.error('[TOYS POST]', error)
    return NextResponse.json({ error: 'Failed to create toy' }, { status: 500 })
  }
}
