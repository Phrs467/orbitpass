import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, findUserByDocument } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, cpf, cnpj } = body;

    // 1. Checa por email no Neon DB
    if (email) {
      const user = await findUserByEmail(email);
      if (user) {
        return NextResponse.json({ exists: true, user });
      }
    }

    // 2. Checa por CPF no Neon DB
    if (cpf) {
      const existingCpfUser = await findUserByDocument(cpf, false);
      if (existingCpfUser && existingCpfUser.email?.toLowerCase() !== email?.toLowerCase()) {
        return NextResponse.json({ exists: true, docConflict: true, message: "Este CPF já está cadastrado em outra conta no Neon DB." });
      }
    }

    // 3. Checa por CNPJ no Neon DB
    if (cnpj) {
      const existingCnpjUser = await findUserByDocument(cnpj, true);
      if (existingCnpjUser && existingCnpjUser.email?.toLowerCase() !== email?.toLowerCase()) {
        return NextResponse.json({ exists: true, docConflict: true, message: "Este CNPJ já está cadastrado em outra conta no Neon DB." });
      }
    }

    return NextResponse.json({ exists: false, user: null });
  } catch (error: any) {
    console.error("API /api/auth/check error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
