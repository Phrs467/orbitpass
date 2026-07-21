const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

// Configura o WebSocket para o driver serverless do Neon se necessário
neonConfig.webSocketConstructor = ws;

const connectionString = "postgresql://neondb_owner:npg_HXQklP89uiIZ@ep-delicate-mode-ac2kxsw1-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";

async function testNeon() {
  console.log("Tentando conectar ao Neon via @neondatabase/serverless...");
  const pool = new Pool({ connectionString });
  try {
    const res = await pool.query('SELECT NOW(), version()');
    console.log("SUCCESS_NEON_CONNECTED", res.rows[0]);
  } catch (err) {
    console.error("FAIL_NEON", err);
  } finally {
    await pool.end();
  }
}

testNeon();
