
import { createUser } from "../src/lib/db/users";
import { createTechnicianProfile } from "../src/lib/db/catalog";
import { subscribeTechnicianToPlan } from "../src/lib/db/monetization";
import {
  createServiceRequest,
  acceptRequest,
  advanceStatus,
  markCompleted,
  confirmSolved,
  declineRequest,
  cancelRequest,
  createMessage,
} from "../src/lib/db/requests";
import { createReview } from "../src/lib/db/reviews";
import { toStringArray } from "../src/lib/utils";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});
const PASSWORD = "password123";

const HOW_IT_WORKS = [
  "Tell us what's wrong",
  "Pick a verified technician near you",
  "Track them in real time on the way",
  "They get the job done",
  "Confirm it's fixed and leave a rating",
];

const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
const gallery = (seed: string, n: number) =>
  Array.from({ length: n }, (_, i) => `https://picsum.photos/seed/${seed}-${i}/480/360`);

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

async function main() {
  console.log("Seeding...");

  // --- Plans --------------------------------------------------------------
  const freePlan = await prisma.plan.create({
    data: {
      key: "FREE",
      name: "Free",
      price: 0,
      billingCycle: "NONE",
      commissionRate: 0.15,
      maxRequestsPerMonth: 10,
      priorityVisibility: false,
      features: toStringArray([
        "10 requests per month",
        "Standard visibility in search",
        "15% commission per completed job",
      ]),
    },
  });

  const proMonthlyPlan = await prisma.plan.create({
    data: {
      key: "PRO_MONTHLY",
      name: "Pro Monthly",
      price: 19,
      billingCycle: "MONTHLY",
      commissionRate: 0.05,
      maxRequestsPerMonth: null,
      priorityVisibility: true,
      features: toStringArray([
        "Unlimited requests",
        "Priority placement in search",
        "Only 5% commission per job",
        "Verified badge eligibility",
      ]),
    },
  });

  const proYearlyPlan = await prisma.plan.create({
    data: {
      key: "PRO_YEARLY",
      name: "Pro Yearly",
      price: 150,
      billingCycle: "YEARLY",
      commissionRate: 0.05,
      maxRequestsPerMonth: null,
      priorityVisibility: true,
      features: toStringArray([
        "Unlimited requests",
        "Priority placement in search",
        "Only 5% commission per job",
        "Verified badge eligibility",
        "2 months free vs. monthly",
      ]),
      badge: "Save 34%",
    },
  });

  const planIdByKey: Record<string, string> = {
    FREE: freePlan.id,
    PRO_MONTHLY: proMonthlyPlan.id,
    PRO_YEARLY: proYearlyPlan.id,
  };

  // --- Categories ---------------------------------------------------------
  const categoryDefs = [
    ["electrician", "Electrician", "Zap", "#F59E0B", "Certified electricians for wiring, outlets, breakers, and lighting.", 4.7, 980],
    ["plumber", "Plumber", "Droplets", "#0EA5E9", "Leaks, clogged drains, water heaters, and pipe installs.", 4.6, 845],
    ["air-conditioner", "Air Conditioner Repair", "AirVent", "#14B8A6", "AC installs, gas refill, servicing, and breakdown repairs.", 4.8, 1120],
    ["washing-machine", "Washing Machine Repair", "WashingMachine", "#8B5CF6", "Diagnostics and repair for all major washing machine brands.", 4.5, 410],
    ["refrigerator", "Refrigerator Repair", "Refrigerator", "#3B82F6", "Cooling issues, compressor and thermostat repairs.", 4.6, 530],
    ["tv-repair", "TV Repair", "Tv", "#F43F5E", "Screen, board, and connectivity issues on any TV brand.", 4.4, 290],
    ["carpenter", "Carpenter", "Hammer", "#92400E", "Custom furniture, doors, repairs, and woodwork.", 4.7, 610],
    ["locksmith", "Locksmith", "KeyRound", "#475569", "Lockouts, rekeying, and security hardware installs.", 4.8, 720],
    ["painter", "Painter", "PaintRoller", "#16A34A", "Interior and exterior painting, touch-ups, and finishes.", 4.6, 380],
    ["cleaning", "Cleaning", "Sparkles", "#06B6D4", "Home and office deep cleaning, recurring or one-off.", 4.7, 940],
    ["satellite", "Satellite Installation", "SatelliteDish", "#6366F1", "Dish alignment, installs, and signal troubleshooting.", 4.5, 215],
    ["solar-panels", "Solar Panels", "Sun", "#EAB308", "Solar panel installation, wiring, and maintenance.", 4.9, 160],
  ] as const;

  const categoryIdBySlug: Record<string, string> = {};
  for (let i = 0; i < categoryDefs.length; i++) {
    const [slug, name, icon, color, description, ratingAvg, ratingCount] = categoryDefs[i];
    const cat = await prisma.category.create({
      data: {
        slug,
        name,
        icon,
        color,
        description,
        howItWorks: toStringArray([...HOW_IT_WORKS]),
        ratingAvg,
        ratingCount,
        sortOrder: i,
      },
    });
    categoryIdBySlug[slug] = cat.id;
  }

  // --- Technicians --------------------------------------------------------
  const techDefs = [
    { name: "Ahmed Ben Salah", phone: "20000001", title: "AC Technician", bio: "8 years fixing AC units across Greater Tunis.", years: 8, price: 35, city: "Tunis", lat: 36.8065, lng: 10.1815, plan: "PRO_MONTHLY", verified: true, cats: ["air-conditioner", "refrigerator"] },
    { name: "Yassine Kriaa", phone: "20000002", title: "Plumber", bio: "Plumbing and light carpentry. Same-day visits.", years: 5, price: 25, city: "Sousse", lat: 35.8256, lng: 10.6369, plan: "FREE", verified: true, cats: ["plumber", "carpenter"] },
    { name: "Mohamed Ali", phone: "20000003", title: "Electrician", bio: "Licensed electrician, 12 years experience.", years: 12, price: 30, city: "Tunis", lat: 36.8189, lng: 10.1658, plan: "PRO_YEARLY", verified: true, cats: ["electrician", "satellite"] },
    { name: "Walid Mhiri", phone: "20000004", title: "Refrigeration Specialist", bio: "Fridge and washing machine repairs.", years: 6, price: 28, city: "Monastir", lat: 35.778, lng: 10.8262, plan: "FREE", verified: false, cats: ["refrigerator", "washing-machine"] },
    { name: "Hichem Ayari", phone: "20000005", title: "Multi Services", bio: "15 years as a generalist — carpentry, painting, locks.", years: 15, price: 40, city: "Sfax", lat: 34.7406, lng: 10.7603, plan: "PRO_MONTHLY", verified: true, cats: ["carpenter", "painter", "locksmith"] },
    { name: "Nizar Gharbi", phone: "20000006", title: "Locksmith", bio: "Lockouts and rekeying, available evenings.", years: 4, price: 20, city: "Tunis", lat: 36.7962, lng: 10.1911, plan: "FREE", verified: false, cats: ["locksmith", "electrician"] },
    { name: "Karim Jaziri", phone: "20000007", title: "TV & Electronics Repair", bio: "TV, satellite, and home electronics.", years: 7, price: 22, city: "Tunis", lat: 36.85, lng: 10.2167, plan: "FREE", verified: true, cats: ["tv-repair", "satellite"] },
    { name: "Sami Trabelsi", phone: "20000008", title: "Cleaning & Home Services", bio: "Deep cleaning and small home jobs.", years: 3, price: 18, city: "Ariana", lat: 36.8665, lng: 10.1647, plan: "FREE", verified: false, cats: ["cleaning", "painter", "washing-machine"] },
    { name: "Adel Bouazizi", phone: "20000009", title: "Solar Energy Installer", bio: "Solar panel installs and electrical work.", years: 9, price: 50, city: "Sousse", lat: 35.8328, lng: 10.6412, plan: "PRO_MONTHLY", verified: true, cats: ["solar-panels", "electrician"] },
  ];

  const technicianIdByPhone: Record<string, string> = {};
  for (const t of techDefs) {
    const user = await createUser({ fullName: t.name, phone: t.phone, password: PASSWORD, role: "TECHNICIAN", city: t.city });
    await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: avatar(t.phone) } });

    const profile = await createTechnicianProfile({
      userId: user.id,
      title: t.title,
      bio: t.bio,
      yearsExperience: t.years,
      startingPrice: t.price,
      categoryIds: t.cats.map((c) => categoryIdBySlug[c]),
      planId: planIdByKey[t.plan],
    });

    await prisma.technician.update({
      where: { id: profile.id },
      data: {
        latitude: t.lat,
        longitude: t.lng,
        verified: t.verified,
        galleryImages: toStringArray(gallery(t.phone, 4)),
      },
    });

    await subscribeTechnicianToPlan(profile.id, planIdByKey[t.plan]);
    technicianIdByPhone[t.phone] = profile.id;
  }

  // --- Clients ------------------------------------------------------------
  const sarra = await createUser({ fullName: "Sarra Bouazizi", phone: "30000001", password: PASSWORD, role: "CLIENT", city: "Tunis", address: "12 Rue de Marseille, Tunis" });
  await prisma.user.update({ where: { id: sarra.id }, data: { avatarUrl: avatar("30000001") } });

  const khaled = await createUser({ fullName: "Khaled Mansour", phone: "30000002", password: PASSWORD, role: "CLIENT", city: "Sousse", address: "5 Avenue Hedi Chaker, Sousse" });
  await prisma.user.update({ where: { id: khaled.id }, data: { avatarUrl: avatar("30000002") } });

  // --- Service requests ---------------------------------------------------

  // A: completed + solved + reviewed — backdated 3 days
  const reqA = await createServiceRequest({
    clientId: sarra.id, technicianId: technicianIdByPhone["20000001"], categoryId: categoryIdBySlug["air-conditioner"],
    fullName: sarra.fullName, phone: sarra.phone, address: sarra.address!, latitude: 36.81, longitude: 10.19,
    description: "AC unit is leaking water and not cooling well.", photos: [],
  });
  await acceptRequest(reqA);
  await advanceStatus(reqA, "ON_THE_WAY");
  await advanceStatus(reqA, "ARRIVED");
  await advanceStatus(reqA, "IN_PROGRESS");
  await markCompleted(reqA);
  await confirmSolved(reqA, true);
  await createReview({ requestId: reqA, technicianId: technicianIdByPhone["20000001"], authorId: sarra.id, rating: 5, comment: "Excellent and fast!" });
  const d3 = daysAgo(3);
  await prisma.serviceRequest.update({
    where: { id: reqA },
    data: { pendingAt: d3, acceptedAt: d3, onTheWayAt: d3, arrivedAt: d3, inProgressAt: d3, completedAt: d3, createdAt: d3 },
  });
  const payA = await prisma.payment.findFirst({ where: { requestId: reqA } });
  if (payA) await prisma.payment.update({ where: { id: payA.id }, data: { createdAt: d3 } });
  const revA = await prisma.review.findFirst({ where: { requestId: reqA } });
  if (revA) await prisma.review.update({ where: { id: revA.id }, data: { createdAt: d3 } });

  // B: accepted + chat
  const reqB = await createServiceRequest({
    clientId: sarra.id, technicianId: technicianIdByPhone["20000003"], categoryId: categoryIdBySlug["electrician"],
    fullName: sarra.fullName, phone: sarra.phone, address: sarra.address!, latitude: 36.81, longitude: 10.19,
    description: "Two outlets stopped working after a breaker trip.", photos: [],
  });
  await acceptRequest(reqB);
  await createMessage({ requestId: reqB, senderId: sarra.id, body: "Hi! Are you free this afternoon?" });
  const mohamedTech = await prisma.technician.findUnique({ where: { id: technicianIdByPhone["20000003"] }, select: { userId: true } });
  await createMessage({ requestId: reqB, senderId: mohamedTech!.userId, body: "Yes, I can come by around 4pm." });

  // C: pending
  await createServiceRequest({
    clientId: khaled.id, technicianId: technicianIdByPhone["20000002"], categoryId: categoryIdBySlug["plumber"],
    fullName: khaled.fullName, phone: khaled.phone, address: khaled.address!, latitude: 35.83, longitude: 10.64,
    description: "Kitchen sink is clogged and draining slowly.", photos: [],
  });

  // D: completed + solved + reviewed — backdated 1 day
  const reqD = await createServiceRequest({
    clientId: khaled.id, technicianId: technicianIdByPhone["20000005"], categoryId: categoryIdBySlug["carpenter"],
    fullName: khaled.fullName, phone: khaled.phone, address: khaled.address!, latitude: 35.83, longitude: 10.64,
    description: "Bedroom door won't close, hinge seems bent.", photos: [],
  });
  await acceptRequest(reqD);
  await advanceStatus(reqD, "ON_THE_WAY");
  await advanceStatus(reqD, "ARRIVED");
  await advanceStatus(reqD, "IN_PROGRESS");
  await markCompleted(reqD);
  await confirmSolved(reqD, true);
  await createReview({ requestId: reqD, technicianId: technicianIdByPhone["20000005"], authorId: khaled.id, rating: 4, comment: "Good work, a bit late but solid result." });
  await prisma.serviceRequest.update({ where: { id: reqD }, data: { createdAt: daysAgo(1) } });

  // E: declined
  const reqE = await createServiceRequest({
    clientId: sarra.id, technicianId: technicianIdByPhone["20000004"], categoryId: categoryIdBySlug["refrigerator"],
    fullName: sarra.fullName, phone: sarra.phone, address: sarra.address!, latitude: 36.81, longitude: 10.19,
    description: "Fridge is making a loud noise and not cooling.", photos: [],
  });
  await declineRequest(reqE);

  // F: on the way + chat
  const reqF = await createServiceRequest({
    clientId: khaled.id, technicianId: technicianIdByPhone["20000007"], categoryId: categoryIdBySlug["tv-repair"],
    fullName: khaled.fullName, phone: khaled.phone, address: khaled.address!, latitude: 35.83, longitude: 10.64,
    description: "TV turns on but screen stays black, sound works fine.", photos: [],
  });
  await acceptRequest(reqF);
  await advanceStatus(reqF, "ON_THE_WAY");
  await createMessage({ requestId: reqF, senderId: khaled.id, body: "I'm on the 3rd floor, buzzer is broken so call me." });

  // G: completed + NOT solved
  const reqG = await createServiceRequest({
    clientId: sarra.id, technicianId: technicianIdByPhone["20000008"], categoryId: categoryIdBySlug["cleaning"],
    fullName: sarra.fullName, phone: sarra.phone, address: sarra.address!, latitude: 36.81, longitude: 10.19,
    description: "Deep clean for a 3-bedroom apartment.", photos: [],
  });
  await acceptRequest(reqG);
  await advanceStatus(reqG, "ON_THE_WAY");
  await advanceStatus(reqG, "ARRIVED");
  await advanceStatus(reqG, "IN_PROGRESS");
  await markCompleted(reqG);
  await confirmSolved(reqG, false);

  // H: completed + solved + reviewed (today — for "today's earnings")
  const reqH = await createServiceRequest({
    clientId: khaled.id, technicianId: technicianIdByPhone["20000009"], categoryId: categoryIdBySlug["solar-panels"],
    fullName: khaled.fullName, phone: khaled.phone, address: khaled.address!, latitude: 35.83, longitude: 10.64,
    description: "Quote and install for a small rooftop solar setup.", photos: [],
  });
  await acceptRequest(reqH);
  await advanceStatus(reqH, "ON_THE_WAY");
  await advanceStatus(reqH, "ARRIVED");
  await advanceStatus(reqH, "IN_PROGRESS");
  await markCompleted(reqH);
  await confirmSolved(reqH, true);
  await createReview({ requestId: reqH, technicianId: technicianIdByPhone["20000009"], authorId: khaled.id, rating: 5, comment: "Professional from quote to install." });

  // I: in progress
  const reqI = await createServiceRequest({
    clientId: sarra.id, technicianId: technicianIdByPhone["20000006"], categoryId: categoryIdBySlug["locksmith"],
    fullName: sarra.fullName, phone: sarra.phone, address: sarra.address!, latitude: 36.81, longitude: 10.19,
    description: "Locked out, need door opened and lock replaced.", photos: [],
  });
  await acceptRequest(reqI);
  await advanceStatus(reqI, "ON_THE_WAY");
  await advanceStatus(reqI, "ARRIVED");
  await advanceStatus(reqI, "IN_PROGRESS");

  // J: cancelled
  const reqJ = await createServiceRequest({
    clientId: khaled.id, technicianId: technicianIdByPhone["20000002"], categoryId: categoryIdBySlug["plumber"],
    fullName: khaled.fullName, phone: khaled.phone, address: khaled.address!, latitude: 35.83, longitude: 10.64,
    description: "Water heater not producing hot water.", photos: [],
  });
  await cancelRequest(reqJ);

  console.log("✅ Seed complete — 3 plans, 12 categories, 9 technicians, 2 clients, 10 requests");
  console.log("   Technicians: 20000001–20000009 | Clients: 30000001, 30000002 | Password: password123");
}

main()
  .catch((err) => { console.error("Seed failed:", err); process.exit(1); })
  .then(async () => { await prisma.$disconnect(); process.exit(0); });