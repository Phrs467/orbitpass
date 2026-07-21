import { neon } from "@neondatabase/serverless";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_HXQklP89uiIZ@ep-delicate-mode-ac2kxsw1-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";

export const sql = neon(connectionString);

export interface UsuarioDbRow {
  id: string;
  firebaseUid?: string;
  nome: string;
  email: string;
  tipoPessoa: "PESSOA_FISICA" | "PESSOA_JURIDICA";
  cpf?: string;
  cnpj?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  telefone?: string;
  dataNascimento?: string;
  funcao: "CLIENTE" | "PRODUTOR" | "ADMIN" | "STAFF";
  isVerificado: boolean;
  dataCriacao?: string;
}

// 1. Busca usuário por e-mail no Neon DB
export async function findUserByEmail(email: string): Promise<UsuarioDbRow | null> {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  try {
    const rows = await sql`
      SELECT * FROM "Usuario" WHERE LOWER("email") = ${cleanEmail} LIMIT 1
    `;
    if (rows.length > 0) {
      const u = rows[0];
      return {
        id: u.id,
        firebaseUid: u.firebaseUid,
        nome: u.nome,
        email: u.email,
        tipoPessoa: u.tipoPessoa,
        cpf: u.cpf,
        cnpj: u.cnpj,
        razaoSocial: u.razaoSocial,
        nomeFantasia: u.nomeFantasia,
        telefone: u.telefone,
        dataNascimento: u.dataNascimento,
        funcao: u.funcao,
        isVerificado: u.isVerificado,
        dataCriacao: u.dataCriacao,
      };
    }
    return null;
  } catch (err) {
    console.error("Erro ao buscar usuario no Neon DB:", err);
    return null;
  }
}

// 2. Busca usuário por CPF ou CNPJ no Neon DB
export async function findUserByDocument(doc: string, isCnpj = false): Promise<UsuarioDbRow | null> {
  const cleanDoc = doc.replace(/\D/g, "");
  if (!cleanDoc) return null;
  try {
    const rows = isCnpj
      ? await sql`SELECT * FROM "Usuario" WHERE REPLACE(REPLACE(REPLACE("cnpj", '.', ''), '/', ''), '-', '') = ${cleanDoc} LIMIT 1`
      : await sql`SELECT * FROM "Usuario" WHERE REPLACE(REPLACE("cpf", '.', ''), '-', '') = ${cleanDoc} LIMIT 1`;
    
    if (rows.length > 0) {
      const u = rows[0];
      return {
        id: u.id,
        nome: u.nome,
        email: u.email,
        tipoPessoa: u.tipoPessoa,
        cpf: u.cpf,
        cnpj: u.cnpj,
        funcao: u.funcao,
        isVerificado: u.isVerificado,
      };
    }
    return null;
  } catch (err) {
    console.error("Erro ao buscar documento no Neon DB:", err);
    return null;
  }
}

// 3. Salva ou Atualiza usuário diretamente no Neon DB
export async function upsertUserInNeon(user: {
  nome: string;
  email: string;
  funcao: "CLIENTE" | "PRODUTOR" | "ADMIN";
  tipoPessoa: "PESSOA_FISICA" | "PESSOA_JURIDICA";
  cpf?: string;
  cnpj?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  telefone?: string;
  dataNascimento?: string;
}): Promise<UsuarioDbRow> {
  const cleanEmail = user.email.trim().toLowerCase();
  const id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  try {
    const existing = await findUserByEmail(cleanEmail);

    if (existing) {
      // Atualiza os dados do usuário existente no Neon DB
      const updatedRows = await sql`
        UPDATE "Usuario"
        SET 
          "nome" = ${user.nome},
          "funcao" = ${user.funcao}::"FuncaoUsuario",
          "tipoPessoa" = ${user.tipoPessoa}::"TipoPessoa",
          "cpf" = ${user.cpf || existing.cpf || null},
          "cnpj" = ${user.cnpj || existing.cnpj || null},
          "razaoSocial" = ${user.razaoSocial || existing.razaoSocial || null},
          "nomeFantasia" = ${user.nomeFantasia || existing.nomeFantasia || null},
          "telefone" = ${user.telefone || existing.telefone || null},
          "dataNascimento" = ${user.dataNascimento || existing.dataNascimento || null},
          "isVerificado" = true
        WHERE LOWER("email") = ${cleanEmail}
        RETURNING *;
      `;
      const u = updatedRows[0];
      return {
        id: u.id,
        nome: u.nome,
        email: u.email,
        tipoPessoa: u.tipoPessoa,
        cpf: u.cpf,
        cnpj: u.cnpj,
        razaoSocial: u.razaoSocial,
        nomeFantasia: u.nomeFantasia,
        telefone: u.telefone,
        dataNascimento: u.dataNascimento,
        funcao: u.funcao,
        isVerificado: u.isVerificado,
      };
    } else {
      // Insere novo registro na tabela Usuario do Neon DB
      const insertedRows = await sql`
        INSERT INTO "Usuario" (
          "id", "nome", "email", "funcao", "tipoPessoa", "cpf", "cnpj", "razaoSocial", "nomeFantasia", "telefone", "dataNascimento", "isVerificado"
        ) VALUES (
          ${id},
          ${user.nome},
          ${cleanEmail},
          ${user.funcao}::"FuncaoUsuario",
          ${user.tipoPessoa}::"TipoPessoa",
          ${user.cpf || null},
          ${user.cnpj || null},
          ${user.razaoSocial || null},
          ${user.nomeFantasia || null},
          ${user.telefone || null},
          ${user.dataNascimento || null},
          true
        )
        RETURNING *;
      `;
      const u = insertedRows[0];
      return {
        id: u.id,
        nome: u.nome,
        email: u.email,
        tipoPessoa: u.tipoPessoa,
        cpf: u.cpf,
        cnpj: u.cnpj,
        razaoSocial: u.razaoSocial,
        nomeFantasia: u.nomeFantasia,
        telefone: u.telefone,
        dataNascimento: u.dataNascimento,
        funcao: u.funcao,
        isVerificado: u.isVerificado,
      };
    }
  } catch (err) {
    console.error("Erro ao inserir/atualizar no Neon DB:", err);
    throw err;
  }
}
