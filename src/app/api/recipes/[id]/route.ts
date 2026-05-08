import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const recipe = await prisma.recipe.update({
      where: { id: params.id },
      data: {
        ...(body.name        !== undefined && { name:        body.name.trim() }),
        ...(body.category    !== undefined && { category:    body.category }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        ...(body.ingredients !== undefined && { ingredients: body.ingredients.trim() }),
        ...(body.steps       !== undefined && { steps:       body.steps.trim() }),
        ...(body.prepTime    !== undefined && { prepTime:    body.prepTime?.trim() || null }),
        ...(body.tags        !== undefined && { tags:        body.tags?.trim() || null }),
        ...(body.isFavourite !== undefined && { isFavourite: body.isFavourite }),
        ...(body.order       !== undefined && { order:       body.order }),
      },
    })
    return NextResponse.json(recipe)
  } catch (error) {
    console.error('[RECIPE PATCH]', error)
    return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.recipe.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[RECIPE DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 })
  }
}
