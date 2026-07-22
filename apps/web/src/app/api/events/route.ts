import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Garante que as tabelas e colunas necessárias existam totalmente em Português no Neon DB
async function ensureTables() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "Evento" (
        "id" TEXT PRIMARY KEY,
        "titulo" TEXT NOT NULL,
        "descricao" TEXT,
        "cidade" TEXT NOT NULL,
        "estado" TEXT DEFAULT 'SP',
        "local" TEXT NOT NULL,
        "categoria" TEXT DEFAULT 'SHOW',
        "dataInicio" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "dataFim" TIMESTAMP,
        "bannerUrl" TEXT,
        "status" TEXT NOT NULL DEFAULT 'PUBLICADO',
        "classificacao" INTEGER DEFAULT 0,
        "produtorId" TEXT,
        "capacidadeTotal" INTEGER DEFAULT 1000,
        "ingressosVendidos" INTEGER DEFAULT 0,
        "receita" TEXT DEFAULT '0,00',
        "areas" JSONB,
        "cupons" JSONB,
        "dataCriacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`ALTER TABLE "Evento" ADD COLUMN IF NOT EXISTS "capacidadeTotal" INTEGER DEFAULT 1000`;
    await sql`ALTER TABLE "Evento" ADD COLUMN IF NOT EXISTS "ingressosVendidos" INTEGER DEFAULT 0`;
    await sql`ALTER TABLE "Evento" ADD COLUMN IF NOT EXISTS "receita" TEXT DEFAULT '0,00'`;
    await sql`ALTER TABLE "Evento" ADD COLUMN IF NOT EXISTS "areas" JSONB`;
    await sql`ALTER TABLE "Evento" ADD COLUMN IF NOT EXISTS "cupons" JSONB`;
    await sql`ALTER TABLE "Evento" ADD COLUMN IF NOT EXISTS "estado" TEXT DEFAULT 'SP'`;
    await sql`ALTER TABLE "Evento" ADD COLUMN IF NOT EXISTS "mapaGeralUrl" TEXT`;
    await sql`ALTER TABLE "Evento" ADD COLUMN IF NOT EXISTS "mapaCamarotesUrl" TEXT`;

    await sql`
      CREATE TABLE IF NOT EXISTS "Lote" (
        "id" TEXT PRIMARY KEY,
        "eventoId" TEXT NOT NULL,
        "nome" TEXT NOT NULL,
        "preco" NUMERIC NOT NULL DEFAULT 0,
        "quantidadeTotal" INTEGER NOT NULL DEFAULT 100,
        "dataValidade" TEXT,
        "status" TEXT DEFAULT 'ATIVO',
        "quantidadeVendida" INTEGER DEFAULT 0
      );
    `;
    await sql`ALTER TABLE "Lote" ADD COLUMN IF NOT EXISTS "quantidadeTotal" INTEGER DEFAULT 100`;
    await sql`ALTER TABLE "Lote" ADD COLUMN IF NOT EXISTS "quantidadeVendida" INTEGER DEFAULT 0`;
    await sql`ALTER TABLE "Lote" ADD COLUMN IF NOT EXISTS "dataValidade" TEXT`;
    await sql`ALTER TABLE "Lote" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'ATIVO'`;
    
    // Categorias de Ingressos (Inteira, Meia, Solidária, Idoso)
    await sql`ALTER TABLE "Lote" ADD COLUMN IF NOT EXISTS "inteiraPreco" NUMERIC`;
    await sql`ALTER TABLE "Lote" ADD COLUMN IF NOT EXISTS "inteiraQtd" INTEGER`;
    await sql`ALTER TABLE "Lote" ADD COLUMN IF NOT EXISTS "inteiraQtdVendida" INTEGER DEFAULT 0`;
    
    await sql`ALTER TABLE "Lote" ADD COLUMN IF NOT EXISTS "meiaPreco" NUMERIC`;
    await sql`ALTER TABLE "Lote" ADD COLUMN IF NOT EXISTS "meiaQtd" INTEGER`;
    await sql`ALTER TABLE "Lote" ADD COLUMN IF NOT EXISTS "meiaQtdVendida" INTEGER DEFAULT 0`;
    
    await sql`ALTER TABLE "Lote" ADD COLUMN IF NOT EXISTS "solidariaPreco" NUMERIC`;
    await sql`ALTER TABLE "Lote" ADD COLUMN IF NOT EXISTS "solidariaQtd" INTEGER`;
    await sql`ALTER TABLE "Lote" ADD COLUMN IF NOT EXISTS "solidariaQtdVendida" INTEGER DEFAULT 0`;
    
    await sql`ALTER TABLE "Lote" ADD COLUMN IF NOT EXISTS "idosoPreco" NUMERIC`;
    await sql`ALTER TABLE "Lote" ADD COLUMN IF NOT EXISTS "idosoQtd" INTEGER`;
    await sql`ALTER TABLE "Lote" ADD COLUMN IF NOT EXISTS "idosoQtdVendida" INTEGER DEFAULT 0`;
  } catch (err) {
    console.error("Erro ao verificar/migrar tabelas em português no Neon DB:", err);
  }
}

// Converte string de data no formato DD/MM/YYYY para ISO TIMESTAMP
function parseDateToIso(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  try {
    if (dateStr.includes("/")) {
      const parts = dateStr.split(" ");
      const dateParts = parts[0].split("/");
      if (dateParts.length === 3) {
        const day = dateParts[0].padStart(2, "0");
        const month = dateParts[1].padStart(2, "0");
        const year = dateParts[2];
        const timePart = parts[1] || "20:00:00";
        return `${year}-${month}-${day}T${timePart}.000Z`;
      }
    }
    // Retorna a string exata caso já seja um formato válido T, sem converter para UTC
    if (dateStr.includes("T")) {
       return dateStr;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch (e) {
    console.error("Erro ao converter data:", e);
  }
  return new Date().toISOString();
}

export async function GET(request: Request) {
  await ensureTables();
  const { searchParams } = new URL(request.url);
  const produtorIdOrEmail = searchParams.get("produtorId");

  try {
    let events;
    if (produtorIdOrEmail && produtorIdOrEmail !== "all") {
      events = await sql`
        SELECT 
          e."id",
          e."titulo",
          e."descricao",
          e."cidade",
          e."estado",
          e."local",
          e."categoria",
          e."dataInicio",
          e."dataFim",
          e."bannerUrl",
          e."mapaGeralUrl",
          e."mapaCamarotesUrl",
          e."status",
          e."classificacao",
          e."produtorId",
          e."capacidadeTotal",
          e."ingressosVendidos",
          e."receita",
          e."areas",
          e."cupons",
          e."dataCriacao"
        FROM "Evento" e
        WHERE e."produtorId" = ${produtorIdOrEmail}
           OR e."produtorId" IN (
             SELECT u."id" FROM "Usuario" u WHERE LOWER(u."email") = LOWER(${produtorIdOrEmail})
           )
        ORDER BY e."dataCriacao" DESC;
      `;
    } else {
      events = await sql`
        SELECT 
          e."id",
          e."titulo",
          e."descricao",
          e."cidade",
          e."estado",
          e."local",
          e."categoria",
          e."dataInicio",
          e."dataFim",
          e."bannerUrl",
          e."mapaGeralUrl",
          e."mapaCamarotesUrl",
          e."status",
          e."classificacao",
          e."produtorId",
          e."capacidadeTotal",
          e."ingressosVendidos",
          e."receita",
          e."areas",
          e."cupons",
          e."dataCriacao",
          (
            SELECT MIN(l."preco") FROM "Lote" l WHERE l."eventoId" = e."id" AND l."status" = 'ATIVO'
          ) AS "menorPreco",
          (
            SELECT l."nome" FROM "Lote" l WHERE l."eventoId" = e."id" AND l."status" = 'ATIVO' ORDER BY l."preco" ASC LIMIT 1
          ) AS "loteAtivo"
        FROM "Evento" e
        WHERE e."status" = 'PUBLICADO'
        ORDER BY e."dataCriacao" DESC;
      `;
    }

    const normalizedEvents = events.map((e: any) => ({
      id: e.id,
      titulo: e.titulo || e.title || "Novo Evento",
      title: e.titulo || e.title || "Novo Evento",
      cidade: e.cidade || e.city || "São Paulo",
      city: e.cidade || e.city || "São Paulo",
      estado: e.estado || "SP",
      local: e.local || e.location || "Arena Principal",
      location: e.local || e.location || "Arena Principal",
      categoria: e.categoria || "SHOW",
      date: e.dataInicio ? new Date(e.dataInicio).toLocaleDateString("pt-BR") : "30/12/2024",
      dataInicio: e.dataInicio || null,
      status: e.status || "PUBLICADO",
      classificacao: e.classificacao || 0,
      descricao: e.descricao || "",
      description: e.descricao || "",
      mapaGeralUrl: e.mapaGeralUrl || null,
      mapaCamarotesUrl: e.mapaCamarotesUrl || null,
      totalCapacity: e.capacidadeTotal || 1000,
      ticketsSold: e.ingressosVendidos || 0,
      revenue: e.receita || "0,00",
      areas: typeof e.areas === "string" ? JSON.parse(e.areas) : (e.areas || []),
      lots: typeof e.areas === "string" ? JSON.parse(e.areas)[0]?.lots : (e.areas?.[0]?.lots || []),
      coupons: typeof e.cupons === "string" ? JSON.parse(e.cupons) : (e.cupons || []),
      menorPreco: e.menorPreco,
      loteAtivo: e.loteAtivo,
      produtorId: e.produtorId,
    }));

    return NextResponse.json({ events: normalizedEvents });
  } catch (error: any) {
    console.error("Erro ao buscar eventos do Neon DB:", error);
    return NextResponse.json({ events: [], error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await ensureTables();

  try {
    const body = await request.json();
    const {
      id,
      title,
      city = "São Paulo",
      estado = "SP",
      location = "Arena Principal",
      date = "30/12/2024",
      categoria = "SHOW",
      status = "PUBLICADO",
      classificacao = 0,
      totalCapacity = 1000,
      ticketsSold = 0,
      revenue = "0,00",
      areas = [],
      coupons = [],
      produtorId,
    } = body;

    let realProdutorId = produtorId;
    if (produtorId) {
      const userRows = await sql`
        SELECT "id" FROM "Usuario"
        WHERE "id" = ${produtorId} OR LOWER("email") = LOWER(${produtorId})
        LIMIT 1;
      `;
      if (userRows.length > 0) {
        realProdutorId = userRows[0].id;
      } else {
        const anyUser = await sql`SELECT "id" FROM "Usuario" LIMIT 1`;
        if (anyUser.length > 0) {
          realProdutorId = anyUser[0].id;
        }
      }
    } else {
      const anyUser = await sql`SELECT "id" FROM "Usuario" LIMIT 1`;
      if (anyUser.length > 0) {
        realProdutorId = anyUser[0].id;
      }
    }

    const eventId = id || `evt-${Date.now()}`;
    const isoDate = parseDateToIso(date);
    const areasJson = JSON.stringify(areas);
    const couponsJson = JSON.stringify(coupons);

    const description = body.descricao || body.description || "";

    await sql`
      INSERT INTO "Evento" (
        "id", "titulo", "descricao", "cidade", "estado", "local", "dataInicio", "categoria", "status", "classificacao", "produtorId", "capacidadeTotal", "ingressosVendidos", "receita", "areas", "cupons"
      ) VALUES (
        ${eventId},
        ${title || "Novo Evento"},
        ${description},
        ${city},
        ${estado || "SP"},
        ${location},
        ${isoDate}::timestamp,
        ${categoria},
        ${status},
        ${classificacao},
        ${realProdutorId},
        ${totalCapacity},
        ${ticketsSold},
        ${revenue},
        ${areasJson}::jsonb,
        ${couponsJson}::jsonb
      )
      ON CONFLICT ("id") DO UPDATE SET
        "titulo" = EXCLUDED."titulo",
        "descricao" = EXCLUDED."descricao",
        "cidade" = EXCLUDED."cidade",
        "estado" = EXCLUDED."estado",
        "local" = EXCLUDED."local",
        "dataInicio" = EXCLUDED."dataInicio",
        "categoria" = EXCLUDED."categoria",
        "status" = EXCLUDED."status",
        "classificacao" = EXCLUDED."classificacao",
        "capacidadeTotal" = EXCLUDED."capacidadeTotal",
        "ingressosVendidos" = EXCLUDED."ingressosVendidos",
        "receita" = EXCLUDED."receita",
        "areas" = EXCLUDED."areas",
        "cupons" = EXCLUDED."cupons";
    `;

    await sql`DELETE FROM "Lote" WHERE "eventoId" = ${eventId}`;

    for (const area of areas) {
      // Allow any area that has lots to be saved in the Lote table, even if type isn't strictly PISTA
      if (area.lots && Array.isArray(area.lots)) {
        for (const lot of area.lots) {
          const lotId = lot.id || `lote-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
          
          const inteiraP = lot.inteiraPreco ? parseFloat(lot.inteiraPreco.toString().replace(",", ".")) : null;
          const meiaP = lot.meiaPreco ? parseFloat(lot.meiaPreco.toString().replace(",", ".")) : null;
          const solidariaP = lot.solidariaPreco ? parseFloat(lot.solidariaPreco.toString().replace(",", ".")) : null;
          const idosoP = lot.idosoPreco ? parseFloat(lot.idosoPreco.toString().replace(",", ".")) : null;

          const prices = [inteiraP, meiaP, solidariaP, idosoP].filter(p => p !== null) as number[];
          const minCategoryPrice = prices.length > 0 ? Math.min(...prices) : null;

          const priceNum = minCategoryPrice !== null 
            ? minCategoryPrice 
            : (parseFloat((lot.price || "0").toString().replace(",", ".")) || 0);
          
          const inteiraQtd = lot.inteiraQtd ? parseInt(lot.inteiraQtd, 10) : null;
          const meiaQtd = lot.meiaQtd ? parseInt(lot.meiaQtd, 10) : null;
          const solidariaQtd = lot.solidariaQtd ? parseInt(lot.solidariaQtd, 10) : null;
          const idosoQtd = lot.idosoQtd ? parseInt(lot.idosoQtd, 10) : null;

          const hasCategories = inteiraQtd !== null || meiaQtd !== null || solidariaQtd !== null || idosoQtd !== null;
          
          const qty = hasCategories 
            ? (inteiraQtd || 0) + (meiaQtd || 0) + (solidariaQtd || 0) + (idosoQtd || 0)
            : (parseInt(lot.quantity || lot.total || "100", 10) || 100);
            
          const soldNum = parseInt(lot.sold || "0", 10) || 0;
          
          await sql`
            INSERT INTO "Lote" (
              "id", "eventoId", "nome", "preco", "quantidadeTotal", "dataValidade", "status", "quantidadeVendida",
              "inteiraPreco", "inteiraQtd", "meiaPreco", "meiaQtd", "solidariaPreco", "solidariaQtd", "idosoPreco", "idosoQtd"
            ) VALUES (
              ${lotId},
              ${eventId},
              ${lot.name},
              ${priceNum},
              ${qty},
              ${lot.endDate || null},
              ${lot.status || "ATIVO"},
              ${soldNum},
              ${lot.inteiraPreco ? parseFloat(lot.inteiraPreco.toString().replace(",", ".")) : null},
              ${inteiraQtd},
              ${lot.meiaPreco ? parseFloat(lot.meiaPreco.toString().replace(",", ".")) : null},
              ${meiaQtd},
              ${lot.solidariaPreco ? parseFloat(lot.solidariaPreco.toString().replace(",", ".")) : null},
              ${solidariaQtd},
              ${lot.idosoPreco ? parseFloat(lot.idosoPreco.toString().replace(",", ".")) : null},
              ${idosoQtd}
            )
            ON CONFLICT ("id") DO NOTHING;
          `;
        }
      }
    }

    const savedEvent = {
      id: eventId,
      title,
      city,
      location,
      date,
      status,
      totalCapacity,
      ticketsSold,
      revenue,
      areas,
      coupons,
      produtorId: realProdutorId,
    };

    return NextResponse.json({ success: true, event: savedEvent });
  } catch (error: any) {
    console.error("Erro ao salvar evento em português no Neon DB:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  await ensureTables();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ success: false, error: "ID do evento não informado" }, { status: 400 });
  }

  try {
    // Regra de Negócio: Verifica se há vendas realizadas antes de permitir a exclusão
    const existing = await sql`
      SELECT "ingressosVendidos" FROM "Evento" WHERE "id" = ${id} LIMIT 1;
    `;

    if (existing.length > 0 && (existing[0].ingressosVendidos || 0) > 0) {
      return NextResponse.json({
        success: false,
        error: "Este evento possui ingressos vendidos e não pode ser excluído permanentemente. Altere o status para INATIVO.",
        hasSales: true,
      }, { status: 400 });
    }

    await sql`DELETE FROM "Lote" WHERE "eventoId" = ${id};`;
    await sql`DELETE FROM "Evento" WHERE "id" = ${id};`;

    return NextResponse.json({ success: true, message: "Evento excluído com sucesso." });
  } catch (error: any) {
    console.error("Erro ao excluir evento no Neon DB:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  await ensureTables();
  try {
    const body = await request.json();
    const { id, cupons } = body;
    if (!id || !cupons) {
      return NextResponse.json({ success: false, error: "Missing id or cupons" }, { status: 400 });
    }
    const cuponsJson = JSON.stringify(cupons);
    await sql`
      UPDATE "Evento" 
      SET "cupons" = ${cuponsJson}::jsonb
      WHERE "id" = ${id}
    `;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao atualizar cupons:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
