"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Ticket, Calendar, MapPin, CheckCircle2, ChevronRight, ShieldCheck, AlertCircle, Minus, Plus, CreditCard, QrCode, Trash2, User, ChevronDown, Check } from "lucide-react";
import { CheckoutCamaroteGrid } from "@/components/CheckoutCamaroteGrid";
import { AuthModal } from "@/components/AuthModal";
import { calculateTaxes } from "@/lib/taxCalculator";

type CartItem = {
  id: string;
  type: "PISTA" | "CAMAROTE";
  areaName: string;
  itemName: string;
  price: number;
  quantity: number;
  camaroteCapacity?: number;
};

type Attendee = {
  cartItemId: string;
  ticketIndex: number;
  name: string;
  email: string;
  cpf: string;
  birthDate: string;
  isOwner?: boolean;
};

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
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD">("PIX");
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Multi-step Wizard States
  const [checkoutStep, setCheckoutStep] = useState<number>(1); // 1: Ingressos, 2: Dados, 3: Pagamento, 4: Sucesso
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [installments, setInstallments] = useState<number>(1);
  const [cardData, setCardData] = useState({ number: "", name: "", expiry: "", cvv: "" });

  const [purchasing, setPurchasing] = useState(false);
  const [purchasedSuccess, setPurchasedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(""), 5000);
      return () => clearTimeout(t);
    }
  }, [errorMsg]);

  // CPF Masking
  const handleCpfChange = (val: string, cartItemId: string, ticketIndex: number) => {
    let v = val.replace(/\D/g, "");
    if (v.length <= 11) {
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      updateAttendee(cartItemId, ticketIndex, "cpf", v);
    }
  };

  const updateAttendee = (cartItemId: string, ticketIndex: number, field: keyof Attendee, value: any) => {
    setAttendees(prev => {
      const existingIdx = prev.findIndex(a => a.cartItemId === cartItemId && a.ticketIndex === ticketIndex);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], [field]: value };
        return copy;
      }
      return [...prev, { cartItemId, ticketIndex, name: "", email: "", cpf: "", birthDate: "", isOwner: false, [field]: value }];
    });
  };

  const getAttendee = (cartItemId: string, ticketIndex: number) => {
    return attendees.find(a => a.cartItemId === cartItemId && a.ticketIndex === ticketIndex) || { name: "", email: "", cpf: "", birthDate: "" };
  };

  const fillWithUserData = (cartItemId: string, ticketIndex: number) => {
    if (user) {
      updateAttendee(cartItemId, ticketIndex, "name", user.name || "");
      if (user.email) updateAttendee(cartItemId, ticketIndex, "email", user.email);
      if (user.cpf) {
        let v = user.cpf.replace(/\D/g, "");
        if (v.length === 11) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
        updateAttendee(cartItemId, ticketIndex, "cpf", v);
      }
      if (user.dataNascimento) {
        let formattedDate = user.dataNascimento;
        if (typeof formattedDate === 'string') {
          if (formattedDate.includes('T')) {
            formattedDate = formattedDate.split('T')[0]; // "2000-01-01T00:00:00.000Z" -> "2000-01-01"
          } else if (formattedDate.includes('/')) {
            formattedDate = formattedDate.split('/').reverse().join('-'); // "31/12/2000" -> "2000-12-31"
          } else if (formattedDate.length > 10) {
            formattedDate = formattedDate.substring(0, 10);
          }
        }
        updateAttendee(cartItemId, ticketIndex, "birthDate", formattedDate);
      }
    }
  };

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
        const pUser = JSON.parse(savedUser);
        setUser(pUser);

        // Auto-hydrate dataNascimento if missing
        if (!pUser.dataNascimento && pUser.email) {
          fetch("/api/auth/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: pUser.email })
          }).then(r => r.json()).then(res => {
            if (res.exists && res.user && res.user.dataNascimento) {
              const updatedUser = { ...pUser, dataNascimento: res.user.dataNascimento };
              setUser(updatedUser);
              localStorage.setItem("pass_user", JSON.stringify(updatedUser));
            }
          }).catch(() => {});
        }
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

  const updateCartQuantity = (id: string, delta: number, areaName: string, itemName: string, price: number, type: "PISTA" | "CAMAROTE", capacity?: number) => {
    setCart((prev) => {
      const currentTotalQty = prev.reduce((acc, item) => acc + item.quantity, 0);

      const existing = prev.find((i) => i.id === id);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) {
          return prev.filter((i) => i.id !== id);
        }
        if (delta > 0 && currentTotalQty >= 4) {
          setErrorMsg("Limite máximo de 4 ingressos por CPF atingido.");
          return prev;
        }
        return prev.map((i) => (i.id === id ? { ...i, quantity: newQty } : i));
      } else if (delta > 0) {
        if (currentTotalQty >= 4) {
          setErrorMsg("Limite máximo de 4 ingressos por CPF atingido.");
          return prev;
        }
        return [...prev, { id, type, areaName, itemName, price, quantity: delta, camaroteCapacity: capacity }];
      }
      return prev;
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const taxResult = calculateTaxes(totalPrice, paymentMethod as any, installments);
  const finalPrice = taxResult.finalTotal;

  const handleConfirmPurchase = () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }

    if (cart.length === 0) {
      setErrorMsg("Por favor, adicione ao menos um ingresso ao carrinho.");
      return;
    }

    setPurchasing(true);

    setTimeout(() => {
      const newTickets: any[] = [];
      
      cart.forEach((item) => {
        const isCamarote = item.type === "CAMAROTE";
        
        // Se for camarote, o carrinho diz 1 quantidade, mas a capacidade é maior.
        // No checkout em passos, pedimos dados para 1 titular do camarote OU para cada pessoa?
        // Geralmente 1 titular pro camarote, mas vamos gerar "quantity" de camarotes.
        for (let i = 0; i < item.quantity; i++) {
          const attendeeData = getAttendee(item.id, i);
          const quantityToGenerate = isCamarote ? (item.camaroteCapacity || 1) : 1;
          
          for (let q = 0; q < quantityToGenerate; q++) {
            const newTicket = {
              id: `tkt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              eventId: event.id,
              eventTitle: event.title || event.titulo,
              eventDate: event.date || event.dataInicio,
              eventLocation: `${event.location || event.local} • ${event.city || event.cidade}`,
              areaName: item.areaName,
              lotName: item.itemName,
              quantity: 1,
              isCamarote,
              camaroteId: isCamarote ? item.id : null,
              totalPaid: isCamarote && q > 0 ? "0.00" : (item.price / (isCamarote ? 1 : 1)).toFixed(2), // Simplificando totalPaid
              paymentMethod,
              userEmail: user.email,
              userName: attendeeData.name || user.name, // Usa o nome do participante!
              attendeeCpf: attendeeData.cpf,
              attendeeBirthDate: attendeeData.birthDate,
              purchaseDate: new Date().toLocaleDateString("pt-BR"),
              qrToken: `PASS_DYNAMIC_${event.id}_${Date.now()}`,
            };
            newTickets.push(newTicket);
          }
        }
      });

      try {
        const existingRaw = localStorage.getItem("user_tickets");
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        localStorage.setItem("user_tickets", JSON.stringify([...newTickets, ...existing]));
      } catch (err) {
        console.error("Erro ao salvar ingressos:", err);
      }

      setPurchasing(false);
      setCheckoutStep(4);
      setPurchasedSuccess(true);
    }, 1500);
  };

  const handleNextStep = () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (checkoutStep === 1) {
      if (cart.length === 0) return setErrorMsg("Adicione ao menos um ingresso ao carrinho.");
      setCheckoutStep(2);
    } else if (checkoutStep === 2) {
      // Validate all attendees
      let allValid = true;
      let ageError = false;
      cart.forEach((item) => {
        for (let i = 0; i < item.quantity; i++) {
          const attendee = getAttendee(item.id, i);
          if (!attendee.name || !attendee.email || !attendee.cpf || !attendee.birthDate) {
            allValid = false;
          } else if (item.id.endsWith("-idoso")) {
            // Valida idade >= 60 para ingresso Idoso
            let birth: Date | null = null;
            if (attendee.birthDate.includes("-")) {
              const [year, month, day] = attendee.birthDate.split("-");
              birth = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
            } else if (attendee.birthDate.includes("/")) {
              const [day, month, year] = attendee.birthDate.split("/");
              birth = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
            }
            
            if (birth && !isNaN(birth.getTime())) {
              const today = new Date();
              let age = today.getFullYear() - birth.getFullYear();
              const m = today.getMonth() - birth.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
              }
              if (age < 60) {
                ageError = true;
              }
            } else {
              ageError = true;
            }
          }
        }
      });
      if (!allValid) return setErrorMsg("Preencha os dados de todos os ingressos.");
      if (ageError) return setErrorMsg("Para adquirir o ingresso 'Idoso', a data de nascimento informada deve comprovar idade igual ou superior a 60 anos.");
      setCheckoutStep(3);
    } else if (checkoutStep === 3) {
      if (paymentMethod === "CREDIT_CARD") {
        if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv) {
          return setErrorMsg("Preencha todos os dados do cartão.");
        }
      }
      handleConfirmPurchase();
    }
  };

  return (
    <div className="min-h-screen bg-[#070a1e] pt-24 pb-16 px-4">
      {/* Background Glow */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[150px] pointer-events-none rounded-full" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/20 blur-[150px] pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto relative z-10">
        <button 
          onClick={() => {
            if (checkoutStep > 1 && !purchasedSuccess) {
              setCheckoutStep(checkoutStep - 1);
            } else {
              router.back();
            }
          }} 
          className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors text-xs font-bold uppercase tracking-wider mb-8"
        >
          <ChevronLeft className="w-4 h-4" /> {checkoutStep > 1 && !purchasedSuccess ? "Voltar Etapa" : "Voltar"}
        </button>



        {purchasedSuccess ? (
          <div className="bg-[#0b0e24] border border-cyan-500/40 rounded-3xl p-10 md:p-16 max-w-2xl mx-auto shadow-[0_0_80px_rgba(0,240,255,0.15)] text-center space-y-6 animate-fadeIn">
            <div className="w-24 h-24 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-14 h-14 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-3xl font-black text-white tracking-tight uppercase">
                {paymentMethod === "PIX" ? "Aguardando Pagamento" : "Ingressos Garantidos!"}
              </h3>
              <p className="text-slate-300">
                {paymentMethod === "PIX" 
                  ? "Escaneie o QR Code abaixo ou utilize a chave Pix copia e cola para finalizar sua compra." 
                  : <>Sua compra para <strong className="text-cyan-400">{event.title || event.titulo}</strong> foi processada com sucesso.</>
                }
              </p>
            </div>

            {paymentMethod === "PIX" && (
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto">
                <div className="w-48 h-48 bg-white p-2 rounded-xl flex items-center justify-center">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=orbitpass_fictional_pix_code" alt="QR Code PIX" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="text-sm text-emerald-400 font-bold mb-1">Escaneie o QR Code para pagar</p>
                  <p className="text-xs text-slate-400">Aprovação imediata. O código expira em 10 minutos.</p>
                </div>
                <div className="w-full bg-black/40 border border-slate-800 rounded-lg p-3 text-xs text-slate-500 font-mono truncate select-all">
                  00020101021126580014br.gov.bcb.pix0136orbitpass-test@pix.com.br
                </div>
              </div>
            )}

            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 text-sm text-left space-y-3 font-mono">
              <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-2 mb-2">
                <span>Resumo da Compra:</span>
                <span className="text-white font-bold">{cart.reduce((acc, i) => acc + i.quantity, 0)} pacotes/lotes</span>
              </div>
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between text-slate-400 text-xs">
                  <span>{item.quantity}x {item.itemName} ({item.areaName})</span>
                  <span className="text-white">R$ {(item.price * item.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-slate-800 flex justify-between text-slate-400">
                <span>Total em Taxas:</span>
                <span className="text-white">R$ {taxResult.totalTaxes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-between text-slate-400">
                <span>Valor Total Pago:</span>
                <span className="text-cyan-400 font-black text-lg">R$ {finalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
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

              {/* Wizard Stepper as Tab Header */}
              <div className="bg-[#0b0e24] border border-slate-800 rounded-2xl p-4 md:p-6 mb-2">
                <div className="flex items-center justify-between relative px-2 md:px-4">
                  {/* Lines connecting steps */}
                  <div className="absolute top-4 md:top-5 left-8 md:left-12 right-8 md:right-12 h-[2px] bg-slate-800 z-0 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-cyan-500 transition-all duration-500 ease-in-out" 
                      style={{ width: purchasedSuccess ? '100%' : checkoutStep === 3 ? '66.6%' : checkoutStep === 2 ? '33.3%' : '0%' }}
                    ></div>
                  </div>
                  
                  {/* Step 1 */}
                  <div 
                    onClick={() => { if (!purchasedSuccess && checkoutStep > 1) setCheckoutStep(1); }}
                    className={`relative z-10 flex flex-col items-center gap-2 ${!purchasedSuccess && checkoutStep > 1 ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                  >
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold border-2 transition-all duration-300 ${checkoutStep >= 1 ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_15px_rgba(0,240,255,0.5)]' : 'bg-[#0b0e24] border-slate-700 text-slate-500'}`}>
                      {checkoutStep > 1 || purchasedSuccess ? <Check className="w-4 h-4 md:w-5 md:h-5 text-black" /> : "1"}
                    </div>
                    <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${checkoutStep === 1 ? 'text-cyan-400' : checkoutStep > 1 ? 'text-cyan-600' : 'text-slate-500'}`}>Ingressos</span>
                  </div>
                  
                  {/* Step 2 */}
                  <div 
                    onClick={() => { if (!purchasedSuccess && checkoutStep > 2) setCheckoutStep(2); }}
                    className={`relative z-10 flex flex-col items-center gap-2 ${!purchasedSuccess && checkoutStep > 2 ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                  >
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold border-2 transition-all duration-300 delay-100 ${checkoutStep >= 2 ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_15px_rgba(0,240,255,0.5)]' : 'bg-[#0b0e24] border-slate-700 text-slate-500'}`}>
                      {checkoutStep > 2 || purchasedSuccess ? <Check className="w-4 h-4 md:w-5 md:h-5 text-black" /> : "2"}
                    </div>
                    <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${checkoutStep === 2 ? 'text-cyan-400' : checkoutStep > 2 ? 'text-cyan-600' : 'text-slate-500'}`}>Participantes</span>
                  </div>
                  
                  {/* Step 3 */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold border-2 transition-all duration-300 delay-200 ${checkoutStep >= 3 ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_15px_rgba(0,240,255,0.5)]' : 'bg-[#0b0e24] border-slate-700 text-slate-500'}`}>
                      {purchasedSuccess ? <Check className="w-4 h-4 md:w-5 md:h-5 text-black" /> : "3"}
                    </div>
                    <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${checkoutStep === 3 ? 'text-cyan-400' : checkoutStep > 3 ? 'text-cyan-600' : 'text-slate-500'}`}>Pagamento</span>
                  </div>

                  {/* Step 4 */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold border-2 transition-all duration-300 delay-300 ${purchasedSuccess ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_15px_rgba(0,240,255,0.5)]' : 'bg-[#0b0e24] border-slate-700 text-slate-500'}`}>
                      {purchasedSuccess ? <Check className="w-4 h-4 md:w-5 md:h-5 text-black" /> : "4"}
                    </div>
                    <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${purchasedSuccess ? 'text-cyan-400' : 'text-slate-500'}`}>Concluído</span>
                  </div>
                </div>
              </div>

              {/* Areas Accordion */}
              {checkoutStep === 1 && (
                <div className="space-y-4">
                  
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
                            onClick={() => setExpandedArea(isExpanded ? -1 : idx)}
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
                            <div className="p-5 pt-6 border-t border-slate-800/50 bg-black/20">
                              {area.type === "CAMAROTE" ? (
                                <CheckoutCamaroteGrid 
                                  area={area} 
                                  selectedCells={cart.filter((item) => item.areaName === area.name).map((item) => item.id)}
                                  onSelectCell={(cellId, model) => {
                                    const isSelected = cart.some((item) => item.id === cellId);
                                    if (isSelected) {
                                      updateCartQuantity(cellId, -1, area.name, `Camarote ${cellId}`, parseFloat(model.price), "CAMAROTE", parseInt(model.capacity));
                                    } else {
                                      updateCartQuantity(cellId, 1, area.name, `Camarote ${cellId}`, parseFloat(model.price), "CAMAROTE", parseInt(model.capacity));
                                    }
                                  }} 
                                />
                              ) : (
                                <div className="space-y-4">
                                  {(() => {
                                    const lots = area.lots || [];
                                    if (lots.length === 0) {
                                      return <div className="text-slate-500 text-xs font-bold">Nenhum lote configurado.</div>;
                                    }
                                    
                                    const activeLots = lots.filter((l: any) => {
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
                                    
                                    const categories = [
                                      { key: 'inteira', name: 'Inteira', color: 'text-cyan-400' },
                                      { key: 'meia', name: 'Meia Entrada', color: 'text-purple-400', desc: 'Necessário apresentar documento com foto que comprove a condição de meia-entrada' },
                                      { key: 'solidaria', name: 'Meia Solidária', color: 'text-emerald-400', desc: 'Válido mediante doação de 1kg de alimento não perecível' },
                                      { key: 'idoso', name: 'Idoso', color: 'text-amber-400', desc: 'Necessário apresentar documento de identificação com foto para maiores de 60 anos' }
                                    ];

                                    const availableOptions = categories.map(cat => {
                                      const isConfigured = lots.some((l: any) => l[`${cat.key}Preco`] !== undefined && l[`${cat.key}Preco`] !== null && l[`${cat.key}Preco`] !== "");
                                      if (!isConfigured) return null;

                                      const activeLot = activeLots.find((l: any) => {
                                        const qtdVendida = parseInt(l[`${cat.key}QtdVendida`] || '0', 10);
                                        const qtdTotal = parseInt(l[`${cat.key}Qtd`] || '0', 10);
                                        const price = l[`${cat.key}Preco`];
                                        if (price === undefined || price === null || price === "") return false;
                                        if (qtdTotal > 0 && qtdVendida >= qtdTotal) return false; // Esgotou a cota
                                        return true;
                                      });
                                      
                                      return { category: cat, lot: activeLot || null };
                                    }).filter(Boolean);
                                    
                                    if (availableOptions.length === 0) {
                                      return <div className="text-red-400 text-xs font-bold bg-red-500/10 p-4 rounded-xl text-center border border-red-500/30">Ingressos não disponíveis</div>;
                                    }

                                    return availableOptions.map((opt: any) => {
                                      const { category, lot } = opt;
                                      
                                      if (!lot) {
                                        return (
                                          <div key={`soldout-${category.key}`} className="border-2 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between bg-slate-900/30 border-red-900/30 relative overflow-hidden gap-4 opacity-70">
                                            <div className="flex flex-col gap-1 relative z-10">
                                              <span className={`text-sm font-black uppercase tracking-widest ${category.color}`}>{category.name}</span>
                                              <div className="flex items-center gap-2">
                                                <span className="text-lg font-mono font-black text-red-500 line-through">ESGOTADO</span>
                                              </div>
                                              {category.desc && (
                                                <span className="text-[9px] text-slate-500 max-w-xs">{category.desc}</span>
                                              )}
                                            </div>
                                            <div className="flex items-center justify-start md:justify-end gap-3 relative z-10">
                                              <button disabled className="px-6 py-2 bg-red-950/40 border border-red-900/50 text-red-500 rounded-lg text-xs font-bold cursor-not-allowed w-full md:w-auto uppercase tracking-widest">
                                                Esgotado
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      }

                                      const parsedPrice = parseFloat(lot[`${category.key}Preco`].toString().replace(",", "."));
                                      const cartId = `${lot.id}-${category.key}`;
                                      const itemName = `${category.name} (${lot.name})`;
                                      const cartItem = cart.find((i: any) => i.id === cartId);
                                      const currentQty = cartItem ? cartItem.quantity : 0;
    
                                      return (
                                        <div key={cartId} className="border-2 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between transition-all bg-slate-900/50 border-slate-700/50 relative overflow-hidden gap-4">
                                          <div className="flex flex-col gap-1 relative z-10">
                                            <div className="flex items-center gap-2">
                                              <span className={`text-sm font-black uppercase tracking-widest ${category.color}`}>{category.name}</span>
                                              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-bold">{lot.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-lg font-mono font-black text-white">R$ {parsedPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                              <span className="text-[10px] text-slate-500 font-bold -ml-1 mr-1">+ taxas</span>
                                            </div>
                                            {category.desc && (
                                              <span className="text-[9px] text-slate-500 max-w-xs">{category.desc}</span>
                                            )}
                                          </div>
                                          <div className="flex items-center justify-start md:justify-end gap-3 relative z-10">
                                            {currentQty > 0 ? (
                                              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden h-10">
                                                <button type="button" onClick={() => updateCartQuantity(cartId, -1, area.name, itemName, parsedPrice, "PISTA")} className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700 font-black cursor-pointer">
                                                  <Minus className="w-3 h-3" />
                                                </button>
                                                <div className="flex-1 w-8 text-center text-sm font-black text-white">{currentQty}</div>
                                                <button type="button" onClick={() => updateCartQuantity(cartId, 1, area.name, itemName, parsedPrice, "PISTA")} className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700 font-black cursor-pointer">
                                                  <Plus className="w-3 h-3" />
                                                </button>
                                              </div>
                                            ) : (
                                              <button 
                                                onClick={() => updateCartQuantity(cartId, 1, area.name, itemName, parsedPrice, "PISTA")}
                                                className="px-4 py-2 bg-slate-800 hover:bg-cyan-500/20 hover:border-cyan-500/50 border border-slate-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap w-full md:w-auto"
                                              >
                                                Adicionar
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    });
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
              )}

              {/* Passo 2: Dados dos Participantes */}
              {checkoutStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="space-y-6">
                    {(() => {
                      const hasOwnerSelected = attendees.some(a => a.isOwner);

                      return cart.map((item) => {
                        return Array.from({ length: item.quantity }).map((_, i) => {
                          const attendee = getAttendee(item.id, i);
                          const isThisOwner = attendee.isOwner;
                          const canSelectOwner = !hasOwnerSelected || isThisOwner;

                          return (
                            <div key={`${item.id}-${i}`} className="bg-slate-900/50 border border-slate-700 rounded-2xl p-5 md:p-6 space-y-4">
                              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                                  {i + 1}
                                </div>
                                <div className="flex-1">
                                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block">{item.areaName}</span>
                                  <span className="text-white font-bold">{item.itemName}</span>
                                </div>
                                <label 
                                  className={`text-[10px] px-3 py-1.5 rounded-lg border transition-all font-bold uppercase tracking-widest flex items-center gap-2 ${
                                    isThisOwner 
                                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 cursor-pointer" 
                                      : canSelectOwner
                                        ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 cursor-pointer"
                                        : "bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-50"
                                  }`}
                                  title={!canSelectOwner ? "Você já preencheu seus dados em outro ingresso." : ""}
                                >
                                  <input 
                                    type="checkbox"
                                    checked={isThisOwner || false}
                                    disabled={!canSelectOwner}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      updateAttendee(item.id, i, "isOwner", checked);
                                      if (checked) {
                                        fillWithUserData(item.id, i);
                                      } else {
                                        updateAttendee(item.id, i, "name", "");
                                        updateAttendee(item.id, i, "email", "");
                                        updateAttendee(item.id, i, "cpf", "");
                                        updateAttendee(item.id, i, "birthDate", "");
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <User className="w-3 h-3" />
                                  {isThisOwner ? "Meus Dados (Bloqueado)" : "Sou Eu"}
                                </label>
                              </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                              <div className="md:col-span-2">
                                <label className="text-xs font-bold text-slate-400 mb-1 block">Nome Completo *</label>
                                <input
                                  type="text"
                                  placeholder="Digite o nome completo"
                                  value={attendee.name}
                                  disabled={attendee.isOwner && attendee.name !== ""}
                                  onChange={(e) => updateAttendee(item.id, i, "name", e.target.value)}
                                  className="w-full bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="text-xs font-bold text-slate-400 mb-1 block">E-mail do Participante *</label>
                                <input
                                  type="email"
                                  placeholder="email@exemplo.com"
                                  value={attendee.email}
                                  disabled={attendee.isOwner && attendee.email !== ""}
                                  onChange={(e) => updateAttendee(item.id, i, "email", e.target.value.toLowerCase())}
                                  className="w-full bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-slate-400 mb-1 block">CPF *</label>
                                <input
                                  type="text"
                                  placeholder="000.000.000-00"
                                  value={attendee.cpf}
                                  disabled={attendee.isOwner && attendee.cpf !== ""}
                                  onChange={(e) => handleCpfChange(e.target.value, item.id, i)}
                                  maxLength={14}
                                  className="w-full bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-slate-400 mb-1 block">Data de Nascimento *</label>
                                <input
                                  type="date"
                                  value={attendee.birthDate}
                                  disabled={attendee.isOwner && attendee.birthDate !== ""}
                                  onChange={(e) => updateAttendee(item.id, i, "birthDate", e.target.value)}
                                  className="w-full bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors [color-scheme:dark] disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      });
                    });
                  })()}
                  </div>
                </div>
              )}

              {/* Passo 3: Pagamento */}
              {checkoutStep === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  
                  <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-5 md:p-6 space-y-6">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Escolha a Forma de Pagamento</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("PIX")}
                          className={`h-14 rounded-xl border text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            paymentMethod === "PIX" ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "bg-black/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800"
                          }`}
                        >
                          <QrCode className="w-5 h-5" /> Pix
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("CREDIT_CARD")}
                          className={`h-14 rounded-xl border text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            paymentMethod === "CREDIT_CARD" ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.2)]" : "bg-black/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800"
                          }`}
                        >
                          <CreditCard className="w-5 h-5" /> Cartão
                        </button>
                      </div>
                    </div>

                    {paymentMethod === "PIX" ? (
                      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2 text-emerald-400">
                          <QrCode className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-sm text-emerald-400 font-bold mb-2">Pagamento via Pix</p>
                          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                            O QR Code e a chave Pix "Copia e Cola" serão gerados na próxima tela após você clicar em <strong className="text-emerald-300">"Finalizar Compra"</strong>.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-400 mb-1 block">Número do Cartão *</label>
                            <input
                              type="text"
                              placeholder="0000 0000 0000 0000"
                              value={cardData.number}
                              onChange={(e) => setCardData({...cardData, number: e.target.value.replace(/\D/g, "").replace(/(.{4})/g, '$1 ').trim()})}
                              maxLength={19}
                              className="w-full bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-400 mb-1 block">Nome do Titular (como no cartão) *</label>
                            <input
                              type="text"
                              placeholder="NOME COMPLETO"
                              value={cardData.name}
                              onChange={(e) => setCardData({...cardData, name: e.target.value.toUpperCase()})}
                              className="w-full bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors uppercase"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-400 mb-1 block">Validade *</label>
                            <input
                              type="text"
                              placeholder="MM/AA"
                              value={cardData.expiry}
                              onChange={(e) => {
                                let v = e.target.value.replace(/\D/g, "");
                                if (v.length > 2) v = v.slice(0,2) + "/" + v.slice(2,4);
                                setCardData({...cardData, expiry: v});
                              }}
                              maxLength={5}
                              className="w-full bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-400 mb-1 block">CVV *</label>
                            <input
                              type="text"
                              placeholder="123"
                              value={cardData.cvv}
                              onChange={(e) => setCardData({...cardData, cvv: e.target.value.replace(/\D/g, "")})}
                              maxLength={4}
                              className="w-full bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-400 mb-1 block">Parcelamento *</label>
                            <select
                              value={installments}
                              onChange={(e) => setInstallments(parseInt(e.target.value))}
                              className="w-full bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors appearance-none cursor-pointer"
                            >
                              <option value={1} className="bg-slate-900">1x de R$ {calculateTaxes(totalPrice, "CREDIT_CARD", 1).finalTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})} (à vista)</option>
                              {Array.from({length: 11}).map((_, i) => {
                                const par = i + 2;
                                const taxCalc = calculateTaxes(totalPrice, "CREDIT_CARD", par);
                                const amt = taxCalc.finalTotal / par;
                                return (
                                  <option key={par} value={par} className="bg-slate-900">
                                    {par}x de R$ {amt.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Descrição do Evento e Mapas */}
              {((event.descricao || event.description) || event.mapaGeralUrl || event.mapaCamarotesUrl) && (
                <div className="bg-[#0b0e24] border border-slate-800 rounded-3xl p-6 md:p-8 mt-6">
                  <h3 className="text-lg font-black text-white uppercase tracking-wider mb-4">Sobre o Evento</h3>
                  
                  {/* Descrição */}
                  {(event.descricao || event.description) && (
                    <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed mb-6">
                      {event.descricao || event.description}
                    </div>
                  )}

                  {/* Mapas */}
                  {(event.mapaGeralUrl || event.mapaCamarotesUrl) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-800/80 pt-6">
                      {event.mapaGeralUrl && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-cyan-400" />
                            Mapa da Área
                          </h4>
                          <div className="w-full rounded-2xl overflow-hidden border border-slate-800/80 bg-[#0f1423]">
                            <img src={event.mapaGeralUrl} alt="Mapa Geral do Evento" className="w-full h-auto object-cover" />
                          </div>
                        </div>
                      )}
                      {event.mapaCamarotesUrl && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Ticket className="w-4 h-4 text-purple-400" />
                            Mapa de Camarotes
                          </h4>
                          <div className="w-full rounded-2xl overflow-hidden border border-slate-800/80 bg-[#0f1423]">
                            <img src={event.mapaCamarotesUrl} alt="Mapa de Camarotes do Evento" className="w-full h-auto object-cover" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
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

                {/* Resumo do Carrinho */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Resumo do Pedido</label>
                  
                  {cart.length === 0 ? (
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 text-center text-slate-500 text-xs">
                      Seu carrinho está vazio. Adicione ingressos para continuar.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                      {cart.map(item => (
                        <div key={item.id} className="bg-[#0f1423] p-3 rounded-xl border border-slate-800 flex justify-between items-start gap-2 relative group">
                          <div className="flex-1">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">{item.areaName}</span>
                            <span className="text-sm text-white font-bold block">{item.itemName}</span>
                            <span className="text-xs text-cyan-400 font-mono mt-1 flex items-center flex-wrap gap-1">
                              {item.quantity}x R$ {item.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              <span className="text-[9px] text-slate-500 font-bold">+ taxas</span>
                            </span>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-600 hover:text-red-400 p-1.5 rounded-md hover:bg-slate-800 transition-colors"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Opcional: mostrar acréscimo se no step 3 */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Total a pagar</span>
                    {checkoutStep === 3 && paymentMethod === "CREDIT_CARD" && installments > 1 && (
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                        Com Juros ({installments}x)
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-mono font-black text-cyan-400 flex items-baseline gap-2">
                    R$ {(checkoutStep === 3 ? finalPrice : totalPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    {checkoutStep < 3 && <span className="text-sm font-sans font-bold text-slate-500 tracking-normal">+ taxas</span>}
                  </div>
                  {checkoutStep >= 3 && taxResult.totalTaxes > 0 && (
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                      Inclui R$ {taxResult.totalTaxes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} de taxas
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={purchasing || cart.length === 0}
                  onClick={handleNextStep}
                  className="w-full py-4 bg-gradient-to-r from-cyan-400 via-purple-600 to-pink-500 hover:from-cyan-300 hover:to-pink-400 text-white font-black text-sm rounded-xl uppercase tracking-widest shadow-[0_0_25px_rgba(0,240,255,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasing ? (
                    <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processando...</span>
                  ) : checkoutStep === 1 ? (
                    <>Continuar para Dados <ChevronRight className="w-5 h-5" /></>
                  ) : checkoutStep === 2 ? (
                    <>Ir para Pagamento <ChevronRight className="w-5 h-5" /></>
                  ) : (
                    <>Finalizar Compra <CheckCircle2 className="w-5 h-5" /></>
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

      {errorMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-red-950 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl shadow-[0_0_40px_rgba(220,38,38,0.2)] flex items-center gap-3 max-w-[90vw] w-fit">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
