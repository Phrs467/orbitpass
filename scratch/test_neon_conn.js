const { Client } = require('pg');

const connStringPooler = "postgresql://neondb_owner:npg_HXQklP89uiIZ@ep-delicate-mode-ac2kxsw1-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";
const connStringDirect = "postgresql://neondb_owner:npg_HXQklP89uiIZ@ep-delicate-mode-ac2kxsw1.sa-east-1.aws.neon.tech/neondb?sslmode=require";

async function testConn() {
  console.log("Testando conexão Pooler...");
  const clientPooler = new Client({ connectionString: connStringPooler });
  try {
    await clientPooler.connect();
    const res = await clientPooler.query('SELECT NOW(), current_database()');
    console.log("✅ Pooler conectado com sucesso! Data/DB:", res.rows[0]);
    await clientPooler.end();
  } catch (err) {
    console.error("❌ Pooler erro:", err.message);
  }

  console.log("Testando conexão Direta...");
  const clientDirect = new Client({ connectionString: connStringDirect });
  try {
    await clientDirect.connect();
    const res = await clientDirect.query('SELECT NOW(), current_database()');
    console.log("✅ Conexão Direta conectada com sucesso! Data/DB:", res.rows[0]);
    await clientDirect.end();
  } catch (err) {
    console.error("❌ Conexão Direta erro:", err.message);
  }
}

testConn();
