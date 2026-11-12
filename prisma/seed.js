// Sample (unofficial) practice content. Admin accounts are created by signing in with a Google
// account listed in ADMIN_EMAILS, so there is nothing user-related to seed.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TF = ['True', 'False', 'Not Given'];
const q = (id, part, prompt, options, correct, tag, type = 'mcq') => ({ id, part, type, prompt, options, correct, tag });

async function main() {
  if ((await prisma.readingTest.count()) === 0) {
    await prisma.readingTest.create({
      data: {
        title: 'Exam set 1 - Fast Fashion',
        difficulty: 'B2',
        durationMin: 60,
        passages: [{
          title: 'Fast Fashion',
          text: 'Fast fashion brands release new clothing collections almost every week, selling garments at prices so low that many shoppers treat them as disposable.\n\nBehind the bargain, the costs are considerable. Producing a single cotton T-shirt can require around 2,700 litres of water, and synthetic fabrics such as polyester shed tiny plastic fibres every time they are washed. Meanwhile, many factory workers earn wages that barely cover basic needs.\n\nSome companies now offer recycling schemes, yet researchers argue these programmes address only a small part of the problem. Less than one per cent of used clothing is currently turned into new garments. Experts therefore suggest that the most effective solution is simply to buy less and wear items for longer.',
        }],
        questions: [
          q('q1', 'Part A: True / False / Not Given', 'New collections appear in shops about once a month.', TF, 1, 'Detail', 'tfng'),
          q('q2', 'Part A: True / False / Not Given', 'A cotton T-shirt can need about 2,700 litres of water.', TF, 0, 'Detail', 'tfng'),
          q('q3', 'Part A: True / False / Not Given', 'Factory workers in this industry are paid very high wages.', TF, 1, 'Inference', 'tfng'),
          q('q4', 'Part A: True / False / Not Given', 'Fast fashion companies are the largest employers in Asia.', TF, 2, 'Inference', 'tfng'),
          q('q5', 'Part B: Choose the correct answer', 'What is the main idea of the text?', ['Cotton is better than polyester', 'Cheap clothes have hidden environmental and human costs', 'Recycling is the best solution', 'Shops should open every week'], 1, 'Main idea'),
          q('q6', 'Part B: Choose the correct answer', 'Why do researchers criticise recycling schemes?', ['They are too expensive', 'They deal with only a small part of the problem', 'Customers dislike them', 'They use too much water'], 1, 'Inference'),
          q('q7', 'Part B: Choose the correct answer', 'What do experts recommend?', ['Buying more cheap clothes', 'Washing clothes less often', 'Buying less and wearing items longer', 'Using only polyester'], 2, 'Detail'),
        ],
      },
    });
  }

  if ((await prisma.listeningTest.count()) === 0) {
    await prisma.listeningTest.create({
      data: {
        title: 'Exam set 1 - Conversation and talk',
        difficulty: 'B1',
        audioUrl: 'https://example.com/audio/replace-me.mp3', // replace with a real hosted audio file
        transcript: 'Man: Did you manage to book the flight to Samarkand? Woman: Yes, but only for Friday morning...',
        durationMin: 45,
        questions: [
          q('q1', 'Part 1: Short conversation', 'When will they fly to Samarkand?', ['Friday evening', 'Friday morning', 'Sunday morning'], 1, 'Detail'),
          q('q2', 'Part 1: Short conversation', 'How will they return?', ['By plane', 'By bus', 'By train'], 2, 'Detail'),
          q('q3', 'Part 2: Complete the notes', 'The museum closes at ...', ['4 p.m.', '5 p.m.', '6 p.m.'], 1, 'Numbers'),
        ],
      },
    });
  }

  if ((await prisma.writingTask.count()) === 0) {
    await prisma.writingTask.createMany({
      data: [
        { title: 'Email to a friend', taskType: 'TASK_1', difficulty: 'B1', minWords: 120, promptText: 'You have recently moved to a new city to study. Write an email to your friend. Tell him/her about the city and your new accommodation, and invite him/her to visit.' },
        { title: 'English for young people', taskType: 'TASK_2', difficulty: 'B2', minWords: 180, promptText: '"Learning English is essential for young people in Uzbekistan today." To what extent do you agree or disagree? Give reasons and examples.' },
      ],
    });
  }

  if ((await prisma.speakingTask.count()) === 0) {
    await prisma.speakingTask.create({
      data: {
        title: 'Speaking set 1',
        promptParts: [
          { part: 1, label: 'Part 1.1', prompt: 'What do you usually do on weekends? Tell me about your best friend. Do you prefer living in a city or in a village?' },
          { part: 1, label: 'Part 1.2', prompt: 'Compare two pictures: students studying in a library and students studying online at home. Which do you prefer, and why?' },
          { part: 2, label: 'Part 2', prompt: 'Describe a memorable journey you have taken. Where did you go? What did you see or do? Why was it memorable?' },
          { part: 3, label: 'Part 3', prompt: 'Students should be allowed to use smartphones in class. Give two arguments for and two against, then your opinion.' },
        ],
      },
    });
  }
  console.log('Seed complete');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
