const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Seed routine
  const existingRoutine = await prisma.routineItem.count()
  if (existingRoutine === 0) {
    await prisma.routineItem.createMany({
      data: [
        { timeStart: '6:30 AM', timeEnd: '7:00 AM', activity: 'Wake up & morning hygiene', note: 'Diaper change, face wash, brush teeth', category: 'care', order: 0 },
        { timeStart: '7:00 AM', timeEnd: '7:30 AM', activity: 'Breakfast', note: 'High-chair time, self-feeding practice', category: 'meal', order: 1 },
        { timeStart: '7:30 AM', timeEnd: '9:30 AM', activity: 'Free play & exploration', note: 'Blocks, sensory bins, stacking toys', category: 'play', order: 2 },
        { timeStart: '9:30 AM', timeEnd: '10:00 AM', activity: 'Learning time', note: 'Books, flashcards, simple puzzles', category: 'learn', order: 3 },
        { timeStart: '10:00 AM', timeEnd: '11:00 AM', activity: 'Outdoor time', note: 'Park, backyard, or morning walk', category: 'outdoor', order: 4 },
        { timeStart: '11:30 AM', timeEnd: null, activity: 'Lunch', note: 'Balanced meal, wind-down after', category: 'meal', order: 5 },
        { timeStart: '12:30 PM', timeEnd: '2:00 PM', activity: 'Afternoon nap', note: 'Dim room, white noise, comfort toy', category: 'sleep', order: 6 },
        { timeStart: '2:00 PM', timeEnd: '4:00 PM', activity: 'Creative & active play', note: 'Drawing, music, dancing', category: 'play', order: 7 },
        { timeStart: '4:00 PM', timeEnd: null, activity: 'Afternoon snack', note: 'Fruit, yogurt, or crackers', category: 'meal', order: 8 },
        { timeStart: '5:00 PM', timeEnd: '6:00 PM', activity: 'Evening outdoor / family time', note: 'Walk, playground, or garden', category: 'outdoor', order: 9 },
        { timeStart: '6:30 PM', timeEnd: null, activity: 'Dinner', note: 'Eat together as a family', category: 'meal', order: 10 },
        { timeStart: '7:00 PM', timeEnd: '7:30 PM', activity: 'Bath & bedtime routine', note: 'Bath, pajamas, brush teeth, story', category: 'care', order: 11 },
        { timeStart: '7:30 PM', timeEnd: null, activity: 'Lights out / bedtime', note: 'Consistent sleep time is key', category: 'sleep', order: 12 },
      ],
    })
  }

  // Seed milestones
  const existingMs = await prisma.milestone.count()
  if (existingMs === 0) {
    await prisma.milestone.createMany({
      data: [
        { text: 'Says 50+ words', category: 'Language', status: 'done', order: 0 },
        { text: 'Runs & climbs stairs', category: 'Gross motor', status: 'done', order: 1 },
        { text: 'Uses spoon & fork', category: 'Fine motor', status: 'done', order: 2 },
        { text: 'Points to named pictures', category: 'Cognitive', status: 'done', order: 3 },
        { text: 'Two-word sentences', category: 'Language', status: 'progress', order: 4 },
        { text: 'Potty training', category: 'Self-care', status: 'progress', order: 5 },
        { text: 'Names body parts', category: 'Cognitive', status: 'progress', order: 6 },
        { text: 'Kicks a ball', category: 'Gross motor', status: 'pending', order: 7 },
        { text: 'Stacks 6+ blocks', category: 'Fine motor', status: 'pending', order: 8 },
        { text: 'Follows 2-step instructions', category: 'Cognitive', status: 'pending', order: 9 },
      ],
    })
  }

  // Seed baby profile
  const existingProfile = await prisma.babyProfile.count()
  if (existingProfile === 0) {
    await prisma.babyProfile.create({ data: { name: 'Your Little One' } })
  }

  console.log('Seed complete ✅')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
