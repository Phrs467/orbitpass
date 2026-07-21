const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_HXQklP89uiIZ@ep-delicate-mode-ac2kxsw1-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require');

async function migrate() {
  console.log("Adicionando colunas...");
  await sql`ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "dataNascimento" TEXT`;
  console.log("✓ dataNascimento adicionada na tabela Usuario");
  await sql`ALTER TABLE "Evento" ADD COLUMN IF NOT EXISTS "classificacao" INTEGER NOT NULL DEFAULT 0`;
  console.log("✓ classificacao adicionada na tabela Evento");
  console.log("Migração concluída.");
}
migrate();
