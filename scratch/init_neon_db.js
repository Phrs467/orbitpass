const { neon } = require('@neondatabase/serverless');

const connectionString = "postgresql://neondb_owner:npg_HXQklP89uiIZ@ep-delicate-mode-ac2kxsw1-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(connectionString);

async function initDatabase() {
  console.log("🚀 Inicializando tabelas no Neon DB via HTTP / Serverless 443...");

  try {
    // 1. Enums
    await sql`
      DO $$ BEGIN
        CREATE TYPE "FuncaoUsuario" AS ENUM ('PRODUTOR', 'CLIENTE', 'ADMIN', 'STAFF');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `;
    await sql`
      DO $$ BEGIN
        CREATE TYPE "TipoPessoa" AS ENUM ('PESSOA_FISICA', 'PESSOA_JURIDICA');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `;
    await sql`
      DO $$ BEGIN
        CREATE TYPE "StatusEvento" AS ENUM ('RASCUNHO', 'PUBLICADO', 'CANCELADO', 'FINALIZADO');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `;
    await sql`
      DO $$ BEGIN
        CREATE TYPE "StatusLote" AS ENUM ('ATIVO', 'ESGOTADO', 'ENCERRADO');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `;
    await sql`
      DO $$ BEGIN
        CREATE TYPE "StatusIngresso" AS ENUM ('DISPONIVEL', 'RESERVADO', 'VENDIDO', 'EM_REVENDA', 'CHECKED_IN');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `;
    await sql`
      DO $$ BEGIN
        CREATE TYPE "TipoTransacao" AS ENUM ('COMPRA_DIRETA', 'TRANSFERENCIA', 'REVENDA');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `;
    await sql`
      DO $$ BEGIN
        CREATE TYPE "StatusTransacao" AS ENUM ('PENDENTE', 'CONCLUIDO', 'ESCROW', 'REEMBOLSADO');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `;

    console.log("✓ Enums criados.");

    // 2. Tabela Usuario
    await sql`
      CREATE TABLE IF NOT EXISTS "Usuario" (
        "id" TEXT PRIMARY KEY,
        "firebaseUid" TEXT UNIQUE,
        "nome" TEXT NOT NULL,
        "email" TEXT UNIQUE NOT NULL,
        "senhaHash" TEXT,
        "tipoPessoa" "TipoPessoa" NOT NULL DEFAULT 'PESSOA_FISICA',
        "cpf" TEXT UNIQUE,
        "cnpj" TEXT UNIQUE,
        "razaoSocial" TEXT,
        "nomeFantasia" TEXT,
        "telefone" TEXT,
        "funcao" "FuncaoUsuario" NOT NULL DEFAULT 'CLIENTE',
        "isVerificado" BOOLEAN NOT NULL DEFAULT false,
        "fotoUrl" TEXT,
        "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("✓ Tabela Usuario criada.");

    // 3. Tabela Evento
    await sql`
      CREATE TABLE IF NOT EXISTS "Evento" (
        "id" TEXT PRIMARY KEY,
        "produtorId" TEXT NOT NULL REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        "titulo" TEXT NOT NULL,
        "descricao" TEXT,
        "cidade" TEXT NOT NULL,
        "estado" TEXT NOT NULL,
        "local" TEXT NOT NULL,
        "categoria" TEXT NOT NULL DEFAULT 'Show',
        "dataInicio" TIMESTAMP(3) NOT NULL,
        "dataFim" TIMESTAMP(3),
        "bannerUrl" TEXT,
        "status" "StatusEvento" NOT NULL DEFAULT 'PUBLICADO',
        "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("✓ Tabela Evento criada.");

    // 4. Tabela Lote
    await sql`
      CREATE TABLE IF NOT EXISTS "Lote" (
        "id" TEXT PRIMARY KEY,
        "eventoId" TEXT NOT NULL REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        "nome" TEXT NOT NULL,
        "preco" DECIMAL(65,30) NOT NULL,
        "quantidadeTotal" INTEGER NOT NULL,
        "quantidadeVendida" INTEGER NOT NULL DEFAULT 0,
        "limitePorCpf" INTEGER NOT NULL DEFAULT 4,
        "status" "StatusLote" NOT NULL DEFAULT 'ATIVO',
        "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("✓ Tabela Lote criada.");

    // 5. Tabela Cupom
    await sql`
      CREATE TABLE IF NOT EXISTS "Cupom" (
        "id" TEXT PRIMARY KEY,
        "eventoId" TEXT NOT NULL REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        "codigo" TEXT NOT NULL,
        "descontoPercentual" DECIMAL(65,30),
        "descontoValor" DECIMAL(65,30),
        "quantidadeMax" INTEGER NOT NULL,
        "quantidadeUsada" INTEGER NOT NULL DEFAULT 0,
        "ativo" BOOLEAN NOT NULL DEFAULT true,
        "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("✓ Tabela Cupom criada.");

    // 6. Tabela Ingresso
    await sql`
      CREATE TABLE IF NOT EXISTS "Ingresso" (
        "id" TEXT PRIMARY KEY,
        "loteId" TEXT NOT NULL REFERENCES "Lote"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        "compradorId" TEXT NOT NULL REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        "status" "StatusIngresso" NOT NULL DEFAULT 'VENDIDO',
        "codigoSegredo" TEXT NOT NULL,
        "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("✓ Tabela Ingresso criada.");

    // 7. Tabela VendaCupom
    await sql`
      CREATE TABLE IF NOT EXISTS "VendaCupom" (
        "id" TEXT PRIMARY KEY,
        "ingressoId" TEXT UNIQUE NOT NULL REFERENCES "Ingresso"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        "cupomId" TEXT NOT NULL REFERENCES "Cupom"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        "valorDesconto" DECIMAL(65,30) NOT NULL,
        "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("✓ Tabela VendaCupom criada.");

    // 8. Tabela Transacao
    await sql`
      CREATE TABLE IF NOT EXISTS "Transacao" (
        "id" TEXT PRIMARY KEY,
        "ingressoId" TEXT NOT NULL REFERENCES "Ingresso"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        "deUsuarioId" TEXT REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        "paraUsuarioId" TEXT NOT NULL REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        "tipo" "TipoTransacao" NOT NULL DEFAULT 'COMPRA_DIRETA',
        "valor" DECIMAL(65,30) NOT NULL,
        "taxaPlataforma" DECIMAL(65,30) NOT NULL DEFAULT 0,
        "status" "StatusTransacao" NOT NULL DEFAULT 'CONCLUIDO',
        "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("✓ Tabela Transacao criada.");

    // 9. Tabela Checkin
    await sql`
      CREATE TABLE IF NOT EXISTS "Checkin" (
        "id" TEXT PRIMARY KEY,
        "ingressoId" TEXT UNIQUE NOT NULL REFERENCES "Ingresso"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        "validadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "validadorId" TEXT NOT NULL
      );
    `;
    console.log("✓ Tabela Checkin criada.");

    // Listar tabelas criadas no banco de dados Neon do usuário
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log("🎉 TABELAS ATUAIS NO NEON DB DO USUÁRIO:", tables.map(t => t.table_name));

  } catch (err) {
    console.error("❌ Erro ao criar tabelas no Neon DB:", err);
  }
}

initDatabase();
