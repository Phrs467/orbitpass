"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, RefreshCw, Send, DollarSign, Clock, AlertTriangle, ChevronLeft, QrCode, Lock, User, FileText, Receipt, History, CheckCircle2, Mail, Phone, Edit2, Shield } from "lucide-react";
import { PassLogo } from "@/components/PassLogo";
import { TicketTransferModal } from "@/components/TicketTransferModal";
import { AuthModal } from "@/components/AuthModal";

const MY_TICKETS: any[] = [];
const MOCK_TRANSACTIONS: any[] = [];

export default function MyTicketsPage() {
  const [user, setUser] = useState<{ name: string; email: string; cpf?: string; phone?: string; role?: string } | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ingressos" | "perfil" | "transacoes">("ingressos");
  const [activeTicket, setActiveTicket] = useState<any | null>(MY_TICKETS.length > 0 ? MY_TICKETS[0] : null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [qrToken, setQrToken] = useState("PASS_INITIAL_QR_HASH_98217");
  const [modalOpen, setModalOpen] = useState(false);
  const [screenshotDetected, setScreenshotDetected] = useState(false);

  // Perfil Form State
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("pass_user");
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setUser(u);
        setProfileName(u.name || "");
        setProfilePhone(u.phone || "(11) 98765-4321");
      } catch (e) {
        console.error(e);
      }
    } else {
      setAuthOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!activeTicket) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const randomHash = Math.random().toString(36).substring(2, 12).toUpperCase();
          setQrToken(`PASS_DYNAMIC_${activeTicket.id}_${randomHash}_${Date.now()}`);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTicket]);

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        setScreenshotDetected(true);
        setTimeout(() => setScreenshotDetected(false), 4000);
      }
    };
    window.addEventListener("keyup", handleKeyUp);
    return () => window.removeEventListener("keyup", handleKeyUp);
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const updated = {
      ...user,
      name: profileName,
      phone: profilePhone,
    };
    setUser(updated);
    localStorage.setItem("pass_user", JSON.stringify(updated));
    setEditingProfile(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#060814] text-white flex flex-col font-sans selection:bg-cyan-400 selection:text-black">
      {/* Header Bar */}
      <header className="border-b border-white/10 bg-[#060814]/90 sticky top-0 z-40 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white/60 hover:text-cyan-400 transition-colors text-xs font-bold uppercase tracking-wider">
            <ChevronLeft className="w-4 h-4" />
            <span>Voltar aos Eventos</span>
          </Link>
          <PassLogo size="sm" />
          <div className="flex items-center gap-2 text-xs text-cyan-300 font-bold bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Portal do Comprador</span>
          </div>
        </div>
      </header>

      {/* Main Content Hub */}
      <main className="container mx-auto px-4 py-8 flex-1 max-w-5xl space-y-8">
        {!user ? (
          <div className="text-center py-20 space-y-6 max-w-md mx-auto">
            <PassLogo size="md" showSubtitle={true} />
            <p className="text-xs text-white/60 leading-relaxed">
              Você precisa estar autenticado para acessar seus ingressos e bilhetes digitais.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-400 to-purple-600 hover:from-cyan-300 hover:to-purple-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.3)]"
              >
                Entrar ou Criar Conta
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = "/"; }}
                className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Voltar ao Início
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Customer User Header Banner */}
            <div className="bg-gradient-to-r from-[#0b0e26] via-[#121638] to-[#0b0e26] border border-cyan-500/30 rounded-3xl p-6 md:p-8 shadow-[0_0_40px_rgba(0,240,255,0.1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center font-black text-2xl text-white shadow-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-white tracking-tight">{user.name}</h1>
                    <span className="text-[10px] font-extrabold text-cyan-300 bg-cyan-500/20 border border-cyan-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                      CPF Validado
                    </span>
                  </div>
                  <p className="text-xs text-white/60 mt-1">{user.email} • CPF: {user.cpf || "000.000.000-00"}</p>
                </div>
              </div>

              {/* Navigation Tabs Header */}
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 w-full md:w-auto">
                <button
                  onClick={() => setActiveTab("ingressos")}
                  className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === "ingressos"
                      ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-white shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Meus Ingressos</span>
                </button>

                <button
                  onClick={() => setActiveTab("perfil")}
                  className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === "perfil"
                      ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-white shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Meus Dados</span>
                </button>

                <button
                  onClick={() => setActiveTab("transacoes")}
                  className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === "transacoes"
                      ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-white shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>Histórico</span>
                </button>
              </div>
            </div>

            {/* TAB 1: MEUS INGRESSOS & COFRE DIGITAL */}
            {activeTab === "ingressos" && (
              <div className="space-y-6">
                {screenshotDetected && (
                  <div className="p-4 bg-red-500/20 border border-red-500 rounded-2xl text-center text-red-200 text-xs flex items-center justify-center gap-2 animate-bounce">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>Captura de tela detectada! Capturas não são válidas na portaria do evento.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Bilhetes Drawer */}
                  <div className="lg:col-span-4 space-y-3">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-white/50 px-1">Seus Bilhetes Adquiridos</h2>
                    {MY_TICKETS.length === 0 ? (
                      <div className="text-center p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <p className="text-xs text-white/50">Nenhum ingresso encontrado.</p>
                      </div>
                    ) : (
                      MY_TICKETS.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setActiveTicket(t)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                            activeTicket?.id === t.id
                              ? "bg-gradient-to-r from-cyan-950/70 to-purple-950/70 border-cyan-500/60 shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                              : "bg-[#0b0e26] border-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full">
                              {t.status}
                            </span>
                            <span className="text-xs text-white/40 font-mono">{t.id}</span>
                          </div>
                          <h3 className="font-bold text-white text-sm mt-1">{t.eventName}</h3>
                          <p className="text-xs text-white/60">{t.subtitle}</p>
                          <p className="text-xs text-cyan-400 font-semibold mt-2">{t.date} • {t.location}</p>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Digital Ticket Container */}
                  <div className="lg:col-span-8">
                    {activeTicket ? (
                      <div className="bg-gradient-to-br from-[#0b0e26] via-[#101438] to-[#0b0e26] border border-cyan-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_0_40px_rgba(0,240,255,0.1)]">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                          <div>
                            <PassLogo size="sm" showSubtitle={false} />
                            <span className="text-[10px] font-bold text-cyan-400 block tracking-wider uppercase mt-1">Ingresso Digital Autêntico</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-white/40 uppercase block">Código do Bilhete</span>
                            <span className="text-xs font-mono font-bold text-white">{activeTicket.id}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                          <div className="space-y-4">
                            <div>
                              <h2 className="text-xl font-extrabold text-white">{activeTicket.eventName}</h2>
                              <p className="text-xs text-cyan-300 font-semibold mt-0.5">{activeTicket.subtitle}</p>
                            </div>

                            <div className="space-y-2 text-xs">
                              <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
                                <span className="text-[10px] text-white/40 uppercase block">Data e Horário</span>
                                <span className="font-bold text-white">{activeTicket.date} às {activeTicket.time}</span>
                              </div>

                              <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
                                <span className="text-[10px] text-white/40 uppercase block">Local</span>
                                <span className="font-bold text-white">{activeTicket.location}</span>
                              </div>

                              <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
                                <span className="text-[10px] text-white/40 uppercase block">Titular (CPF Verificado)</span>
                                <span className="font-bold text-white">{user.name}</span>
                              </div>
                            </div>
                          </div>

                          {/* QR Code Rotativo */}
                          <div className="flex flex-col items-center justify-center p-5 bg-black/60 border border-cyan-500/40 rounded-2xl">
                            <div className="w-full flex items-center justify-between text-xs mb-3">
                              <span className="flex items-center gap-1.5 text-cyan-300 font-semibold text-[11px]">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                                QR Code Dinâmico
                              </span>
                              <span className="flex items-center gap-1 font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 text-[10px]">
                                <Clock className="w-3 h-3" />
                                {timeLeft}s
                              </span>
                            </div>

                            <div className="p-3 bg-white rounded-xl shadow-xl">
                              <div className="w-40 h-40 bg-slate-900 rounded p-2 flex flex-col items-center justify-center relative">
                                <QrCode className="w-32 h-32 text-cyan-400" />
                              </div>
                            </div>

                            <div className="mt-3 text-center">
                              <p className="text-[10px] text-white/60 flex items-center justify-center gap-1">
                                <Lock className="w-3 h-3 text-cyan-400" />
                                Validado em tempo real na portaria
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <p className="text-xs text-white/50">Transferência ou revenda de bilhete:</p>

                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => setModalOpen(true)}
                              className="flex-1 sm:flex-initial px-4 py-2.5 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black border border-cyan-500/40 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Transferir</span>
                            </button>

                            <button
                              onClick={() => setModalOpen(true)}
                              className="flex-1 sm:flex-initial px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Revender</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-[#0b0e26] via-[#101438] to-[#0b0e26] border border-cyan-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_0_40px_rgba(0,240,255,0.1)] text-center flex flex-col items-center justify-center h-full min-h-[300px]">
                        <QrCode className="w-16 h-16 text-cyan-500/20 mb-4" />
                        <h3 className="text-lg font-bold text-white">Nenhum ingresso selecionado</h3>
                        <p className="text-xs text-white/50">Você não possui bilhetes ativos no momento.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MEUS DADOS CADASTRAIS (CPF & PERFIL) */}
            {activeTab === "perfil" && (
              <div className="max-w-2xl mx-auto bg-[#0b0e26] border border-cyan-500/30 rounded-3xl p-6 md:p-8 shadow-[0_0_40px_rgba(0,240,255,0.1)] space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <User className="w-5 h-5 text-cyan-400" />
                      <span>Dados Pessoais do Comprador</span>
                    </h2>
                    <p className="text-xs text-white/50 mt-1">Gerencie seu perfil e suas informações de segurança.</p>
                  </div>
                  <button
                    onClick={() => setEditingProfile(!editingProfile)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{editingProfile ? "Cancelar" : "Editar Dados"}</span>
                  </button>
                </div>

                {saveSuccess && (
                  <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Seus dados cadastrais foram atualizados com sucesso!</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-white/70">Nome Completo</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
                        <input
                          type="text"
                          disabled={!editingProfile}
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white disabled:opacity-60 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-white/70">E-mail Cadastrado</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
                        <input
                          type="email"
                          disabled
                          value={user.email}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white/50 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-white/70 flex items-center justify-between">
                        <span>CPF (Documento Oficial)</span>
                        <span className="text-[10px] text-cyan-400 font-bold">Documento Verificado</span>
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3.5 top-3 w-4 h-4 text-cyan-400" />
                        <input
                          type="text"
                          disabled
                          value={user.cpf || "000.000.000-00"}
                          className="w-full bg-cyan-500/10 border border-cyan-500/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-cyan-300 font-mono font-bold cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-white/70">Telefone / WhatsApp</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
                        <input
                          type="text"
                          disabled={!editingProfile}
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white disabled:opacity-60 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Security Badge Card */}
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                    <Shield className="w-8 h-8 text-cyan-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Nível de Segurança Máximo</h4>
                      <p className="text-[11px] text-white/60">Seu CPF está vinculado exclusivamente aos seus ingressos digitais com limite anti-cambismo por lote.</p>
                    </div>
                  </div>

                  {editingProfile && (
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-extrabold text-xs rounded-xl uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.3)] cursor-pointer"
                    >
                      Salvar Alterações
                    </button>
                  )}
                </form>
              </div>
            )}

            {/* TAB 3: HISTÓRICO DE COMPRAS E TRANSAÇÕES */}
            {activeTab === "transacoes" && (
              <div className="bg-[#0b0e26] border border-white/10 rounded-3xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-bold text-white">Histórico de Compras & Transações</h2>
                </div>
                <p className="text-xs text-white/50 mb-6">Registros completos de pagamentos e comprovantes emitidos.</p>

                {MOCK_TRANSACTIONS.length === 0 ? (
                  <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-xs text-white/50">Você ainda não realizou nenhuma transação.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300 whitespace-nowrap">
                      <thead className="uppercase tracking-wider text-slate-500 border-b border-white/10">
                        <tr>
                          <th className="py-3 px-4 font-bold">Cód. Transação</th>
                          <th className="py-3 px-4 font-bold">Data</th>
                          <th className="py-3 px-4 font-bold">Evento / Ingresso</th>
                          <th className="py-3 px-4 font-bold">Método</th>
                          <th className="py-3 px-4 font-bold">Valor Total</th>
                          <th className="py-3 px-4 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {MOCK_TRANSACTIONS.map((tx) => (
                          <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-4 px-4 font-mono font-bold text-cyan-400">{tx.id}</td>
                            <td className="py-4 px-4 text-white/60">{tx.date}</td>
                            <td className="py-4 px-4">
                              <span className="block font-bold text-white">{tx.eventName}</span>
                              <span className="block text-[10px] text-white/40 font-mono mt-0.5">{tx.ticketId}</span>
                            </td>
                            <td className="py-4 px-4 text-white/60">{tx.method}</td>
                            <td className="py-4 px-4 font-bold text-white">R$ {tx.amount}</td>
                            <td className="py-4 px-4">
                              <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <TicketTransferModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        ticketTitle={activeTicket?.eventName || ""}
        ticketId={activeTicket?.id || ""}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => {
          setAuthOpen(false);
          const raw = localStorage.getItem("pass_user");
          if (!raw) {
            window.location.href = "/";
          }
        }}
        onSuccess={(u) => setUser(u)}
      />
    </div>
  );
}
