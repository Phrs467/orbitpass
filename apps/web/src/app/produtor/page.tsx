"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Ticket, Tag, BarChart3, MapPin, DollarSign, ChevronLeft, ShieldAlert, Building2, Edit3, Trash2, CalendarDays, Users, Settings, CreditCard, TrendingUp, LayoutDashboard, Megaphone, HelpCircle, LogOut, ChevronDown, User, ShoppingCart, Search, Filter, Eye, CheckCircle2 } from "lucide-react";
import { PassLogo } from "@/components/PassLogo";
import { OrbitSelect } from "@/components/OrbitSelect";
import { AuthModal } from "@/components/AuthModal";
import { CamaroteGridBuilder } from "@/components/CamaroteGridBuilder";

const INITIAL_PRODUCER_EVENTS: any[] = [];

const CITIES = [
  "São Paulo",
  "Rio de Janeiro",
  "Curitiba",
  "Belo Horizonte",
  "Florianópolis",
  "Brasília",
  "Salvador",
];

const COUPON_TYPES = [
  { value: "PERCENTUAL", label: "Porcentagem (%)" },
  { value: "VALOR_FIXO", label: "Valor Fixo (R$)" },
];

const AGE_RATING_OPTIONS = [
  { value: "0", label: "Livre" },
  { value: "10", label: "10+" },
  { value: "12", label: "12+" },
  { value: "16", label: "16+" },
  { value: "18", label: "18+" },
];

export default function ProducerDashboardPage() {
  const [user, setUser] = useState<{ name: string; email: string; role?: string; cnpj?: string; tipoPessoa?: string } | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [events, setEvents] = useState<any[]>(INITIAL_PRODUCER_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(INITIAL_PRODUCER_EVENTS.length > 0 ? INITIAL_PRODUCER_EVENTS[0] : null);
  const [viewTab, setViewTab] = useState<"overview" | "eventos" | "create-event" | "financeiro" | "cupons" | "vendas" | "marketing" | "configuracoes">("overview");
  const [selectedFinanceEvent, setSelectedFinanceEvent] = useState<any | null>(null);
  const [salesSearch, setSalesSearch] = useState("");
  const [salesEventFilter, setSalesEventFilter] = useState("all");
  const [salesAreaFilter, setSalesAreaFilter] = useState("all");
  const [couponEventFilter, setCouponEventFilter] = useState<string>("all");
  const [financeEventFilter, setFinanceEventFilter] = useState<string>("all");
  const [collapsedFinanceBreakdowns, setCollapsedFinanceBreakdowns] = useState<Record<string, boolean>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [metricsTableCollapsed, setMetricsTableCollapsed] = useState(false);
  const [collapsedAreaCards, setCollapsedAreaCards] = useState<Record<string, boolean>>({});
  const [collapsedFormSections, setCollapsedFormSections] = useState<Record<string, boolean>>({});
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; title: string; message: string } | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCity, setNewCity] = useState("São Paulo");
  const [newLocation, setNewLocation] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newClassificacao, setNewClassificacao] = useState("0");
  const [areas, setAreas] = useState<any[]>([
    {
      id: "area-1",
      name: "Pista Geral",
      type: "PISTA",
      lots: [{ id: "lote-1", name: "1º Lote", price: "150.00", quantity: "500" }]
    }
  ]);

  // New Coupon Form
  const [couponCode, setCouponCode] = useState("");
  const [couponValue, setCouponValue] = useState("");
  const [couponType, setCouponType] = useState("PERCENTUAL");

  const fetchProducerEvents = async (email: string) => {
    try {
      const res = await fetch(`/api/events?produtorId=${encodeURIComponent(email || "all")}`);
      const data = await res.json();
      if (data.events && Array.isArray(data.events)) {
        setEvents(data.events);
        if (data.events.length > 0) {
          setSelectedEvent(data.events[0]);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar eventos do banco de dados:", err);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("pass_user");
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setUser(u);
        fetchProducerEvents(u.email || "all");
      } catch (e) {
        console.error(e);
      }
    } else {
      setAuthOpen(true);
    }
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Dynamically sum capacity from all areas, lots, and camarotes
    let calculatedCapacity = 0;
    (areas || []).forEach((area: any) => {
      if (area.type === "PISTA" && area.lots) {
        area.lots.forEach((lot: any) => {
          calculatedCapacity += parseInt(lot.quantity || lot.total || 0, 10) || 0;
        });
      } else if (area.type === "CAMAROTE" && area.models) {
        area.models.forEach((m: any) => {
          const count = Object.values(area.cells || {}).filter(id => id === m.id).length;
          const cap = parseInt(m.capacity || 1, 10);
          calculatedCapacity += (count || 1) * cap;
        });
      }
    });

    const prodId = user?.email || user?.name || "produtor-default";

    const newEvt = {
      id: editingEventId || `evt-${Date.now()}`,
      title: newTitle || "Novo Evento",
      descricao: newDescription,
      city: newCity,
      location: newLocation || "Arena Principal",
      date: newDate || "30/12/2024",
      classificacao: parseInt(newClassificacao, 10) || 0,
      status: "PUBLICADO",
      totalCapacity: calculatedCapacity > 0 ? calculatedCapacity : 1000,
      ticketsSold: 0,
      revenue: "0,00",
      areas: areas,
      lots: areas[0]?.lots || [],
      coupons: [],
      produtorId: prodId,
    };
    
    if (editingEventId) {
      setEvents(events.map(ev => ev.id === editingEventId ? { ...ev, ...newEvt } : ev));
    } else {
      setEvents([newEvt, ...events]);
    }
    setSelectedEvent(newEvt);

    // Persiste diretamente no banco de dados Neon DB via API
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvt),
      });
      const resData = await res.json();
      
      if (!resData.success) {
        throw new Error(resData.error || "Erro desconhecido ao salvar evento");
      }
      
      fetchProducerEvents(prodId);
      
      const isEditing = Boolean(editingEventId);

      setEditingEventId(null);
      setNewTitle("");
      setNewLocation("");
      setNewClassificacao("0");
      setViewTab("overview");

      setToast({
        show: true,
        title: isEditing ? "Alterações Salvas!" : "Evento Publicado!",
        message: isEditing
          ? `As alterações no evento "${newEvt.title}" foram registradas com sucesso no banco de dados.`
          : `O evento "${newEvt.title}" foi publicado com sucesso no banco de dados.`,
      });

      setTimeout(() => {
        setToast(null);
      }, 4000);
      
    } catch (err: any) {
      console.error("Erro ao gravar evento no Neon DB:", err);
      // Revert optimistic update
      fetchProducerEvents(prodId);
      alert("Erro crítico ao salvar no banco de dados: " + err.message + "\n\nPor favor, verifique a conexão ou a estrutura das tabelas.");
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode || !selectedEvent) return;
    const newCpn = {
      code: couponCode.toUpperCase(),
      discount: couponType === "PERCENTUAL" ? `${couponValue}%` : `R$ ${couponValue}`,
      type: couponType,
      usedCount: 0,
      revenueGenerated: "0,00",
    };

    const updatedEvent = {
      ...selectedEvent,
      coupons: [...(selectedEvent.coupons || []), newCpn],
    };
    setSelectedEvent(updatedEvent);
    setEvents(events.map(ev => ev.id === selectedEvent.id ? updatedEvent : ev));
    setCouponCode("");
    setCouponValue("");

    try {
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedEvent),
      });
    } catch (err) {
      console.error("Erro ao salvar cupom no Neon DB:", err);
    }
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "DELETE" | "INACTIVATE" | "REACTIVATE";
    event: any | null;
  } | null>(null);

  const handleDeleteOrInactivateEvent = (evt: any) => {
    const hasSales = (evt.ticketsSold || 0) > 0;
    if (hasSales) {
      const isInactive = evt.status === "INATIVO";
      setConfirmModal({
        isOpen: true,
        type: isInactive ? "REACTIVATE" : "INACTIVATE",
        event: evt,
      });
    } else {
      setConfirmModal({
        isOpen: true,
        type: "DELETE",
        event: evt,
      });
    }
  };

  const executeConfirmAction = async () => {
    if (!confirmModal?.event) return;
    const evt = confirmModal.event;

    if (confirmModal.type === "DELETE") {
      const remaining = events.filter(e => e.id !== evt.id);
      setEvents(remaining);
      if (selectedEvent?.id === evt.id) {
        setSelectedEvent(remaining.length > 0 ? remaining[0] : null);
      }

      try {
        await fetch(`/api/events?id=${evt.id}`, { method: "DELETE" });
      } catch (err) {
        console.error("Erro ao excluir evento:", err);
      }
    } else {
      const newStatus = confirmModal.type === "REACTIVATE" ? "PUBLICADO" : "INATIVO";
      const updated = { ...evt, status: newStatus };
      setEvents(events.map(e => e.id === evt.id ? updated : e));
      if (selectedEvent?.id === evt.id) setSelectedEvent(updated);

      try {
        await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
      } catch (err) {
        console.error("Erro ao alterar status do evento:", err);
      }
    }

    setConfirmModal(null);
  };

  const isProducer = user && (user.role === "PRODUTOR" || user.role === "ADMIN");

  return (
    <div className="min-h-screen bg-[#090c15] text-white flex flex-col font-sans">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-[#090c15]/90 sticky top-0 z-40 backdrop-blur-md">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold">
            <ChevronLeft className="w-4 h-4" />
            <span>Voltar ao Início</span>
          </Link>
          <PassLogo size="sm" />
          <div className="flex items-center gap-3">
            <div className="text-xs font-bold text-cyan-400 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>Painel do Produtor</span>
            </div>
            {user && (
              <Link
                href="/"
                onClick={() => localStorage.removeItem("pass_user")}
                className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold transition-colors cursor-pointer"
                title="Sair do Painel"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {!user ? (
          <div className="text-center py-20 space-y-4">
            <PassLogo size="md" showSubtitle={true} />
            <p className="text-xs text-slate-400">Aguardando login de Produtor...</p>
            <button
              onClick={() => setAuthOpen(true)}
              className="px-5 py-2 bg-cyan-400 text-black font-extrabold rounded-xl text-xs hover:bg-cyan-300 transition-colors cursor-pointer"
            >
              Fazer Login como Produtor
            </button>
          </div>
        ) : !isProducer ? (
          /* Bloqueio de Acesso por RBAC */
          <div className="max-w-md mx-auto my-12 p-8 bg-[#0f1423] border border-red-500/30 rounded-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Sua conta é de Comprador</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Você está conectado como <span className="text-white font-semibold">{user.name}</span> (Comprador). Para gerenciar eventos, crie um perfil de Produtor (PF ou PJ CNPJ).
              </p>
            </div>

            <button
              onClick={() => setAuthOpen(true)}
              className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              <span>Cadastrar Conta de Produtor</span>
            </button>
          </div>
        ) : (
          /* Painel Completo do Produtor */
          <div className="flex gap-0">
            {/* Sidebar */}
            <aside className={`hidden md:flex flex-col ${sidebarCollapsed ? 'w-[68px]' : 'w-[240px]'} transition-all duration-300 shrink-0 sticky top-16 self-start h-[calc(100vh-4rem)]`}>
              <div className="flex flex-col h-full bg-[#0a0d1a] border-r border-slate-800">
                {/* Profile Header (Static + Collapse Toggle) */}
                <div className={`p-4 border-b border-slate-800 flex items-center justify-between gap-2 ${sidebarCollapsed ? 'justify-center p-3' : ''}`}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                      {user.name?.charAt(0)?.toUpperCase() || "P"}
                    </div>
                    {!sidebarCollapsed && (
                      <div className="overflow-hidden flex-1 text-left">
                        <p className="text-sm font-bold text-white truncate">{user.name}</p>
                        <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">
                          {user.tipoPessoa === "PESSOA_JURIDICA" ? "PJ • CNPJ" : "PF • Produtor"}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors cursor-pointer shrink-0"
                    title={sidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
                  >
                    <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
                  {[
                    { key: "overview", icon: LayoutDashboard, label: "Dashboard" },
                    { key: "eventos", icon: CalendarDays, label: "Meus Eventos" },
                    { key: "vendas", icon: ShoppingCart, label: "Vendas" },
                    { key: "financeiro", icon: CreditCard, label: "Financeiro" },
                    { key: "cupons", icon: Tag, label: "Cupons" },
                    { key: "marketing", icon: Megaphone, label: "Marketing" },
                    { key: "configuracoes", icon: Settings, label: "Configurações" },
                  ].map(({ key, icon: Icon, label }) => (
                    <button
                      key={key}
                      onClick={() => setViewTab(key as any)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        viewTab === key
                          ? "bg-cyan-400/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,240,255,0.08)]"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && <span>{label}</span>}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0d1a]/95 backdrop-blur-lg border-t border-slate-800 flex justify-around py-2 px-1">
              {[
                { key: "overview", icon: LayoutDashboard, label: "Home" },
                { key: "eventos", icon: CalendarDays, label: "Eventos" },
                { key: "vendas", icon: ShoppingCart, label: "Vendas" },
                { key: "financeiro", icon: CreditCard, label: "Finanças" },
                { key: "cupons", icon: Tag, label: "Cupons" },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setViewTab(key as any)}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[9px] font-bold transition-colors cursor-pointer ${
                    viewTab === key ? "text-cyan-400" : "text-slate-500"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0 p-6 md:p-8 space-y-6 pb-24 md:pb-8">

              {/* === DASHBOARD === */}
              {viewTab === "overview" && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-black text-white tracking-tight">Dashboard</h1>
                      <p className="text-xs text-slate-400 mt-0.5">Visão geral da sua operação</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingEventId(null);
                        setNewTitle("");
                        setNewCity("São Paulo");
                        setNewLocation("");
                        setNewDate("");
                        setAreas([{
                          id: "area-1",
                          name: "Pista Geral",
                          type: "PISTA",
                          lots: [{ id: "lote-1", name: "1º Lote", price: "150.00", quantity: "500" }]
                        }]);
                        setViewTab("create-event");
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-purple-600 hover:from-cyan-300 hover:to-purple-500 text-white font-black text-xs rounded-xl uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Criar Novo Evento
                    </button>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#0f1423] border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 blur-2xl rounded-full"></div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Eventos Ativos</span>
                      <p className="text-3xl font-black text-white">{events.length}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-400">Publicados</span>
                      </div>
                    </div>
                    <div className="bg-[#0f1423] border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 blur-2xl rounded-full"></div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Ingressos Vendidos</span>
                      <p className="text-3xl font-black text-white">{events.reduce((acc, e) => acc + (e.ticketsSold || 0), 0)}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Ticket className="w-3 h-3 text-cyan-400" />
                        <span className="text-[10px] font-bold text-cyan-400">Total geral</span>
                      </div>
                    </div>
                    <div className="bg-[#0f1423] border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 blur-2xl rounded-full"></div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Receita Total</span>
                      <p className="text-3xl font-black text-white">R$ {events.reduce((acc, e) => acc + parseFloat((e.revenue || "0").replace(",", ".")), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <DollarSign className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-400">Bruta</span>
                      </div>
                    </div>
                    <div className="bg-[#0f1423] border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/5 blur-2xl rounded-full"></div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Cupons Ativos</span>
                      <p className="text-3xl font-black text-white">{events.reduce((acc, e) => acc + (e.coupons?.length || 0), 0)}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Tag className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] font-bold text-purple-400">Descontos</span>
                      </div>
                    </div>
                  </div>

                  {/* Events List */}
                  <div>
                    <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-cyan-400" />
                      Eventos Recentes
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {events.length === 0 ? (
                        <div className="col-span-full text-center py-16 bg-[#0f1423] border border-dashed border-slate-700 rounded-2xl">
                          <CalendarDays className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                          <p className="text-sm font-bold text-slate-400">Nenhum evento criado ainda</p>
                          <p className="text-xs text-slate-600 mt-1">Crie seu primeiro evento e comece a vender ingressos</p>
                          <button
                            onClick={() => setViewTab("create-event")}
                            className="mt-4 px-5 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            Criar Primeiro Evento
                          </button>
                        </div>
                      ) : (
                        events.map((evt) => (
                          <div
                            key={evt.id}
                            onClick={() => setSelectedEvent(evt)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                              selectedEvent?.id === evt.id
                                ? "bg-gradient-to-br from-[#0f1423] via-[#11182d] to-[#0f1423] border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.15)] ring-1 ring-cyan-400/50"
                                : "bg-[#0f1423] border-slate-800 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                selectedEvent?.id === evt.id
                                  ? "text-cyan-300 bg-cyan-400/20 border border-cyan-400/40"
                                  : "text-cyan-400 bg-cyan-400/10"
                              }`}>
                                {evt.status || "PUBLICADO"}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingEventId(evt.id);
                                    setNewTitle(evt.title);
                                    setNewCity(evt.city);
                                    setNewLocation(evt.location);
                                    setNewDate(evt.date);
                                    setNewClassificacao(String(evt.classificacao || 0));
                                    setAreas(evt.areas || []);
                                    setViewTab("create-event");
                                  }}
                                  className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors cursor-pointer"
                                  title="Editar Evento"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setSelectedEvent(evt)}
                                  className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors cursor-pointer"
                                  title="Ver Métricas"
                                >
                                  <BarChart3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteOrInactivateEvent(evt)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    (evt.ticketsSold || 0) > 0
                                      ? evt.status === "INATIVO"
                                        ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                                        : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400"
                                      : "bg-red-500/10 hover:bg-red-500/20 text-red-400"
                                  }`}
                                  title={(evt.ticketsSold || 0) > 0 ? (evt.status === "INATIVO" ? "Reativar Evento" : "Inativar Evento (Possui vendas)") : "Excluir Evento"}
                                >
                                  {(evt.ticketsSold || 0) > 0 ? (
                                    <ShieldAlert className="w-3 h-3" />
                                  ) : (
                                    <Trash2 className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div onClick={() => setSelectedEvent(evt)} className="cursor-pointer">
                              <h3 className="font-bold text-white text-sm">{evt.title}</h3>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1.5">
                                <MapPin className="w-3 h-3" />
                                <span>{evt.location}</span>
                                <span>•</span>
                                <span>{evt.city}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                                <CalendarDays className="w-3 h-3" />
                                <span>{evt.date}</span>
                              </div>
                            </div>
                            {/* Mini progress */}
                            <div className="mt-4 pt-3 border-t border-slate-800">
                              <div className="flex justify-between text-[10px] mb-1.5">
                                <span className="text-slate-500 font-bold">{evt.ticketsSold || 0} vendidos</span>
                                <span className="text-slate-600">{evt.totalCapacity || 0} total</span>
                              </div>
                              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full rounded-full transition-all"
                                  style={{ width: `${((evt.ticketsSold || 0) / (evt.totalCapacity || 1)) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Selected Event Details */}
                  {selectedEvent && (
                    <div className="space-y-4">
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-cyan-400" />
                        Métricas: {selectedEvent.title}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-[#0f1423] border border-slate-800 p-5 rounded-2xl">
                          <span className="text-xs font-bold text-slate-400 block mb-1">Ingressos Vendidos</span>
                          <p className="text-2xl font-black text-white">{selectedEvent.ticketsSold} <span className="text-xs font-normal text-slate-500">/ {selectedEvent.totalCapacity}</span></p>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div
                              className="bg-cyan-400 h-full rounded-full"
                              style={{ width: `${(selectedEvent.ticketsSold / selectedEvent.totalCapacity) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="bg-[#0f1423] border border-slate-800 p-5 rounded-2xl">
                          <span className="text-xs font-bold text-slate-400 block mb-1">Receita Bruta Total</span>
                          <p className="text-2xl font-black text-white">R$ {selectedEvent.revenue}</p>
                        </div>
                        <div className="bg-[#0f1423] border border-slate-800 p-5 rounded-2xl">
                          <span className="text-xs font-bold text-slate-400 block mb-1">Cupons Ativos</span>
                          <p className="text-2xl font-black text-white">{selectedEvent.coupons.length}</p>
                        </div>
                      </div>

                      {/* Lots Table */}
                      <div className="bg-[#0f1423] border border-slate-800 rounded-2xl p-5 transition-all">
                        <div 
                          onClick={() => setMetricsTableCollapsed(!metricsTableCollapsed)}
                          className="flex items-center justify-between mb-3 cursor-pointer group select-none"
                        >
                          <h3 className="text-sm font-bold text-white flex items-center gap-2 group-hover:text-cyan-400 transition-colors">
                            <Ticket className="w-4 h-4 text-cyan-400" />
                            <span>Métricas de Ingressos por Área & Lote</span>
                            <span className="text-[10px] text-slate-500 font-normal ml-2">(Clique para {metricsTableCollapsed ? "expandir" : "recolher"})</span>
                          </h3>
                          <button
                            type="button"
                            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 group-hover:text-cyan-400 transition-colors"
                            title={metricsTableCollapsed ? "Expandir Tabela" : "Recolher Tabela"}
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${metricsTableCollapsed ? '-rotate-90 text-slate-500' : 'rotate-0 text-cyan-400'}`} />
                          </button>
                        </div>

                        {!metricsTableCollapsed && (
                          <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-300">
                            <thead className="uppercase tracking-wider text-slate-500 border-b border-slate-800">
                              <tr>
                                <th className="py-2 px-3">Setor / Área</th>
                                <th className="py-2 px-3">Nome / Modelo</th>
                                <th className="py-2 px-3">Preço</th>
                                <th className="py-2 px-3">Vendidos / Total</th>
                                <th className="py-2 px-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                              {(() => {
                                const allItems: any[] = [];
                                const eventAreas = selectedEvent.areas || [
                                  { name: "Pista Geral", type: "PISTA", lots: selectedEvent.lots || [] }
                                ];
                                
                                eventAreas.forEach((area: any) => {
                                  if (area.type === "PISTA" && area.lots) {
                                    area.lots.forEach((lot: any) => {
                                      allItems.push({
                                        areaName: area.name,
                                        name: lot.name,
                                        type: "PISTA",
                                        price: lot.price,
                                        sold: lot.sold || 0,
                                        total: lot.total || lot.quantity || 0,
                                        status: lot.status || "ATIVO"
                                      });
                                    });
                                  } else if (area.type === "CAMAROTE" && area.models) {
                                    area.models.forEach((m: any) => {
                                      const paintedCount = Object.values(area.cells || {}).filter(id => id === m.id).length;
                                      allItems.push({
                                        areaName: area.name,
                                        name: m.name,
                                        type: "CAMAROTE",
                                        price: m.price,
                                        sold: m.sold || 0,
                                        total: paintedCount || m.quantity || 10,
                                        capacity: m.capacity,
                                        status: m.status || "ATIVO"
                                      });
                                    });
                                  }
                                });

                                if (allItems.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan={5} className="py-6 text-center text-slate-500">
                                        Nenhuma área ou lote configurado para este evento.
                                      </td>
                                    </tr>
                                  );
                                }

                                return allItems.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-slate-900 transition-colors">
                                    <td className="py-2.5 px-3">
                                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                                        item.type === 'CAMAROTE' 
                                          ? 'bg-purple-900/40 text-purple-300 border border-purple-500/30' 
                                          : 'bg-cyan-900/40 text-cyan-300 border border-cyan-500/30'
                                      }`}>
                                        {item.areaName}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 font-bold text-white">{item.name}</td>
                                    <td className="py-2.5 px-3 font-mono text-cyan-400">R$ {item.price}</td>
                                    <td className="py-2.5 px-3">
                                      {item.sold} / {item.total} {item.capacity ? `(${item.capacity} Pessoas/un)` : ''}
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                        item.status === 'ESGOTADO' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      }`}>
                                        {item.status}
                                      </span>
                                    </td>
                                  </tr>
                                ));
                              })()}
                            </tbody>
                          </table>
                        </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* === MEUS EVENTOS (LISTAGEM) === */}
              {viewTab === "eventos" && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-black text-white tracking-tight">Meus Eventos</h1>
                      <p className="text-xs text-slate-400 mt-0.5">Gerencie todos os seus eventos cadastrados</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingEventId(null);
                        setNewTitle("");
                        setNewCity("São Paulo");
                        setNewLocation("");
                        setNewDate("");
                        setNewClassificacao("0");
                        setAreas([{
                          id: "area-1",
                          name: "Pista Geral",
                          type: "PISTA",
                          lots: [{ id: "lote-1", name: "1º Lote", price: "150.00", quantity: "500" }]
                        }]);
                        setViewTab("create-event");
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-purple-600 hover:from-cyan-300 hover:to-purple-500 text-white font-black text-xs rounded-xl uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Novo Evento
                    </button>
                  </div>

                  {events.length === 0 ? (
                    <div className="text-center py-20 bg-[#0f1423] border border-dashed border-slate-700 rounded-2xl">
                      <CalendarDays className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-400">Nenhum evento criado ainda</p>
                      <p className="text-xs text-slate-600 mt-1">Crie seu primeiro evento e comece a vender ingressos</p>
                      <button onClick={() => setViewTab("create-event")} className="mt-4 px-5 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs rounded-xl transition-colors cursor-pointer">
                        Criar Primeiro Evento
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {events.map((evt) => (
                        <div key={evt.id} className="bg-[#0f1423] border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-all">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-bold text-white text-base">{evt.title}</h3>
                              <span className="text-[9px] font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-md uppercase tracking-wider">{evt.status || "PUBLICADO"}</span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] text-slate-500">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{evt.location} • {evt.city}</span>
                              <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{evt.date}</span>
                              <span className="flex items-center gap-1"><Ticket className="w-3 h-3" />{evt.ticketsSold || 0} / {evt.totalCapacity || 0} vendidos</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => { 
                              setEditingEventId(evt.id); 
                              setNewTitle(evt.title); 
                              setNewDescription(evt.descricao || evt.description || "");
                              setNewCity(evt.city); 
                              setNewLocation(evt.location); 
                              
                              // Convert DD/MM/YYYY to YYYY-MM-DD for date input
                              let dValue = evt.date || "";
                              if (dValue.includes("/")) {
                                const [d, m, y] = dValue.split("/");
                                dValue = `${y}-${m}-${d}`;
                              }
                              setNewDate(dValue); 
                              
                              setNewClassificacao(String(evt.classificacao || 0)); 
                              setAreas(evt.areas || []); 
                              setViewTab("create-event"); 
                            }} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5">
                              <Edit3 className="w-3 h-3" /> Editar
                            </button>
                            <button onClick={() => { setSelectedEvent(evt); setViewTab("overview"); }} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5">
                              <BarChart3 className="w-3 h-3" /> Métricas
                            </button>
                            <button
                              onClick={() => handleDeleteOrInactivateEvent(evt)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                                (evt.ticketsSold || 0) > 0
                                  ? evt.status === "INATIVO"
                                    ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {(evt.ticketsSold || 0) > 0 ? (
                                <>
                                  <ShieldAlert className="w-3 h-3" />
                                  {evt.status === "INATIVO" ? "Reativar" : "Inativar"}
                                </>
                              ) : (
                                <>
                                  <Trash2 className="w-3 h-3" />
                                  Excluir
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* === VENDAS === */}
              {viewTab === "vendas" && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Vendas</h1>
                    <p className="text-xs text-slate-400 mt-0.5">Acompanhe todas as vendas de ingressos por evento</p>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Buscar por nome, CPF ou e-mail..."
                        value={salesSearch}
                        onChange={(e) => setSalesSearch(e.target.value)}
                        className="w-full bg-[#0f1423] border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-slate-500" />
                      <OrbitSelect
                        options={[{ value: "all", label: "Todos os Eventos" }, ...events.map(e => ({ value: e.id, label: e.title }))]}
                        value={salesEventFilter}
                        onChange={(val) => { setSalesEventFilter(val); setSalesAreaFilter("all"); }}
                        className="w-[200px]"
                      />
                    </div>
                  </div>

                  {/* Area/Category Filter */}
                  {salesEventFilter !== "all" && (() => {
                    const selectedEvt = events.find(e => e.id === salesEventFilter);
                    const areas = selectedEvt?.areas || [];
                    return areas.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Categoria:</span>
                        <button
                          onClick={() => setSalesAreaFilter("all")}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            salesAreaFilter === "all"
                              ? "bg-cyan-400/15 text-cyan-400 border border-cyan-500/30"
                              : "bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white"
                          }`}
                        >
                          Todas as Áreas
                        </button>
                        {areas.map((area: any) => (
                          <button
                            key={area.id}
                            onClick={() => setSalesAreaFilter(area.id)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              salesAreaFilter === area.id
                                ? area.type === "CAMAROTE"
                                  ? "bg-purple-400/15 text-purple-400 border border-purple-500/30"
                                  : "bg-cyan-400/15 text-cyan-400 border border-cyan-500/30"
                                : "bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white"
                            }`}
                          >
                            {area.type === "CAMAROTE" && (
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                            )}
                            {area.type === "PISTA" && (
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                            )}
                            {area.name}
                            {area.type === "CAMAROTE" && <span className="text-[8px] opacity-60">VIP</span>}
                          </button>
                        ))}
                      </div>
                    ) : null;
                  })()}

                  {/* Sales Table */}
                  <div className="bg-[#0f1423] border border-slate-800 rounded-2xl overflow-hidden">
                    {events.length === 0 ? (
                      <div className="text-center py-16">
                        <ShoppingCart className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-400">Nenhuma venda registrada</p>
                        <p className="text-xs text-slate-600 mt-1">As vendas aparecerão aqui quando os ingressos forem comercializados</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="uppercase tracking-wider text-[10px] text-slate-500 border-b border-slate-800 bg-slate-900/50">
                            <tr>
                              <th className="py-3 px-4">Comprador</th>
                              <th className="py-3 px-4">CPF</th>
                              <th className="py-3 px-4">Evento</th>
                              <th className="py-3 px-4">Área / Lote</th>
                              <th className="py-3 px-4">Valor</th>
                              <th className="py-3 px-4">Data</th>
                              <th className="py-3 px-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            <tr className="text-center">
                              <td colSpan={7} className="py-10 text-slate-500">
                                <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                                <p className="text-xs font-bold">Nenhuma venda registrada ainda</p>
                                <p className="text-[10px] text-slate-600 mt-1">Os dados dos compradores aparecerão aqui em tempo real</p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* === CUPONS === */}
              {viewTab === "cupons" && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-black text-white tracking-tight">Cupons de Desconto</h1>
                      <p className="text-xs text-slate-400 mt-0.5">Crie e gerencie cupons para seus eventos</p>
                    </div>
                  </div>

                  {/* Event Filter */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400">Evento:</span>
                    <OrbitSelect
                      options={[{ value: "all", label: "Todos os Eventos" }, ...events.map(e => ({ value: e.id, label: e.title }))]}
                      value={couponEventFilter}
                      onChange={setCouponEventFilter}
                      className="w-[250px]"
                    />
                  </div>

                  {events.length === 0 ? (
                    <div className="text-center py-16 bg-[#0f1423] border border-dashed border-slate-700 rounded-2xl">
                      <Tag className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-400">Crie um evento primeiro</p>
                      <p className="text-xs text-slate-600 mt-1">Para cadastrar cupons, é necessário ter pelo menos um evento</p>
                    </div>
                  ) : (
                    <>
                      {/* Create Coupon Form */}
                      <div className="bg-[#0f1423] border border-slate-800 rounded-2xl p-5 space-y-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Plus className="w-4 h-4 text-cyan-400" />
                          Criar Novo Cupom
                        </h3>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          if (!couponCode || couponEventFilter === 'all') return;
                          const targetEvt = events.find(ev => ev.id === couponEventFilter);
                          if (!targetEvt) return;
                          const newCpn = {
                            code: couponCode.toUpperCase(),
                            discount: couponType === 'PERCENTUAL' ? `${couponValue}%` : `R$ ${couponValue}`,
                            type: couponType,
                            usedCount: 0,
                            revenueGenerated: '0,00',
                          };
                          const updatedEvent = { ...targetEvt, coupons: [...(targetEvt.coupons || []), newCpn] };
                          setEvents(events.map(ev => ev.id === couponEventFilter ? updatedEvent : ev));
                          if (selectedEvent?.id === couponEventFilter) setSelectedEvent(updatedEvent);
                          setCouponCode('');
                          setCouponValue('');
                        }} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                          <div>
                            <span className="block text-[10px] text-slate-500 mb-1">Evento *</span>
                            <OrbitSelect
                              options={events.map(e => ({ value: e.id, label: e.title }))}
                              value={couponEventFilter === 'all' ? (events[0]?.id || '') : couponEventFilter}
                              onChange={setCouponEventFilter}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-500 mb-1">Código *</span>
                            <input type="text" placeholder="VERAO20" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-white uppercase font-bold focus:outline-none focus:border-cyan-400 placeholder:text-slate-600" />
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-500 mb-1">Valor</span>
                            <input type="text" placeholder="20" value={couponValue} onChange={(e) => setCouponValue(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-600" />
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-500 mb-1">Tipo</span>
                            <OrbitSelect options={COUPON_TYPES} value={couponType} onChange={setCouponType} className="w-full" />
                          </div>
                          <button type="submit" className="py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs rounded-xl uppercase transition-colors cursor-pointer">
                            + Criar Cupom
                          </button>
                        </form>
                      </div>

                      {/* Coupons List */}
                      {events.filter(e => couponEventFilter === 'all' || e.id === couponEventFilter).map(evt => (
                        (evt.coupons?.length > 0) && (
                          <div key={evt.id} className="bg-[#0f1423] border border-slate-800 rounded-2xl p-5">
                            <h3 className="text-sm font-bold text-white mb-3">{evt.title}</h3>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs text-slate-300">
                                <thead className="uppercase tracking-wider text-[10px] text-slate-500 border-b border-slate-800">
                                  <tr>
                                    <th className="py-2 px-3">Código</th>
                                    <th className="py-2 px-3">Desconto</th>
                                    <th className="py-2 px-3">Utilizações</th>
                                    <th className="py-2 px-3">Receita Gerada</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                  {evt.coupons.map((cpn: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-900 transition-colors">
                                      <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">{cpn.code}</td>
                                      <td className="py-2.5 px-3 font-bold">{cpn.discount}</td>
                                      <td className="py-2.5 px-3">{cpn.usedCount} ingressos</td>
                                      <td className="py-2.5 px-3 font-mono font-bold text-white">R$ {cpn.revenueGenerated}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )
                      ))}

                      {events.filter(e => couponEventFilter === 'all' || e.id === couponEventFilter).every(e => !e.coupons?.length) && (
                        <div className="text-center py-10 bg-[#0f1423] border border-slate-800 rounded-2xl">
                          <Tag className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-500">Nenhum cupom cadastrado</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* === FINANCEIRO === */}
              {viewTab === "financeiro" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-black text-white tracking-tight">Financeiro</h1>
                      <p className="text-xs text-slate-400 mt-0.5">Relatórios financeiros detalhados por evento</p>
                    </div>

                    {events.length > 0 && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400">Filtrar por Evento:</span>
                        <OrbitSelect
                          options={[{ value: "all", label: "Todos os Eventos" }, ...events.map(e => ({ value: e.id, label: e.title }))]}
                          value={financeEventFilter}
                          onChange={setFinanceEventFilter}
                          className="w-[250px]"
                        />
                      </div>
                    )}
                  </div>

                  {events.length === 0 ? (
                    <div className="text-center py-16 bg-[#0f1423] border border-dashed border-slate-700 rounded-2xl">
                      <CreditCard className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-400">Sem dados financeiros</p>
                      <p className="text-xs text-slate-600 mt-1">Crie e venda ingressos para ver seus relatórios</p>
                    </div>
                  ) : (
                    <>
                      {/* Global Stats calculated based on event filter */}
                      {(() => {
                        const filteredEvents = events.filter(e => financeEventFilter === "all" || e.id === financeEventFilter);
                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-[#0f1423] border border-slate-800 p-5 rounded-2xl">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Receita Bruta Total</span>
                              <p className="text-2xl font-black text-white">R$ {filteredEvents.reduce((acc, e) => acc + parseFloat((e.revenue || '0').replace(',', '.')), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="bg-[#0f1423] border border-slate-800 p-5 rounded-2xl">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Total de Ingressos</span>
                              <p className="text-2xl font-black text-white">{filteredEvents.reduce((acc, e) => acc + (e.ticketsSold || 0), 0)} vendidos</p>
                            </div>
                            <div className="bg-[#0f1423] border border-slate-800 p-5 rounded-2xl">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Cupons Utilizados</span>
                              <p className="text-2xl font-black text-white">{filteredEvents.reduce((acc, e) => acc + (e.coupons || []).reduce((a: number, c: any) => a + (c.usedCount || 0), 0), 0)}</p>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Per-Event Breakdown */}
                      {events.filter(e => financeEventFilter === "all" || e.id === financeEventFilter).map(evt => (
                        <div key={evt.id} className="bg-[#0f1423] border border-slate-800 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                              <CalendarDays className="w-4 h-4 text-cyan-400" />
                              {evt.title}
                            </h3>
                            <span className="text-xs font-mono font-bold text-cyan-400">R$ {evt.revenue || '0,00'}</span>
                          </div>

                          {/* Area, Lot & Camarote Breakdown (Collapsible) */}
                          <div className="border-t border-slate-800/80 pt-3">
                            <div 
                              onClick={() => setCollapsedFinanceBreakdowns(prev => ({ ...prev, [evt.id]: !prev[evt.id] }))}
                              className="flex items-center justify-between cursor-pointer group select-none mb-3"
                            >
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 group-hover:text-cyan-400 transition-colors">
                                <Ticket className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Desempenho por Área, Lote & Camarote</span>
                                <span className="text-[9px] text-slate-600 font-normal ml-1">
                                  ({collapsedFinanceBreakdowns[evt.id] ? "Clique para expandir" : "Clique para recolher"})
                                </span>
                              </span>
                              <button
                                type="button"
                                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 group-hover:text-cyan-400 transition-colors"
                                title={collapsedFinanceBreakdowns[evt.id] ? "Expandir Lotes" : "Recolher Lotes"}
                              >
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${collapsedFinanceBreakdowns[evt.id] ? '-rotate-90 text-slate-500' : 'rotate-0 text-cyan-400'}`} />
                              </button>
                            </div>

                            {!collapsedFinanceBreakdowns[evt.id] && (
                              <div className="space-y-2">
                                {(() => {
                                  const allItems: any[] = [];
                                  const eventAreas = evt.areas || [
                                    { name: "Pista Geral", type: "PISTA", lots: evt.lots || [] }
                                  ];

                                  eventAreas.forEach((area: any) => {
                                    if (area.type === "PISTA" && area.lots) {
                                      area.lots.forEach((lot: any) => {
                                        allItems.push({
                                          areaName: area.name,
                                          name: lot.name,
                                          type: "PISTA",
                                          price: lot.price,
                                          sold: lot.sold || 0,
                                          total: lot.total || lot.quantity || 0,
                                        });
                                      });
                                    } else if (area.type === "CAMAROTE" && area.models) {
                                      area.models.forEach((m: any) => {
                                        const paintedCount = Object.values(area.cells || {}).filter(id => id === m.id).length;
                                        allItems.push({
                                          areaName: area.name,
                                          name: m.name,
                                          type: "CAMAROTE",
                                          price: m.price,
                                          sold: m.sold || 0,
                                          total: paintedCount || m.quantity || 10,
                                          capacity: m.capacity,
                                        });
                                      });
                                    }
                                  });

                                  if (allItems.length === 0) {
                                    return <p className="text-xs text-slate-600 py-2">Nenhuma área ou lote configurado</p>;
                                  }

                                  return allItems.map((item: any, idx: number) => (
                                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 gap-2">
                                      <div className="flex items-center gap-2.5">
                                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                                          item.type === 'CAMAROTE' 
                                            ? 'bg-purple-900/40 text-purple-300 border border-purple-500/30' 
                                            : 'bg-cyan-900/40 text-cyan-300 border border-cyan-500/30'
                                        }`}>
                                          {item.areaName}
                                        </span>
                                        <span className="text-xs font-bold text-white">{item.name}</span>
                                        {item.capacity && (
                                          <span className="text-[10px] text-purple-400/80 font-medium">({item.capacity} Pessoas/un)</span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-4 shrink-0">
                                        <span className="text-[10px] text-slate-400 font-medium">
                                          {item.sold} / {item.total} vendidos
                                        </span>
                                        <span className="text-xs font-mono font-bold text-cyan-400">
                                          R$ {item.price}
                                        </span>
                                      </div>
                                    </div>
                                  ));
                                })()}
                              </div>
                            )}
                          </div>

                          {/* Coupon breakdown */}
                          {(evt.coupons?.length > 0) && (
                            <div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vendas por Cupom</span>
                              <div className="mt-2 space-y-2">
                                {evt.coupons.map((cpn: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between bg-slate-900/50 px-3 py-2 rounded-lg">
                                    <span className="text-xs font-mono font-bold text-purple-400">{cpn.code}</span>
                                    <div className="flex items-center gap-4">
                                      <span className="text-[10px] text-slate-400">{cpn.usedCount} utilizações</span>
                                      <span className="text-xs font-mono font-bold text-white">R$ {cpn.revenueGenerated}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* === CREATE / EDIT EVENT FORM === */}
              {viewTab === "create-event" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Col */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                      <Plus className="w-6 h-6 text-cyan-400" />
                      Lançamento de Evento
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Preencha os detalhes do seu novo evento. Ele ficará disponível na plataforma imediatamente após a publicação.
                    </p>
                  </div>

                  <form id="create-event-form" onSubmit={handleCreateEvent} className="space-y-8">
                    {/* Section 1 */}
                    <div className="bg-[#0f1423] border border-slate-800 rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl relative">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-t-3xl"></div>
                      <div 
                        onClick={() => setCollapsedFormSections(prev => ({ ...prev, "sec-1": !prev["sec-1"] }))}
                        className="flex items-center justify-between cursor-pointer group select-none"
                      >
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 group-hover:text-cyan-400 transition-colors">
                          <Tag className="w-4 h-4 text-cyan-400" />
                          Identidade & Detalhes
                        </h3>
                        <button type="button" className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 group-hover:text-cyan-400 transition-colors">
                          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${collapsedFormSections["sec-1"] ? '-rotate-90 text-slate-500' : 'rotate-0 text-cyan-400'}`} />
                        </button>
                      </div>
                      
                      {!collapsedFormSections["sec-1"] && (
                        <div className="space-y-4 pt-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-300">Nome Oficial do Evento *</label>
                              <input
                                type="text"
                                required
                                placeholder="ex: NEON ORBIT FESTIVAL 2024"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors placeholder:text-slate-600"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-300">Classificação Etária *</label>
                              <OrbitSelect
                                options={AGE_RATING_OPTIONS}
                                value={newClassificacao}
                                onChange={setNewClassificacao}
                                icon={<ShieldAlert className="w-4 h-4 text-purple-400" />}
                                className="w-full h-11"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300">Descrição do Evento *</label>
                            <textarea
                              required
                              rows={4}
                              placeholder="Conte mais sobre o evento, line-up, informações importantes..."
                              value={newDescription}
                              onChange={(e) => setNewDescription(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors placeholder:text-slate-600 resize-none"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-300">Banner Principal (16:9)</label>
                              <div className="w-full h-28 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:border-cyan-400 hover:text-cyan-400 transition-colors cursor-pointer bg-slate-900/50">
                                <Plus className="w-6 h-6 mb-1" />
                                <span className="text-xs font-bold">Enviar Banner</span>
                              </div>
                            </div>
                            
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-300">Logo do Evento (1:1)</label>
                              <div className="w-full h-28 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:border-cyan-400 hover:text-cyan-400 transition-colors cursor-pointer bg-slate-900/50">
                                <Plus className="w-6 h-6 mb-1" />
                                <span className="text-xs font-bold">Enviar Logo</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Maps Section */}
                    <div className="bg-[#0f1423] border border-slate-800 rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl relative">
                      <div 
                        onClick={() => setCollapsedFormSections(prev => ({ ...prev, "sec-maps": !prev["sec-maps"] }))}
                        className="flex items-center justify-between cursor-pointer group select-none"
                      >
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 group-hover:text-purple-400 transition-colors">
                          <MapPin className="w-4 h-4 text-purple-400" />
                          Mapas e Estrutura Física
                        </h3>
                        <button type="button" className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 group-hover:text-purple-400 transition-colors">
                          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${collapsedFormSections["sec-maps"] ? '-rotate-90 text-slate-500' : 'rotate-0 text-purple-400'}`} />
                        </button>
                      </div>
                      
                      {!collapsedFormSections["sec-maps"] && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300 block mb-1">Mapa Geral (Setores)</label>
                            <div className="w-full h-24 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:border-purple-400 hover:text-purple-400 transition-colors cursor-pointer bg-slate-900/50">
                              <span className="text-xs font-bold">Enviar Mapa Geral</span>
                              <span className="text-[10px] mt-1">PNG, JPG (Para Pistas)</span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300">Mapa de Camarotes</label>
                            <div className="w-full h-24 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:border-purple-400 hover:text-purple-400 transition-colors cursor-pointer bg-slate-900/50">
                              <span className="text-xs font-bold">Enviar Mapa VIP</span>
                              <span className="text-[10px] mt-1">Grid de Referência Visual</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section 2 */}
                    <div className="bg-[#0f1423] border border-slate-800 rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl relative">
                      <div 
                        onClick={() => setCollapsedFormSections(prev => ({ ...prev, "sec-when": !prev["sec-when"] }))}
                        className="flex items-center justify-between cursor-pointer group select-none"
                      >
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 group-hover:text-purple-400 transition-colors">
                          <MapPin className="w-4 h-4 text-purple-400" />
                          Quando e Onde?
                        </h3>
                        <button type="button" className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 group-hover:text-purple-400 transition-colors">
                          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${collapsedFormSections["sec-when"] ? '-rotate-90 text-slate-500' : 'rotate-0 text-purple-400'}`} />
                        </button>
                      </div>
                      
                      {!collapsedFormSections["sec-when"] && (
                        <div className="space-y-4 pt-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-300 block mb-1">Cidade Sede *</label>
                              <OrbitSelect
                                options={CITIES}
                                value={newCity}
                                onChange={setNewCity}
                                icon={<MapPin className="w-4 h-4 text-cyan-400" />}
                                className="w-full h-11"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-300">Data Principal *</label>
                              <input
                                type="date"
                                required
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300">Local (Arena, Casa, Estádio) *</label>
                            <input
                              type="text"
                              required
                              placeholder="ex: Arena Anhembi - Setor Norte"
                              value={newLocation}
                              onChange={(e) => setNewLocation(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors placeholder:text-slate-600"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section 3 */}
                    <div className="bg-gradient-to-br from-[#0b0e26] via-[#101438] to-[#0b0e26] border border-cyan-500/30 rounded-3xl p-6 md:p-8 space-y-5 shadow-[0_0_30px_rgba(0,240,255,0.1)] relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full"></div>
                      <div 
                        onClick={() => setCollapsedFormSections(prev => ({ ...prev, "sec-areas": !prev["sec-areas"] }))}
                        className="flex items-center justify-between cursor-pointer group select-none"
                      >
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 group-hover:text-cyan-400 transition-colors">
                          <Ticket className="w-4 h-4 text-cyan-400" />
                          Áreas & Camarotes
                        </h3>
                        <button type="button" className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 group-hover:text-cyan-400 transition-colors">
                          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${collapsedFormSections["sec-areas"] ? '-rotate-90 text-slate-500' : 'rotate-0 text-cyan-400'}`} />
                        </button>
                      </div>

                      {!collapsedFormSections["sec-areas"] && (
                        <div className="space-y-5 pt-2">
                      
                      {areas.map((area, idx) => (
                        <div key={area.id} className="bg-slate-950/80 p-5 border border-slate-800 rounded-2xl space-y-4 relative group transition-all">
                          <div className={`flex items-center justify-between ${!collapsedAreaCards[area.id] ? 'border-b border-slate-800 pb-3' : ''}`}>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setCollapsedAreaCards(prev => ({ ...prev, [area.id]: !prev[area.id] }))}
                                className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-cyan-400 transition-colors"
                                title={collapsedAreaCards[area.id] ? "Expandir Área" : "Recolher Área"}
                              >
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${collapsedAreaCards[area.id] ? '-rotate-90 text-slate-500' : 'rotate-0 text-cyan-400'}`} />
                              </button>

                              <div className="relative group/edit">
                                <input 
                                  type="text"
                                  value={area.name}
                                  onChange={(e) => {
                                    const newAreas = [...areas];
                                    newAreas[idx].name = e.target.value;
                                    setAreas(newAreas);
                                  }}
                                  className="bg-transparent hover:bg-slate-900 border border-transparent hover:border-slate-700 rounded px-3 py-1.5 text-sm font-bold text-cyan-400 uppercase tracking-widest focus:outline-none focus:border-cyan-400 focus:bg-slate-900 transition-colors pr-8 cursor-text w-[220px]"
                                />
                                <Edit3 className="w-4 h-4 text-cyan-700 absolute right-2 top-2 pointer-events-none opacity-50 group-hover/edit:opacity-100 transition-opacity" />
                              </div>

                              {area.type === 'CAMAROTE' ? (
                                <span className="text-[10px] px-2 py-1 rounded-md border bg-purple-900/20 text-purple-400 border-purple-500/30 font-bold">
                                  CAMAROTE
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-1 rounded-md border bg-cyan-900/20 text-cyan-400 border-cyan-500/30 font-bold">
                                  PISTA / SETOR
                                </span>
                              )}

                              {collapsedAreaCards[area.id] && (
                                <span className="text-[10px] text-slate-500 font-medium italic">
                                  {area.type === 'PISTA' ? `(${area.lots?.length || 0} Lotes)` : `(Mapa Interativo)`}
                                </span>
                              )}
                            </div>

                            <button type="button" onClick={() => setAreas(areas.filter(a => a.id !== area.id))} className="text-[10px] text-red-400 hover:text-red-300 transition-colors font-bold opacity-0 group-hover:opacity-100 uppercase">
                              Remover Área
                            </button>
                          </div>

                          {!collapsedAreaCards[area.id] && (
                            area.type === "PISTA" ? (
                            <div className="space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                                <label className="text-xs font-semibold text-slate-400">Lotes Cadastrados</label>
                                <div className="flex items-center gap-2 bg-cyan-900/20 px-3 py-1.5 rounded-lg border border-cyan-500/20">
                                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                                  <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">Virada Automática Ativa</span>
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
                                O sistema mudará para o próximo lote automaticamente caso a <strong className="text-slate-300">data de validade</strong> expire ou a <strong className="text-slate-300">carga de ingressos</strong> se esgote.
                              </p>
                              <div className="space-y-3">
                                {area.lots?.map((l: any, i: number) => (
                                <div key={i} className="relative group grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      const newAreas = [...areas];
                                      newAreas[idx].lots = newAreas[idx].lots.filter((_: any, lotIndex: number) => lotIndex !== i);
                                      setAreas(newAreas);
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500/20 text-red-400 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white cursor-pointer z-10"
                                    title="Remover Lote"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                  <div>
                                    <span className="block text-[10px] text-slate-500 mb-1">Nome do Lote</span>
                                    <div className="relative">
                                      <input 
                                        type="text" 
                                        value={l.name}
                                        onChange={(e) => {
                                          const newAreas = [...areas];
                                          newAreas[idx].lots[i].name = e.target.value;
                                          setAreas(newAreas);
                                        }}
                                        className="bg-slate-950 hover:bg-slate-900 border border-slate-700 hover:border-slate-600 rounded px-2 py-1.5 text-xs text-white font-bold w-full focus:outline-none focus:border-cyan-400 focus:bg-slate-950 transition-colors pr-6 cursor-text"
                                      />
                                      <Edit3 className="w-3 h-3 text-slate-500 absolute right-2 top-2 pointer-events-none" />
                                    </div>
                                  </div>
                                  <div>
                                    <span className="block text-[10px] text-slate-500 mb-1">Preço</span>
                                    <div className="relative">
                                      <span className="absolute left-2 top-1.5 text-[10px] text-slate-500">R$</span>
                                      <input 
                                        type="number" 
                                        value={l.price}
                                        onChange={(e) => {
                                          const newAreas = [...areas];
                                          newAreas[idx].lots[i].price = e.target.value;
                                          setAreas(newAreas);
                                        }}
                                        className="bg-slate-950 border border-slate-800 rounded pl-6 pr-2 py-1.5 text-xs text-cyan-400 font-mono font-bold w-full focus:outline-none focus:border-cyan-400"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <span className="block text-[10px] text-slate-500 mb-1">Carga</span>
                                    <div className="relative">
                                      <input 
                                        type="number" 
                                        value={l.quantity}
                                        onChange={(e) => {
                                          const newAreas = [...areas];
                                          newAreas[idx].lots[i].quantity = e.target.value;
                                          setAreas(newAreas);
                                        }}
                                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white font-bold w-full focus:outline-none focus:border-cyan-400"
                                      />
                                      <span className="absolute right-2 top-1.5 text-[10px] text-slate-500">un.</span>
                                    </div>
                                  </div>
                                  <div>
                                    <span className="block text-[10px] text-slate-500 mb-1">Válido até</span>
                                    <div className="relative">
                                      <input 
                                        type="text" 
                                        placeholder="DD/MM/AAAA HH:MM"
                                        value={l.endDate || ""}
                                        onChange={(e) => {
                                          let val = e.target.value.replace(/[^0-9]/g, '');
                                          if (val.length > 12) val = val.substring(0, 12);
                                          
                                          // Máscara DD/MM/AAAA HH:MM
                                          let masked = val;
                                          if (val.length > 2) masked = val.substring(0, 2) + '/' + val.substring(2);
                                          if (val.length > 4) masked = masked.substring(0, 5) + '/' + masked.substring(5);
                                          if (val.length > 8) masked = masked.substring(0, 10) + ' ' + masked.substring(10);
                                          if (val.length > 10) masked = masked.substring(0, 13) + ':' + masked.substring(13);

                                          const newAreas = [...areas];
                                          newAreas[idx].lots[i].endDate = masked;
                                          setAreas(newAreas);
                                        }}
                                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white font-mono font-bold w-full focus:outline-none focus:border-cyan-400 placeholder:text-slate-700"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <button 
                                type="button" 
                                onClick={() => {
                                  const newAreas = [...areas];
                                  if (!newAreas[idx].lots) newAreas[idx].lots = [];
                                  const nextNum = newAreas[idx].lots.length + 1;
                                  newAreas[idx].lots.push({ id: `lote-${Date.now()}`, name: `${nextNum}º Lote`, price: "0.00", quantity: "100" });
                                  setAreas(newAreas);
                                }}
                                className="w-full py-2 border border-dashed border-slate-700 text-slate-400 hover:text-cyan-400 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                + Adicionar Lote
                              </button>
                            </div>
                          </div>
                          ) : (
                            <div className="space-y-4 pt-2">
                              <CamaroteGridBuilder 
                                area={area} 
                                onChange={(newArea) => {
                                  const newAreas = [...areas];
                                  newAreas[idx] = newArea;
                                  setAreas(newAreas);
                                }}
                              />
                            </div>
                          )
                        )}
                      </div>
                      ))}

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setAreas([...areas, { id: `area-${Date.now()}`, name: "Novo Setor Pista", type: "PISTA", lots: [] }])}
                            className="flex-1 py-3 border border-dashed border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            + Adicionar Pista/Setor
                          </button>
                          <button
                            type="button"
                            onClick={() => setAreas([...areas, { id: `area-${Date.now()}`, name: "Nova Área VIP", type: "CAMAROTE", grid: {} }])}
                            className="flex-1 py-3 border border-dashed border-purple-500/50 text-purple-400 hover:bg-purple-500/10 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            + Adicionar Área VIP/Camarotes
                          </button>
                        </div>
                      </div>
                      )}
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full py-4 bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white font-bold text-xs rounded-2xl uppercase tracking-wider transition-all cursor-pointer"
                      >
                        {editingEventId ? "Salvar Alterações" : "Publicar Evento"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Preview Col */}
                <div className="lg:col-span-1 hidden lg:block">
                  <div className="sticky top-20 z-30 space-y-4">
                    {/* Primary Action Button Fixed in Viewport */}
                    <button
                      type="button"
                      onClick={() => {
                        const form = document.getElementById("create-event-form") as HTMLFormElement;
                        if (form) form.requestSubmit();
                      }}
                      className="w-full py-4 bg-gradient-to-r from-cyan-400 via-purple-600 to-pink-500 hover:from-cyan-300 hover:to-pink-400 text-white font-black text-xs rounded-2xl uppercase tracking-widest shadow-[0_0_25px_rgba(0,240,255,0.35)] transition-all cursor-pointer transform hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4 text-cyan-200" />
                      <span>{editingEventId ? "Salvar Alterações do Evento" : "Publicar Evento Oficialmente"}</span>
                    </button>

                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                      <span>Preview do Card</span>
                      <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded text-[9px]">Ao Vivo</span>
                    </h3>
                    
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl group">
                      <div className="h-40 bg-gradient-to-br from-slate-800 to-slate-950 relative border-b border-slate-800 flex flex-col items-center justify-center text-slate-700">
                        <Plus className="w-8 h-8 mb-1" />
                        <span className="text-[10px] font-bold uppercase">Banner</span>
                        
                        <div className="absolute top-3 left-3 bg-cyan-400 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                          {newDate ? new Date(newDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : "DATA A DEFINIR"}
                        </div>
                        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md border border-white/10 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          {newCity || "Cidade"}
                        </div>
                      </div>
                      
                      <div className="p-5">
                        <h4 className="text-xl font-black text-white tracking-tight uppercase line-clamp-2 leading-none mb-2">
                          {newTitle || "NOME DO SEU EVENTO"}
                        </h4>
                        
                        <p className="text-xs text-slate-400 mb-4 line-clamp-1">
                          {newLocation || "Local do evento"}
                        </p>
                        
                        <div className="flex items-end justify-between mt-6">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Ingressos a partir de</span>
                            <span className="text-lg font-mono font-bold text-cyan-400">R$ {areas[0]?.lots?.[0]?.price || "0,00"}</span>
                          </div>
                          
                          <div className="bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl">
                            Comprar
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 text-xs text-purple-300 leading-relaxed">
                      <strong className="block mb-1 text-purple-200">Dica de Conversão:</strong> 
                      Um bom nome de evento e um banner atraente em alta resolução aumentam em até <strong>40%</strong> a taxa de conversão na sua página de vendas.
                    </div>
                  </div>
                </div>
              </div>
            )}

            </div>
          </div>
        )}
      </main>

      <AuthModal
        isOpen={authOpen}
        onClose={() => {
          setAuthOpen(false);
          const raw = localStorage.getItem("pass_user");
          if (!raw) {
            window.location.href = "/";
          }
        }}
        initialRole="PRODUTOR"
        onSuccess={(u) => {
          setUser(u);
          fetchProducerEvents(u.email || "all");
        }}
      />

      {/* Custom Orbit Neon Toast Notification */}
      {toast?.show && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm">
          <div className="bg-[#0b1024] border border-cyan-500/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(0,240,255,0.25)] flex items-start gap-3.5 relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-cyan-400 via-emerald-400 to-purple-500"></div>

            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>

            <div className="flex-1 space-y-0.5 pr-2">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                {toast.title}
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-500 hover:text-white transition-colors text-xs font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Custom Dark/Neon Orbit Confirmation Modal */}
      {confirmModal?.isOpen && confirmModal.event && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f1427] border border-slate-700/60 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-cyan-950/40 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-purple-500 to-cyan-400"></div>

            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                confirmModal.type === "DELETE"
                  ? "bg-red-500/10 border border-red-500/30 text-red-400"
                  : confirmModal.type === "INACTIVATE"
                  ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                  : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              }`}>
                {confirmModal.type === "DELETE" ? (
                  <Trash2 className="w-6 h-6" />
                ) : confirmModal.type === "INACTIVATE" ? (
                  <ShieldAlert className="w-6 h-6" />
                ) : (
                  <CalendarDays className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-white tracking-tight">
                  {confirmModal.type === "DELETE" && "Excluir Evento"}
                  {confirmModal.type === "INACTIVATE" && "Inativar Evento"}
                  {confirmModal.type === "REACTIVATE" && "Reativar Evento"}
                </h3>
                <p className="text-xs font-bold text-cyan-400">
                  {confirmModal.event.title}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-2 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              {confirmModal.type === "DELETE" && (
                <p>
                  Tem certeza que deseja excluir este evento? Esta ação removerá o evento e todos os seus lotes do banco de dados <strong className="text-red-400">permanentemente</strong>.
                </p>
              )}
              {confirmModal.type === "INACTIVATE" && (
                <p>
                  Este evento possui ingressos vendidos e <strong>não pode ser excluído permanentemente</strong> por segurança financeira. Ao inativá-lo, novas vendas serão pausadas imediatamente.
                </p>
              )}
              {confirmModal.type === "REACTIVATE" && (
                <p>
                  Deseja reativar a publicação deste evento? Ele voltará a ficar disponível para vendas na plataforma.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeConfirmAction}
                className={`px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-lg ${
                  confirmModal.type === "DELETE"
                    ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-950/40"
                    : confirmModal.type === "INACTIVATE"
                    ? "bg-amber-500 hover:bg-amber-400 text-black font-black"
                    : "bg-emerald-500 hover:bg-emerald-400 text-black font-black"
                }`}
              >
                {confirmModal.type === "DELETE" && "Sim, Excluir Evento"}
                {confirmModal.type === "INACTIVATE" && "Sim, Inativar Evento"}
                {confirmModal.type === "REACTIVATE" && "Sim, Reativar Evento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
