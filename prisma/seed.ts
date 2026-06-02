import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@hibir.events";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "HibirAdmin1!";

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    create: {
      fullName: "System Admin",
      email,
      preferredLanguage: "en",
      passwordHash,
      role: "admin",
      status: "active",
    },
    update: {
      passwordHash,
      role: "admin",
      status: "active",
    },
  });

  console.log(`Admin user ready: ${email}`);

  const categories = [
    { name: "Music", slug: "music", description: "Concerts and live music" },
    { name: "Sports", slug: "sports", description: "Sporting events and tournaments" },
    { name: "Conference", slug: "conference", description: "Talks, summits, and workshops" },
    { name: "Arts & Culture", slug: "arts-culture", description: "Exhibitions and cultural events" },
    { name: "Food & Drink", slug: "food-drink", description: "Tastings and culinary events" },
    { name: "Community", slug: "community", description: "Local and community gatherings" },
  ];

  for (const cat of categories) {
    await prisma.eventCategory.upsert({
      where: { slug: cat.slug },
      create: cat,
      update: { name: cat.name, description: cat.description },
    });
  }

  console.log(`Seeded ${categories.length} event categories`);

  const locations = [
    { name: "Millennium Hall", city: "Addis Ababa", region: "Bole", sortOrder: 1 },
    { name: "National Theatre", city: "Addis Ababa", region: "Arat Kilo", sortOrder: 2 },
    { name: "Hawassa Resort Area", city: "Hawassa", region: "Sidama", sortOrder: 3 },
  ];

  for (const loc of locations) {
    await prisma.eventLocation.upsert({
      where: { name_city: { name: loc.name, city: loc.city } },
      create: { ...loc, country: "Ethiopia", isActive: true },
      update: { region: loc.region, sortOrder: loc.sortOrder, isActive: true },
    });
  }

  console.log(`Seeded ${locations.length} event locations`);

  await prisma.systemSetting.upsert({
    where: { key: "platform" },
    create: {
      key: "platform",
      description: "Platform-wide settings",
      value: {
        platformName: "Hibir Events",
        maintenanceMode: false,
        maxTicketsPerOrder: 10,
        supportEmail: "support@hibir.events",
        allowOrganizerSignup: true,
      },
    },
    update: {},
  });

  console.log("Platform settings ready");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
