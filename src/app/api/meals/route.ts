import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { today } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || today()
    const meal = await prisma.mealLog.findUnique({ where: { date } })
    if (!meal) {
      return NextResponse.json({ date, breakfast: null, lunch: null, dinner: null, snacks: null, vitamins: {} })
    }
    return NextResponse.json({ ...meal, vitamins: meal.vitamins as Record<string, boolean> })
  } catch (error) {
    console.error('[MEALS GET]', error)
    return NextResponse.json({ error: 'Failed to fetch meals' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const date = body.date || today()
    const meal = await prisma.mealLog.upsert({
      where: { date },
      update: {
        ...(body.breakfast !== undefined && { breakfast: body.breakfast }),
        ...(body.lunch !== undefined && { lunch: body.lunch }),
        ...(body.dinner !== undefined && { dinner: body.dinner }),
        ...(body.snacks !== undefined && { snacks: body.snacks }),
        ...(body.vitamins !== undefined && { vitamins: body.vitamins }),
      },
      create: {
        date,
        breakfast: body.breakfast ?? null,
        lunch: body.lunch ?? null,
        dinner: body.dinner ?? null,
        snacks: body.snacks ?? null,
        vitamins: body.vitamins ?? {},
      },
    })
    return NextResponse.json({ ...meal, vitamins: meal.vitamins as Record<string, boolean> })
  } catch (error) {
    console.error('[MEALS PUT]', error)
    return NextResponse.json({ error: 'Failed to update meals' }, { status: 500 })
  }
}
