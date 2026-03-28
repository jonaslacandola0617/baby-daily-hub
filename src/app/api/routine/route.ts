import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const items = await prisma.routineItem.findMany({ orderBy: { order: 'asc' } })
    return NextResponse.json(items)
  } catch (error) {
    console.error('[ROUTINE GET]', error)
    return NextResponse.json({ error: 'Failed to fetch routine' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { timeStart, timeEnd, activity, note, category, order } = body
    if (!timeStart || !activity || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const item = await prisma.routineItem.create({
      data: { timeStart, timeEnd: timeEnd || null, activity, note: note || null, category, order: order ?? 0 },
    })
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('[ROUTINE POST]', error)
    return NextResponse.json({ error: 'Failed to create routine item' }, { status: 500 })
  }
}
