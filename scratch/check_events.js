const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_HXQklP89uiIZ@ep-delicate-mode-ac2kxsw1-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require');

async function check() {
  const cols = await sql`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'Evento' ORDER BY ordinal_position`;
  console.log("=== Colunas da tabela Evento ===");
  console.log(JSON.stringify(cols, null, 2));

  const events = await sql`SELECT * FROM "Evento" LIMIT 10`;
  console.log("\n=== Eventos existentes ===");
  console.log(JSON.stringify(events, null, 2));
  console.log("Total:", events.length);

  // Check Lote table too
  const loteCols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Lote' ORDER BY ordinal_position`;
  console.log("\n=== Colunas da tabela Lote ===");
  console.log(JSON.stringify(loteCols, null, 2));
}
check();
