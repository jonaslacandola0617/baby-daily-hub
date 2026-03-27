import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    let profile = await prisma.babyProfile.findFirst()
    if (!profile) {
      profile = await prisma.babyProfile.create({ data: { name: 'Your Little One' } })
    }
    return NextResponse.json(profile)
  } catch (error) {
    console.error('[PROFILE GET]', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    let profile = await prisma.babyProfile.findFirst()
    if (!profile) {
      profile = await prisma.babyProfile.create({
        data: { name: body.name ?? 'Your Little One', birthdate: body.birthdate ?? null },
      })
    } else {
      profile = await prisma.babyProfile.update({
        where: { id: profile.id },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.birthdate !== undefined && { birthdate: body.birthdate }),
        },
      })
    }
    return NextResponse.json(profile)
  } catch (error) {
    console.error('[PROFILE PUT]', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
