const { PrismaClient } = require('../apps/api/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log("Conectando ao Neon DB...");
  try {
    const usersCount = await prisma.usuario.count();
    console.log("✅ Conexão estabelecida com sucesso! Total de usuários no Neon DB:", usersCount);
  } catch (err) {
    console.error("❌ Erro ao conectar com Neon DB:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
