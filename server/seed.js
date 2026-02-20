// server/seed.js
// Run:
//   node seed.js
// Options (env):
//   SEED_POSTS=1200          -> how many posts to create (default 60)
//   SEED_CLEAN=true|false    -> delete existing data first (default true)

require("dotenv").config();
const { connectDb } = require("./src/db");

/* -------------------------
   Small helpers
-------------------------- */

function toBool(v, fallback) {
  if (v === undefined || v === null || v === "") return fallback;
  const s = String(v).toLowerCase().trim();
  if (["1", "true", "yes", "y", "on"].includes(s)) return true;
  if (["0", "false", "no", "n", "off"].includes(s)) return false;
  return fallback;
}

function toNum(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function maybe(prob) {
  return Math.random() < prob;
}

function clampStr(s, maxLen) {
  const str = String(s ?? "");
  if (str.length <= maxLen) return str;
  return str.slice(0, Math.max(0, maxLen - 1)).trimEnd() + "…";
}

function sentimentFromStory() {
  // a bit more realistic distribution
  const r = Math.random();
  if (r < 0.45) return "worth";
  if (r < 0.75) return "meh";
  return "not_worth";
}

function makeSentence(tmpl, dict) {
  let s = tmpl;
  for (const [k, v] of Object.entries(dict)) {
    s = s.replaceAll(`{${k}}`, v);
  }
  return s;
}

/* -------------------------
   Data pools
-------------------------- */

const nicknames = [
  "zihan2",
  "budgetTiger",
  "coffeeAddict",
  "techGoblin",
  "studyMode",
  "rentIsTooHigh",
  "gymMaybeTomorrow",
  "snowDaySkier",
  "lateNightCoder",
  "frugalPanda",
  "mealPrepDreamer",
  "campusWalker",
];

const categories = [
  "Tech",
  "Kitchen",
  "School",
  "Fashion",
  "Fitness",
  "Travel",
  "Home",
  "Beauty",
];

const items = [
  { name: "Air fryer", cat: "Kitchen", price: [39, 129] },
  { name: "Water bottle", cat: "Kitchen", price: [8, 45] },
  { name: "Noise-cancelling headphones", cat: "Tech", price: [59, 399] },
  { name: "Mechanical keyboard", cat: "Tech", price: [39, 189] },
  { name: "Portable monitor", cat: "Tech", price: [99, 399] },
  { name: "iPad / tablet", cat: "School", price: [199, 899] },
  { name: "Planner notebook", cat: "School", price: [5, 35] },
  { name: "Standing desk", cat: "Home", price: [129, 699] },
  { name: "LED desk lamp", cat: "Home", price: [12, 79] },
  { name: "Gym membership", cat: "Fitness", price: [20, 120] },
  { name: "Running shoes", cat: "Fitness", price: [49, 199] },
  { name: "Winter jacket", cat: "Fashion", price: [49, 399] },
  { name: "Ski gloves", cat: "Travel", price: [19, 159] },
  { name: "Backpack", cat: "School", price: [19, 199] },
  { name: "Coffee grinder", cat: "Kitchen", price: [19, 159] },
  { name: "Skincare serum", cat: "Beauty", price: [12, 120] },
];

const brands = {
  Tech: ["Apple", "Anker", "Logitech", "Sony", "Bose", "Samsung", "Keychron", "Acer"],
  Kitchen: ["Ninja", "Instant", "OXO", "Hydro Flask", "Stanley", "IKEA", "Costco"],
  School: ["Apple", "Muji", "Uni", "Moleskine", "Staples", "Amazon Basics"],
  Fashion: ["Uniqlo", "Nike", "Adidas", "North Face", "Patagonia", "Zara"],
  Fitness: ["Nike", "Adidas", "Gymshark", "Lululemon", "Amazon Basics"],
  Travel: ["REI", "Patagonia", "The North Face", "Columbia", "Decathlon"],
  Home: ["IKEA", "Amazon Basics", "Target", "Wayfair"],
  Beauty: ["The Ordinary", "CeraVe", "COSRX", "Innisfree"],
};

const expectationTemplates = [
  "I thought this would {benefit} for {context}.",
  "Everyone online hyped it up, so I expected it to {benefit}.",
  "I bought it hoping it would {benefit} and be totally worth the money.",
  "I expected it to last {duration} and feel {quality}.",
  "I thought it would be a game-changer for {context}.",
];

const realityTemplates = [
  "Turns out it {result}. {extra}",
  "Honestly, it {result}. {extra}",
  "After {duration}, I realized it {result}. {extra}",
  "It {result}. {extra}",
];

const benefits = [
  "save me time",
  "save money",
  "make studying easier",
  "help me stay organized",
  "improve my daily routine",
  "reduce stress",
  "help me meal prep",
  "make commuting more comfortable",
];

const contexts = [
  "student life",
  "my morning routine",
  "meal prepping",
  "late-night coding",
  "classes and labs",
  "my tiny apartment",
  "gym days",
  "weekend trips",
];

const durations = [
  "a week",
  "two weeks",
  "a month",
  "two months",
  "the whole semester",
  "a few days",
];

const qualities = [
  "premium",
  "solid",
  "lightweight",
  "super convenient",
  "durable",
  "sleek",
];

const results = [
  "ended up being super useful",
  "was okay but not life-changing",
  "did not match my expectations",
  "is actually overrated for the price",
  "became something I use daily now",
  "is fine, but I wouldn't buy it again",
  "is worth it only when it's on sale",
  "is surprisingly good",
];

const extras = [
  "If you already have a similar one, you probably don't need it.",
  "The build quality is better than I expected.",
  "The setup was annoying, but after that it was fine.",
  "I wish I bought it earlier.",
  "It looked nicer in photos than in real life.",
  "It works, but the hype is too much.",
  "Would recommend it to students who like simple stuff.",
  "I ended up giving it to a friend.",
];

/* -------------------------
   Seed main
-------------------------- */

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("Missing MONGO_URI in .env");

  const TOTAL_POSTS = Math.max(1, Math.floor(toNum(process.env.SEED_POSTS, 60)));
  const CLEAN = toBool(process.env.SEED_CLEAN, true);

  const db = await connectDb(uri);
  const profilesCol = db.collection("profiles");
  const postsCol = db.collection("posts");

  if (CLEAN) {
    await profilesCol.deleteMany({});
    await postsCol.deleteMany({});
  }

  // Insert profiles (or reuse if not cleaning)
  let profileIds;

  if (CLEAN) {
    const profileDocs = nicknames.map((nickname) => ({
      nickname,
      createdAt: new Date(),
    }));
    const profileResult = await profilesCol.insertMany(profileDocs);
    profileIds = Object.values(profileResult.insertedIds);
  } else {
    const existing = await profilesCol.find({}, { projection: { _id: 1 } }).toArray();
    if (existing.length === 0) {
      const profileDocs = nicknames.map((nickname) => ({
        nickname,
        createdAt: new Date(),
      }));
      const profileResult = await profilesCol.insertMany(profileDocs);
      profileIds = Object.values(profileResult.insertedIds);
    } else {
      profileIds = existing.map((p) => p._id);
    }
  }

  const fakePosts = [];
  for (let i = 0; i < TOTAL_POSTS; i++) {
    const chosenProfileId = pick(profileIds);

    // pick item and category (mostly match)
    const item = pick(items);
    const cat = maybe(0.85) ? item.cat : pick(categories);

    const brandList = brands[cat] || ["Generic"];
    const brand = pick(brandList);

    const price = randInt(item.price[0], item.price[1]);
    const ctx = pick(contexts);
    const benefit = pick(benefits);
    const dur = pick(durations);
    const qual = pick(qualities);

    const expectation = makeSentence(pick(expectationTemplates), {
      benefit,
      context: ctx,
      duration: dur,
      quality: qual,
    });

    const reality = makeSentence(pick(realityTemplates), {
      result: pick(results),
      duration: dur,
      extra: pick(extras),
    });

    const sentiment = sentimentFromStory();

    // random date within last ~45 days
    const createdDaysAgo = randInt(0, 45);
    const createdAt = new Date(Date.now() - createdDaysAgo * 24 * 60 * 60 * 1000);

    fakePosts.push({
      itemName: clampStr(`${brand} ${item.name}`, 60),
      category: cat,
      expectation: clampStr(`${expectation} (≈$${price})`, 220),
      reality: clampStr(reality, 260),
      sentiment,
      profileId: chosenProfileId,
      createdAt,
      updatedAt: createdAt,
      imageUrl: null, // safest
    });
  }

  // Insert posts in chunks for very large numbers
  const CHUNK = 1000;
  for (let i = 0; i < fakePosts.length; i += CHUNK) {
    const part = fakePosts.slice(i, i + CHUNK);
    await postsCol.insertMany(part);
  }

  console.log("✅ Seed finished");
  console.log("Profiles:", await profilesCol.countDocuments());
  console.log("Posts:", await postsCol.countDocuments());
}

seed().catch((e) => {
  console.error("❌ Seed failed:", e.message);
  process.exit(1);
});
