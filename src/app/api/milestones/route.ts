import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const milestones = await prisma.milestone.findMany({ orderBy: { order: 'asc' } })
    return NextResponse.json(milestones)
  } catch (error) {
    console.error('[MILESTONES GET]', error)
    return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, category, status, order } = body
    if (!text || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const milestone = await prisma.milestone.create({
      data: { text, category, status: status ?? 'pending', order: order ?? 0 },
    })
    return NextResponse.json(milestone, { status: 201 })
  } catch (error) {
    console.error('[MILESTONES POST]', error)
    return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 })
  }
}
