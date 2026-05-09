import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [settings, logs, toys] = await Promise.all([
      prisma.rotationSettings.findFirst(),
      prisma.rotationLog.findMany({ orderBy: { rotatedAt: "desc" }, take: 20 }),
      prisma.toy.findMany({ orderBy: { order: "asc" } }),
    ]);
    return NextResponse.json({ settings, logs, toys });
  } catch (error) {
    console.error("[ROTATION GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch rotation data" },
      { status: 500 },
    );
  }
}

// POST — trigger a rotation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { theme, notes, forcedActiveIds } = body;

    const [allToys, settings] = await Promise.all([
      prisma.toy.findMany({ orderBy: { order: "asc" } }),
      prisma.rotationSettings.findFirst(),
    ]);

    const activeSetSize = settings?.activeSetSize ?? 4;

    if (allToys.length === 0) {
      return NextResponse.json(
        { error: "No toys found — add some toys first" },
        { status: 400 },
      );
    }
    if (allToys.length <= activeSetSize) {
      // If we have fewer toys than the active set size, just activate all
      await prisma.toy.updateMany({
        data: { isActive: true, lastActiveAt: new Date() },
      });
      const log = await prisma.rotationLog.create({
        data: {
          theme: theme || null,
          activeSetIds: allToys.map((t) => t.id).join(","),
          inIds: allToys.map((t) => t.id).join(","),
          outIds: "",
          notes: notes || null,
        },
      });
      await updateNextRotation(settings);
      return NextResponse.json({ log, activeToys: allToys });
    }

    const currentActive = allToys.filter((t) => t.isActive);
    const currentStorage = allToys.filter((t) => !t.isActive);

    let newActiveIds: string[];

    if (forcedActiveIds && forcedActiveIds.length > 0) {
      // Manual override — use exactly what was passed
      newActiveIds = forcedActiveIds;
    } else {
      // Smart rotation algorithm:
      // 1. Always include all favourites (up to activeSetSize)
      // 2. Fill remaining slots randomly from storage, weighted by:
      //    - toys not seen recently get higher weight
      //    - try to include at least one from each category

      const favourites = allToys.filter((t) => t.isFavourite);
      const nonFavourites = allToys.filter((t) => !t.isFavourite);

      // Get categories represented in the full set
      const allCategories = Array.from(new Set(allToys.map((t) => t.category)));

      newActiveIds = [];

      // Step 1: add favourites first (up to activeSetSize)
      const favSlots = Math.min(
        favourites.length,
        Math.floor(activeSetSize / 2),
      );
      const shuffledFavs = shuffle([...favourites]);
      newActiveIds.push(...shuffledFavs.slice(0, favSlots).map((t) => t.id));

      // Step 2: try to fill one from each missing category from storage
      const coveredCategories = new Set(
        newActiveIds
          .map((id) => allToys.find((t) => t.id === id)?.category)
          .filter(Boolean),
      );

      for (const cat of allCategories) {
        if (newActiveIds.length >= activeSetSize) break;
        if (coveredCategories.has(cat)) continue;
        // Pick least recently active toy in this category (exclude already picked)
        const candidates = nonFavourites
          .filter((t) => t.category === cat && !newActiveIds.includes(t.id))
          .sort((a, b) => {
            if (!a.lastActiveAt) return -1; // never shown = highest priority
            if (!b.lastActiveAt) return 1;
            return a.lastActiveAt.getTime() - b.lastActiveAt.getTime(); // oldest first
          });
        if (candidates.length > 0) {
          newActiveIds.push(candidates[0].id);
          coveredCategories.add(cat);
        }
      }

      // Step 3: fill remaining slots with weighted random from storage
      const remaining = nonFavourites
        .filter((t) => !newActiveIds.includes(t.id))
        .sort((a, b) => {
          if (!a.lastActiveAt) return -1;
          if (!b.lastActiveAt) return 1;
          return a.lastActiveAt.getTime() - b.lastActiveAt.getTime();
        });

      while (newActiveIds.length < activeSetSize && remaining.length > 0) {
        // Weighted: top half (longest unseen) gets 2x chance
        const mid = Math.ceil(remaining.length / 2);
        const pool =
          remaining.length <= 2
            ? remaining
            : [
                ...remaining.slice(0, mid),
                ...remaining.slice(0, mid),
                ...remaining.slice(mid),
              ];
        const picked = pool[Math.floor(Math.random() * pool.length)];
        if (!newActiveIds.includes(picked.id)) {
          newActiveIds.push(picked.id);
          remaining.splice(
            remaining.findIndex((t) => t.id === picked.id),
            1,
          );
        }
      }
    }

    // Work out what's coming in and going out
    const currentActiveIds = currentActive.map((t) => t.id);
    const inIds = newActiveIds.filter((id) => !currentActiveIds.includes(id));
    const outIds = currentActiveIds.filter((id) => !newActiveIds.includes(id));

    const now = new Date();

    // Update all toys in a transaction
    await prisma.$transaction([
      // Deactivate all
      prisma.toy.updateMany({ data: { isActive: false } }),
      // Activate new set
      ...newActiveIds.map((id) =>
        prisma.toy.update({
          where: { id },
          data: { isActive: true, lastActiveAt: now },
        }),
      ),
    ]);

    // Log the rotation
    const log = await prisma.rotationLog.create({
      data: {
        theme: theme || null,
        activeSetIds: newActiveIds.join(","),
        inIds: inIds.join(","),
        outIds: outIds.join(","),
        notes: notes || null,
      },
    });

    await updateNextRotation(settings);

    // Return updated toys
    const updatedToys = await prisma.toy.findMany({
      orderBy: [{ isActive: "desc" }, { order: "asc" }],
    });
    return NextResponse.json({
      log,
      activeToys: updatedToys.filter((t) => t.isActive),
      toys: updatedToys,
    });
  } catch (error) {
    console.error("[ROTATION POST]", error);
    return NextResponse.json(
      { error: "Failed to rotate toys" },
      { status: 500 },
    );
  }
}

// PATCH — update settings
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    let settings = await prisma.rotationSettings.findFirst();
    if (!settings) {
      settings = await prisma.rotationSettings.create({ data: {} });
    }
    settings = await prisma.rotationSettings.update({
      where: { id: settings.id },
      data: {
        ...(body.activeSetSize !== undefined && {
          activeSetSize: body.activeSetSize,
        }),
        ...(body.scheduleDays !== undefined && {
          scheduleDays: body.scheduleDays,
          nextRotationAt:
            body.scheduleDays > 0 && settings.lastRotatedAt
              ? addDays(settings.lastRotatedAt, body.scheduleDays)
              : null,
        }),
      },
    });
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[ROTATION PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function updateNextRotation(
  settings: { id: string; scheduleDays: number } | null,
) {
  if (!settings) return;
  const now = new Date();
  await prisma.rotationSettings.update({
    where: { id: settings.id },
    data: {
      lastRotatedAt: now,
      nextRotationAt:
        settings.scheduleDays > 0 ? addDays(now, settings.scheduleDays) : null,
    },
  });
}
