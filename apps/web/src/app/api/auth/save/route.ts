import { NextRequest, NextResponse } from "next/server";
import { upsertUserInNeon } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, email, funcao, tipoPessoa, cpf, cnpj, razaoSocial, nomeFantasia, telefone, dataNascimento } = body;

    if (!email) {
      return NextResponse.json({ error: "E-mail é obrigatório." }, { status: 400 });
    }

    const savedUser = await upsertUserInNeon({
      nome,
      email,
      funcao: funcao || "CLIENTE",
      tipoPessoa: tipoPessoa || "PESSOA_FISICA",
      cpf,
      cnpj,
      razaoSocial,
      nomeFantasia,
      telefone,
      dataNascimento,
    });

    console.log("✅ Usuário gravado com sucesso no Neon DB:", savedUser);
    return NextResponse.json({ success: true, user: savedUser });
  } catch (error: any) {
    console.error("API /api/auth/save error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
