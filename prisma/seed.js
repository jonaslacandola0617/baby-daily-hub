const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Force delete and re-seed routine
  await prisma.routineItem.deleteMany()
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
  console.log('✅ Routine seeded')

  // Milestones
  await prisma.milestone.deleteMany()
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
  console.log('✅ Milestones seeded')

  // Baby profile
  await prisma.babyProfile.deleteMany()
  await prisma.babyProfile.create({ data: { name: 'Your Little One' } })
  console.log('✅ Baby profile seeded')

  // Sample recipes — only seed if empty
  const recipeCount = await prisma.recipe.count()
  if (recipeCount === 0) {
    await prisma.recipe.createMany({
      data: [
        {
          name: 'Banana Oat Porridge',
          category: 'breakfast',
          description: 'Soft, naturally sweet porridge — perfect first breakfast',
          ingredients: '½ cup rolled oats\n1 ripe banana, mashed\n1 cup whole milk\nPinch of cinnamon',
          steps: 'Combine oats and milk in a small saucepan\nCook over medium heat, stirring, for 5 minutes until thick\nStir in mashed banana\nSprinkle cinnamon and let cool slightly before serving',
          prepTime: '8 mins',
          tags: 'quick,soft,no-added-sugar',
          isFavourite: true,
          order: 0,
        },
        {
          name: 'Soft Rice & Chicken',
          category: 'lunch',
          description: 'Simple protein-packed lunch that is easy to eat',
          ingredients: '½ cup white rice\n80g chicken breast, diced small\n½ cup broccoli florets, very soft\n1 tsp olive oil\nPinch of salt',
          steps: 'Cook rice until very soft (add extra water)\nSteam chicken until cooked through — around 8 minutes\nSteam broccoli until fork-tender\nCombine everything, drizzle with olive oil\nChop or mash to suitable texture for baby',
          prepTime: '20 mins',
          tags: 'protein,batch-cook,soft',
          isFavourite: false,
          order: 1,
        },
        {
          name: 'Avocado Toast Fingers',
          category: 'snack',
          description: 'Quick finger food full of healthy fats',
          ingredients: '1 slice wholemeal bread\n¼ ripe avocado\nSqueeze of lemon juice\nPinch of salt (optional)',
          steps: 'Toast bread lightly\nMash avocado with lemon juice\nSpread on toast\nCut into finger-width strips for easy self-feeding',
          prepTime: '3 mins',
          tags: 'finger-food,quick,no-cook,healthy-fats',
          isFavourite: true,
          order: 2,
        },
        {
          name: 'Pasta with Hidden Veggie Sauce',
          category: 'dinner',
          description: 'A sneaky way to get extra vegetables in',
          ingredients: '½ cup small pasta (macaroni or stars)\n1 medium carrot, chopped\n¼ red capsicum, chopped\n2 tbsp tomato paste\n1 tsp olive oil\nPinch of dried basil',
          steps: 'Boil pasta until very soft, drain\nSteam carrot and capsicum until very tender\nBlend steamed veg with tomato paste and olive oil until smooth\nToss sauce with pasta\nServe warm — good at room temperature too',
          prepTime: '20 mins',
          tags: 'hidden-veg,batch-cook,toddler-approved',
          isFavourite: false,
          order: 3,
        },
      ],
    })
    console.log('✅ Sample recipes seeded')
  } else {
    console.log('ℹ️  Recipes already exist — skipping recipe seed')
  }

  console.log('\n🌟 Seed complete!')
}

main()
  .catch(e => { console.error('Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
