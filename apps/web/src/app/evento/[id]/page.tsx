"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Ticket, Calendar, MapPin, CheckCircle2, ChevronRight, ShieldCheck, AlertCircle, Minus, Plus, CreditCard, QrCode } from "lucide-react";
import { CheckoutCamaroteGrid } from "@/components/CheckoutCamaroteGrid";
import { AuthModal } from "@/components/AuthModal";

export default function EventCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authOpen, setAuthOpen] = useState(false);

  // Checkout states
  const [expandedArea, setExpandedArea] = useState<number>(0);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD">("PIX");
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [selectedCamaroteCell, setSelectedCamaroteCell] = useState<{ id: string; model: any } | null>(null);
  
  const [purchasing, setPurchasing] = useState(false);
  const [purchasedSuccess, setPurchasedSuccess] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch("/api/events");
        const data = await res.json();
        const found = data.events?.find((e: any) => e.id === eventId);
        if (found) {
          setEvent(found);
        } else {
          router.push("/");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();

    const savedUser = localStorage.getItem("pass_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
    }
  }, [eventId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a1e] flex flex-col items-center justify-center pt-24 text-cyan-400">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-xs font-bold uppercase tracking-widest">Carregando Evento...</span>
      </div>
    );
  }

  if (!event) return null;

  const areas = event.areas && event.areas.length > 0 ? event.areas : [];
  const currentArea = areas[expandedArea];

  // Determinar o lote ativo e preço
  let currentLot: any = null;
  let unitPrice = 0;

  if (currentArea) {
    if (currentArea.type === "CAMAROTE") {
      // Para camarote, o preço depende da célula selecionada
      if (selectedCamaroteCell) {
        currentLot = { name: `Camarote ${selectedCamaroteCell.id} (${selectedCamaroteCell.model.name})`, price: selectedCamaroteCell.model.price };
        unitPrice = parseFloat((selectedCamaroteCell.model.price || "0").toString().replace(",", "."));
      } else {
        // Se nenhum selecionado, preço 0 (ou pega o mais barato apenas para display)
        unitPrice = 0;
      }
    } else {
      // Para Pista, o lote é escolhido pelo usuário
      const lots = currentArea.lots || [];
      const active = lots.find((l: any) => {
        if (l.status === "ESGOTADO") return false;
        if (l.endDate) {
          const match = l.endDate.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/);
          if (match) {
            const [_, dd, mm, yyyy, hh, min] = match;
            const endDateTime = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd), parseInt(hh), parseInt(min)).getTime();
            if (Date.now() > endDateTime) return false;
          }
        }
        return true;
      }) || lots[0];
      
      // Se não clicou em nada ainda, pode usar o active como fallback visual ou null
      currentLot = lots.find((l: any) => l.id === selectedLotId) || null;
      unitPrice = currentLot ? parseFloat((currentLot.price || "0").toString().replace(",", ".")) : 0;
    }
  }

  const totalPrice = unitPrice * quantity;

  const handleConfirmPurchase = () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }

    if (currentArea?.type === "CAMAROTE" && !selectedCamaroteCell) {
      alert("Por favor, selecione um camarote no mapa.");
      return;
    }

    if (currentArea?.type !== "CAMAROTE" && !selectedLotId) {
      alert("Por favor, selecione um ingresso antes de continuar.");
      return;
    }

    setPurchasing(true);

    setTimeout(() => {
      // Cálculo final para o ticket de Camarote (gera X ingressos baseado na capacidade ou 1 ingresso master)
      const isCamarote = currentArea.type === "CAMAROTE";
      const capacidade = isCamarote ? parseInt(selectedCamaroteCell!.model.capacity || "1", 10) : quantity;
      
      const newTicket = {
        id: `tkt-${Date.now()}`,
        eventId: event.id,
        eventTitle: event.title || event.titulo,
        eventDate: event.date || event.dataInicio,
        eventLocation: `${event.location || event.local} • ${event.city || event.cidade}`,
        areaName: currentArea.name,
        lotName: currentLot.name,
        quantity: isCamarote ? capacidade : quantity,
        isCamarote,
        camaroteId: isCamarote ? selectedCamaroteCell!.id : null,
        totalPaid: totalPrice.toFixed(2),
        paymentMethod,
        userEmail: user.email,
        userName: user.name,
        purchaseDate: new Date().toLocaleDateString("pt-BR"),
        qrToken: `PASS_DYNAMIC_${event.id}_${Date.now()}`,
      };

      try {
        const existingRaw = localStorage.getItem("user_tickets");
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        localStorage.setItem("user_tickets", JSON.stringify([newTicket, ...existing]));
      } catch (err) {
        console.error("Erro ao salvar ingresso comprado:", err);
      }

      setPurchasing(false);
      setPurchasedSuccess(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#070a1e] pt-24 pb-16 px-4">
      {/* Background Glow */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[150px] pointer-events-none rounded-full" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/20 blur-[150px] pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto relative z-10">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider mb-8">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>

        {purchasedSuccess ? (
          <div className="bg-[#0b0e24] border border-cyan-500/40 rounded-3xl p-10 md:p-16 max-w-2xl mx-auto shadow-[0_0_80px_rgba(0,240,255,0.15)] text-center space-y-6 animate-fadeIn">
            <div className="w-24 h-24 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-14 h-14 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-3xl font-black text-white tracking-tight uppercase">
                Ingressos Garantidos!
              </h3>
              <p className="text-slate-300">
                Sua compra para <strong className="text-cyan-400">{event.title || event.titulo}</strong> foi processada com sucesso.
              </p>
            </div>

            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 text-sm text-left space-y-3 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Setor:</span>
                <span className="text-white font-bold">{currentArea.name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Ingresso/Lote:</span>
                <span className="text-white font-bold">{currentLot?.name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Quantidade:</span>
                <span className="text-white font-bold">{currentArea?.type === "CAMAROTE" ? `${selectedCamaroteCell?.model.capacity} Pessoas (1 Camarote)` : `${quantity}x`}</span>
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-between text-slate-400">
                <span>Valor Total Pago:</span>
                <span className="text-cyan-400 font-black text-lg">R$ {totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => router.push("/meus-ingressos")} className="py-4 bg-gradient-to-r from-cyan-400 to-purple-600 hover:from-cyan-300 hover:to-purple-500 text-white font-black text-xs rounded-xl uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                Ver Meus Ingressos
              </button>
              <button onClick={() => router.push("/")} className="py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer uppercase tracking-widest">
                Voltar ao Início
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Event & Areas */}
            <div className="col-span-1 lg:col-span-2 space-y-6">
              {/* Event Header */}
              <div className="bg-[#0b0e24] border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shrink-0 shadow-lg">
                  <Ticket className="w-10 h-10 md:w-12 md:h-12 text-cyan-400 opacity-80" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-2 py-1 rounded inline-block mb-2">Aquisição de Ingressos</span>
                    <h1 className="text-2xl md:text-3xl font-black text-white">{event.title || event.titulo}</h1>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <span>{event.date || event.dataInicio}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      <span>{event.location || event.local} • {event.city || event.cidade}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Areas Accordion */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="bg-cyan-500 text-black w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                  Escolha seu Setor
                </h3>
                
                {areas.length === 0 ? (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center text-slate-500">
                    Nenhum setor disponível para este evento.
                  </div>
                ) : (
                  areas.map((area: any, idx: number) => {
                    const isExpanded = expandedArea === idx;
                    
                    return (
                      <div key={idx} className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? "border-cyan-500/50 bg-[#0f1423] shadow-[0_10px_30px_rgba(0,0,0,0.5)]" : "border-slate-800 bg-slate-900/50 hover:border-slate-700"}`}>
                        <button 
                          onClick={() => {
                            setExpandedArea(idx);
                            setQuantity(1);
                            setSelectedCamaroteCell(null);
                            setSelectedLotId(null);
                          }}
                          className="w-full p-5 flex items-center justify-between cursor-pointer"
                        >
                          <div className="text-left">
                            <span className="text-lg font-black text-white block uppercase">{area.name}</span>
                          </div>
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${isExpanded ? "bg-cyan-500/20 border-cyan-400 text-cyan-400" : "border-slate-700 text-slate-500"}`}>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="p-5 pt-0 border-t border-slate-800/50 mt-2">
                            {area.type === "CAMAROTE" ? (
                              <CheckoutCamaroteGrid 
                                area={area}
                                selectedCell={selectedCamaroteCell?.id || null}
                                onSelectCell={(cellId, model) => setSelectedCamaroteCell({ id: cellId, model })}
                              />
                            ) : (
                              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <Ticket className="w-4 h-4 text-emerald-400" />
                                  <span className="text-xs text-slate-300">Lote atualmente disponível para compra:</span>
                                </div>
                                
                                {(() => {
                                  const lots = area.lots || [];
                                  
                                  const active = lots.find((l: any) => {
                                    if (l.status === "ESGOTADO") return false;
                                    if (l.endDate) {
                                      const match = l.endDate.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/);
                                      if (match) {
                                        const [_, dd, mm, yyyy, hh, min] = match;
                                        const endDateTime = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd), parseInt(hh), parseInt(min)).getTime();
                                        if (Date.now() > endDateTime) return false;
                                      }
                                    }
                                    return true;
                                  });
                                  
                                  if (!active) {
                                    return <div className="text-red-400 text-xs font-bold bg-red-500/10 p-4 rounded-xl text-center border border-red-500/30">Lotes Esgotados</div>;
                                  }
                                  
                                  const isSelected = selectedLotId === active.id;
                                  
                                  return (
                                    <div 
                                      onClick={() => setSelectedLotId(active.id)}
                                      className={`cursor-pointer border-2 rounded-xl p-4 flex items-center justify-between transition-all ${
                                        isSelected 
                                          ? "bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                                          : "bg-slate-900/50 border-slate-700/50 hover:border-cyan-500/30"
                                      } relative overflow-hidden`}
                                    >
                                      {isSelected && (
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
                                      )}
                                      <div className="flex items-center gap-3 relative z-10">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                          isSelected ? "bg-emerald-500 shadow-lg shadow-emerald-500/20" : "border border-slate-600 bg-slate-800"
                                        }`}>
                                          {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                        </div>
                                        <div>
                                          <span className={`text-sm font-black block transition-colors ${isSelected ? "text-white" : "text-slate-300"}`}>{active.name}</span>
                                          <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isSelected ? "text-emerald-400" : "text-slate-500"}`}>
                                            {isSelected ? "Selecionado" : "Clique para selecionar"}
                                          </span>
                                        </div>
                                      </div>
                                      <span className={`text-lg font-mono font-black relative z-10 transition-colors ${isSelected ? "text-cyan-400" : "text-slate-400"}`}>R$ {active.price}</span>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Sticky Checkout Panel */}
            <div className="col-span-1">
              <div className="bg-[#0b0e24] border border-cyan-500/30 rounded-3xl p-6 shadow-[0_0_40px_rgba(0,240,255,0.05)] sticky top-28 space-y-6">
                
                {/* User Area */}
                {user ? (
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block mb-0.5 uppercase tracking-widest">Comprador</span>
                      <strong className="text-sm text-white block truncate">{user.name}</strong>
                      <span className="text-xs text-slate-500 truncate block">{user.email}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-950/30 p-4 rounded-xl border border-amber-500/30 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-amber-300 block mb-1">Você precisa se identificar.</span>
                      <button onClick={() => setAuthOpen(true)} className="text-[10px] bg-amber-500/20 text-amber-400 font-bold uppercase tracking-widest px-3 py-1.5 rounded border border-amber-500/50 hover:bg-amber-500/40 transition-colors">
                        Fazer Login Agora
                      </button>
                    </div>
                  </div>
                )}

                <hr className="border-slate-800" />

                {/* Resumo da Seleção */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">O que você está comprando</label>
                  <div className="bg-[#0f1423] p-4 rounded-xl border border-cyan-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none"></div>
                    <div className="space-y-2 relative z-10">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Setor:</span>
                        <strong className="text-white uppercase">{currentArea?.name}</strong>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">{currentArea?.type === "CAMAROTE" ? "Espaço VIP:" : "Ingresso:"}</span>
                        <strong className="text-cyan-400 text-right">{currentLot?.name || "Selecione um assento"}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quantidade (apenas se for pista) */}
                {currentArea?.type !== "CAMAROTE" && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Quantidade</label>
                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl overflow-hidden h-12">
                      <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 font-black cursor-pointer">
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="flex-1 text-center text-base font-black text-white">{quantity}</div>
                      <button type="button" onClick={() => setQuantity(Math.min(10, quantity + 1))} className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 font-black cursor-pointer">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Forma de Pagamento */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Forma de Pagamento</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("PIX")}
                      className={`h-12 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        paymentMethod === "PIX" ? "bg-emerald-500/20 border-emerald-400 text-emerald-300" : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <QrCode className="w-4 h-4" /> Pix (-5%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CREDIT_CARD")}
                      className={`h-12 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        paymentMethod === "CREDIT_CARD" ? "bg-cyan-500/20 border-cyan-400 text-cyan-300" : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <CreditCard className="w-4 h-4" /> Cartão
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Total a pagar</span>
                  </div>
                  <div className="text-3xl font-mono font-black text-cyan-400">
                    R$ {totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={purchasing || (currentArea?.type === "CAMAROTE" ? !selectedCamaroteCell : !selectedLotId)}
                  onClick={handleConfirmPurchase}
                  className="w-full py-4 bg-gradient-to-r from-cyan-400 via-purple-600 to-pink-500 hover:from-cyan-300 hover:to-pink-400 text-white font-black text-sm rounded-xl uppercase tracking-widest shadow-[0_0_25px_rgba(0,240,255,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasing ? (
                    <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processando...</span>
                  ) : (
                    <>
                      Concluir Compra <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={(u) => setUser(u)}
        initialMode="login"
      />
    </div>
  );
}

// Pequeno helper icon
function ChevronDown(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}
