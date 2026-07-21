const { Client } = require('pg');

const connString443 = "postgresql://neondb_owner:npg_HXQklP89uiIZ@ep-delicate-mode-ac2kxsw1-pooler.sa-east-1.aws.neon.tech:443/neondb?sslmode=require";

async function test443() {
  console.log("Tentando conexão via porta 443...");
  const client = new Client({ connectionString: connString443 });
  try {
    await client.connect();
    const res = await client.query('SELECT NOW(), current_database(), version()');
    console.log("SUCCESS_443_NEON_CONNECTED!", res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("FAIL_443", err);
  }
}

test443();
