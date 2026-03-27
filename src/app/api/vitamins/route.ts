import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULT_VITAMINS = ['Vitamin C']

async function getProfile() {
  let profile = await prisma.babyProfile.findFirst()
  if (!profile) {
    profile = await prisma.babyProfile.create({ data: { name: 'Your Little One' } })
  }
  return profile
}

export async function GET() {
  try {
    const profile = await getProfile()
    const vitamins = (profile as Record<string, unknown>).vitaminList as string[] | undefined
    return NextResponse.json(vitamins ?? DEFAULT_VITAMINS)
  } catch (error) {
    console.error('[VITAMINS GET]', error)
    return NextResponse.json({ error: 'Failed to fetch vitamins' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const vitamins: string[] = body.vitamins
    if (!Array.isArray(vitamins)) {
      return NextResponse.json({ error: 'vitamins must be an array' }, { status: 400 })
    }
    const profile = await getProfile()
    await prisma.babyProfile.update({
      where: { id: profile.id },
      data: { vitaminList: vitamins },
    })
    return NextResponse.json(vitamins)
  } catch (error) {
    console.error('[VITAMINS PUT]', error)
    return NextResponse.json({ error: 'Failed to update vitamins' }, { status: 500 })
  }
}
