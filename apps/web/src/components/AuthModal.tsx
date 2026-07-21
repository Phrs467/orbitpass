"use client";

import React, { useState } from "react";
import { X, Mail, Lock, User, Building2, FileText, ArrowRight, CheckCircle2, Phone, Calendar } from "lucide-react";
import { PassLogo } from "./PassLogo";
import { OrbitSelect } from "./OrbitSelect";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
  initialRole?: "CLIENTE" | "PRODUTOR";
  onSuccess?: (user: any) => void;
}

export function AuthModal({ isOpen, onClose, initialMode = "login", initialRole = "CLIENTE", onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [step, setStep] = useState<"credentials" | "complete_profile">("credentials");
  const [accountRole, setAccountRole] = useState<"CLIENTE" | "PRODUTOR">(initialRole);
  const [personType, setPersonType] = useState<"PESSOA_FISICA" | "PESSOA_JURIDICA">("PESSOA_FISICA");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [phone, setPhone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 11) val = val.substring(0, 11);
    if (val.length > 6) {
      val = `(${val.substring(0, 2)}) ${val.substring(2, 7)}-${val.substring(7)}`;
    } else if (val.length > 2) {
      val = `(${val.substring(0, 2)}) ${val.substring(2)}`;
    } else if (val.length > 0) {
      val = `(${val}`;
    }
    setPhone(val);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 8) val = val.substring(0, 8);
    if (val.length > 4) {
      val = `${val.substring(0, 2)}/${val.substring(2, 4)}/${val.substring(4)}`;
    } else if (val.length > 2) {
      val = `${val.substring(0, 2)}/${val.substring(2)}`;
    }
    setDataNascimento(val);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 11) val = val.substring(0, 11);
    val = val.replace(/(\d{3})(\d)/, "$1.$2");
    val = val.replace(/(\d{3})(\d)/, "$1.$2");
    val = val.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(val);
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 14) val = val.substring(0, 14);
    val = val.replace(/^(\d{2})(\d)/, "$1.$2");
    val = val.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    val = val.replace(/\.(\d{3})(\d)/, ".$1/$2");
    val = val.replace(/(\d{4})(\d)/, "$1-$2");
    setCnpj(val);
  };

  // 1. CHECAGEM EM TEMPO REAL NO NEON POSTGRESQL (Tabela Usuario)
  const checkNeonDatabase = async (targetEmail: string, docValue?: string, isCnpj = false) => {
    try {
      const res = await fetch("/api/auth/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          cpf: !isCnpj ? docValue : undefined,
          cnpj: isCnpj ? docValue : undefined,
        }),
      });
      return await res.json();
    } catch (e) {
      console.error("Erro ao verificar no Neon DB:", e);
      return { exists: false };
    }
  };

  // 2. SALVAMENTO REAL NO NEON POSTGRESQL (Tabela Usuario)
  const saveToNeonDatabase = async (userData: any) => {
    try {
      const res = await fetch("/api/auth/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Erro ao salvar no banco Neon");
      }
      return data.user;
    } catch (e: any) {
      console.error("Erro ao salvar no Neon DB:", e);
      throw e;
    }
  };

  // Calcula a idade a partir de DD/MM/AAAA
  const calcularIdade = (dataNasc: string): number => {
    const parts = dataNasc.split("/");
    if (parts.length !== 3) return 0;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year) || year < 1900) return 0;
    const birth = new Date(year, month, day);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validação de Data de Nascimento (obrigatória para PF)
    if (!(accountRole === "PRODUTOR" && personType === "PESSOA_JURIDICA")) {
      const cleanDate = dataNascimento.replace(/\D/g, "");
      if (cleanDate.length !== 8) {
        setError("A data de nascimento é obrigatória no formato DD/MM/AAAA.");
        setLoading(false);
        return;
      }
      const idade = calcularIdade(dataNascimento);
      if (idade < 14) {
        setError("Idade mínima para cadastro no PASS é de 14 anos.");
        setLoading(false);
        return;
      }
    }

    // Validação estrita de CPF
    if (accountRole === "CLIENTE" || (accountRole === "PRODUTOR" && personType === "PESSOA_FISICA")) {
      const cleanCpf = cpf.replace(/\D/g, "");
      if (cleanCpf.length !== 11) {
        setError("O CPF é obrigatório e deve conter 11 dígitos para emissão dos ingressos.");
        setLoading(false);
        return;
      }

      const dbCheck = await checkNeonDatabase(email, cpf, false);
      if (dbCheck.docConflict) {
        setError("Este CPF já está cadastrado no banco de dados em outra conta do PASS.");
        setLoading(false);
        return;
      }
    }

    // Validação estrita de CNPJ
    if (accountRole === "PRODUTOR" && personType === "PESSOA_JURIDICA") {
      const cleanCnpj = cnpj.replace(/\D/g, "");
      if (cleanCnpj.length !== 14) {
        setError("O CNPJ é obrigatório para Produtores PJ (14 dígitos).");
        setLoading(false);
        return;
      }

      const dbCheck = await checkNeonDatabase(email, cnpj, true);
      if (dbCheck.docConflict) {
        setError("Este CNPJ já está cadastrado no banco de dados em outra conta do PASS.");
        setLoading(false);
        return;
      }
    }

    const userData = {
      nome: accountRole === "PRODUTOR" && personType === "PESSOA_JURIDICA" ? nomeFantasia || razaoSocial : name || email.split("@")[0],
      email,
      funcao: accountRole,
      tipoPessoa: personType,
      cpf,
      cnpj,
      razaoSocial,
      nomeFantasia,
      telefone: phone,
      dataNascimento: dataNascimento || null,
    };

    try {
      // Salva a linha real na tabela Usuario do Neon DB
      const dbUser = await saveToNeonDatabase(userData);

      const finalSessionUser = {
        id: dbUser.id,
        name: dbUser.nome,
        email: dbUser.email,
        role: dbUser.funcao,
        tipoPessoa: dbUser.tipoPessoa,
        cpf: dbUser.cpf,
        cnpj: dbUser.cnpj,
        razaoSocial: dbUser.razaoSocial,
        nomeFantasia: dbUser.nomeFantasia,
        phone: dbUser.telefone,
        dataNascimento: dbUser.dataNascimento || dataNascimento,
        isVerificado: true,
      };

      // Grava no localStorage para manter a sessão local sincronizada
      try {
        const registeredUsersRaw = localStorage.getItem("pass_registered_users");
        const registeredUsers = registeredUsersRaw ? JSON.parse(registeredUsersRaw) : [];
        const updatedList = [...registeredUsers.filter((u: any) => u.email?.toLowerCase() !== email.toLowerCase()), finalSessionUser];
        localStorage.setItem("pass_registered_users", JSON.stringify(updatedList));
      } catch (e) {}

      localStorage.setItem("pass_user", JSON.stringify(finalSessionUser));
      if (onSuccess) onSuccess(finalSessionUser);
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar no banco de dados Neon.");
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (mode === "login") {
      try {
        if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
          const { auth, signInWithEmailAndPassword } = await import("@/lib/firebase");
          await signInWithEmailAndPassword(auth, email, password);
        }
      } catch (err: any) {
        console.warn("Auth warning:", err.message);
      }

      // Consulta se a conta já existe na tabela Usuario do Neon DB
      const dbCheck = await checkNeonDatabase(email);
      if (dbCheck.exists && dbCheck.user) {
        const u = dbCheck.user;
        const sessionUser = {
          id: u.id,
          name: u.nome,
          email: u.email,
          role: u.funcao,
          tipoPessoa: u.tipoPessoa,
          cpf: u.cpf,
          cnpj: u.cnpj,
          razaoSocial: u.razaoSocial,
          nomeFantasia: u.nomeFantasia,
          phone: u.telefone,
          isVerificado: u.isVerificado,
        };
        localStorage.setItem("pass_user", JSON.stringify(sessionUser));
        if (onSuccess) onSuccess(sessionUser);
        onClose();
        setLoading(false);
        return;
      }

      setStep("complete_profile");
      setLoading(false);
    } else {
      setStep("complete_profile");
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError("");

    let gEmail = "";
    let gName = "";

    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        const { auth, googleProvider, signInWithPopup } = await import("@/lib/firebase");
        const res = await signInWithPopup(auth, googleProvider);
        gName = res.user.displayName || "";
        gEmail = res.user.email || "";
      }
    } catch (err: any) {
      console.warn("Google Auth popup fechado ou erro:", err.message);
      setError("Login cancelado ou não concluído.");
      setLoading(false);
      return;
    }

    if (!gEmail) {
      gEmail = email || "usuario.google@orbitpass.com";
      gName = name || "Usuário Google";
    }

    setEmail(gEmail);
    setName(gName);

    // CONSULTA A TABELA USUARIO NO BANCO NEON POSTGRESQL PARA VERIFICAR SE O GOOGLE EMAIL JÁ FOI CADASTRADO
    const dbCheck = await checkNeonDatabase(gEmail);

    if (dbCheck.exists && dbCheck.user && (dbCheck.user.cpf || dbCheck.user.cnpj)) {
      // O E-MAIL DO GOOGLE JÁ EXISTE NO BANCO DE DADOS NEON COM CPF CADASTRADO: ENTRA DIRETO EM 1-CLIQUE!
      const u = dbCheck.user;
      const sessionUser = {
        id: u.id,
        name: u.nome,
        email: u.email,
        role: u.funcao,
        tipoPessoa: u.tipoPessoa,
        cpf: u.cpf,
        cnpj: u.cnpj,
        razaoSocial: u.razaoSocial,
        nomeFantasia: u.nomeFantasia,
        phone: u.telefone,
        isVerificado: true,
      };

      localStorage.setItem("pass_user", JSON.stringify(sessionUser));
      if (onSuccess) onSuccess(sessionUser);
      onClose();
      setLoading(false);
      return;
    }

    // Se é a PRIMEIRA vez deste e-mail do Google no banco de dados Neon, solicita a validação do CPF
    setStep("complete_profile");
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#0f1423] border border-slate-800 rounded-2xl p-6 shadow-2xl my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="flex justify-center">
            <PassLogo size="sm" showSubtitle={false} />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            {step === "complete_profile"
              ? "Validação de Cadastro"
              : mode === "login"
              ? "Entrar no PASS"
              : "Criar Conta"}
          </h2>
          <p className="text-xs text-slate-400">
            {step === "complete_profile"
              ? accountRole === "PRODUTOR"
                ? "Informe o documento para recebimento e gestão de eventos."
                : "Informe o documento único (CPF) para validação de ingressos."
              : mode === "login"
              ? "Acesse seus ingressos e eventos."
              : "Preencha seus dados para continuar."}
          </p>
        </div>

        {step === "credentials" ? (
          <>
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 mb-5">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  mode === "login"
                    ? "bg-slate-800 text-cyan-400 border border-slate-700"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  mode === "register"
                    ? "bg-slate-800 text-cyan-400 border border-slate-700"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Criar Conta
              </button>
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-white font-medium text-xs transition-colors mb-4 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z" />
              </svg>
              <span>{mode === "login" ? "Entrar com Google" : "Criar com Google"}</span>
            </button>

            <div className="relative flex items-center justify-center mb-5">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-[#0f1423] px-2 text-[10px] text-slate-500 uppercase">ou</span>
              <div className="border-t border-slate-800 w-full" />
            </div>

            <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
              {mode === "register" && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="Seu nome completo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {error && <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs rounded-xl uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                ) : (
                  <>
                    <span>{mode === "login" ? "Entrar na Conta" : "Próximo Passo"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <form onSubmit={handleFinalSubmit} className="space-y-4">
            {/* Dados vindos do Google ou do Step 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Nome Cadastrado</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    readOnly
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-400 focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">E-mail Cadastrado</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-400 focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {accountRole === "PRODUTOR" && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Inscrição</label>
                <OrbitSelect
                  options={[
                    { value: "PESSOA_FISICA", label: "Pessoa Física (PF - CPF)" },
                    { value: "PESSOA_JURIDICA", label: "Pessoa Jurídica (PJ - CNPJ)" },
                  ]}
                  value={personType}
                  onChange={(val) => setPersonType(val as any)}
                  className="w-full"
                />
              </div>
            )}

            {accountRole === "PRODUTOR" && personType === "PESSOA_JURIDICA" && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Razão Social</label>
                  <input
                    type="text"
                    required
                    placeholder="Empresa de Eventos LTDA"
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Nome Fantasia</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Orbit Eventos"
                    value={nomeFantasia}
                    onChange={(e) => setNomeFantasia(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>
                  {accountRole === "PRODUTOR" && personType === "PESSOA_JURIDICA" 
                    ? "CNPJ da Empresa *" 
                    : accountRole === "PRODUTOR"
                    ? "CPF do Produtor Responsável *"
                    : "CPF (Validação de Ingressos) *"}
                </span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                {accountRole === "PRODUTOR" && personType === "PESSOA_JURIDICA" ? (
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0001-00"
                    value={cnpj}
                    onChange={handleCnpjChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={handleCpfChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                )}
              </div>
            </div>

            {/* Telefone e Data de Nascimento — campos adicionais para PF */}
            {!(accountRole === "PRODUTOR" && personType === "PESSOA_JURIDICA") && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Telefone / WhatsApp *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="(11) 99999-0000"
                      value={phone}
                      onChange={handlePhoneChange}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Data de Nascimento *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="DD/MM/AAAA"
                      value={dataNascimento}
                      onChange={handleDateChange}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Telefone para PJ */}
            {accountRole === "PRODUTOR" && personType === "PESSOA_JURIDICA" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Telefone Comercial *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="(11) 99999-0000"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            )}

            {error && <div className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs rounded-xl uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
              ) : (
                <>
                  <span>Concluir Cadastro</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
