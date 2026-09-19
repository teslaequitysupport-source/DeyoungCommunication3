import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  // Fix the hero title: restore the missing "n" of "never".
  await db.contentBlock.update({
    where: { key: "home.hero.title" },
    data: { value: "Hire intelligence that\nnever puts a caller on hold." },
  });
  console.log("hero title fixed");

  // Audit every content block that contains a newline for similar mangling.
  const blocks = await db.contentBlock.findMany();
  for (const b of blocks) {
    if (b.value.includes("\n")) {
      console.log("---", b.key, "=>", JSON.stringify(b.value.slice(0, 160)));
    }
  }
}

main().finally(() => db.$disconnect());
