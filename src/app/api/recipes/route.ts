import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const recipes = await prisma.recipe.findMany({
      where: category ? { category } : undefined,
      orderBy: [
        { isFavourite: "desc" },
        { order: "asc" },
        { createdAt: "desc" },
      ],
    });
    return NextResponse.json(recipes);
  } catch (error) {
    console.error("[RECIPES GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category, description, ingredients, steps, prepTime, tags } =
      body;
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const count = await prisma.recipe.count();
    const recipe = await prisma.recipe.create({
      data: {
        name: name.trim(),
        category: category || "any",
        description: description?.trim() || null,
        ingredients: ingredients.trim(),
        steps: steps.trim(),
        prepTime: prepTime?.trim() || null,
        tags: tags?.trim() || null,
        order: count,
      },
    });
    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error("[RECIPES POST]", error);
    return NextResponse.json(
      { error: "Failed to create recipe" },
      { status: 500 },
    );
  }
}
