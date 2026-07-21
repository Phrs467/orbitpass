"use client";

import React, { useState, useEffect } from "react";
import { Search, MapPin, Calendar, Ticket, Tag, ChevronRight, Shield, AlertCircle, Loader2 } from "lucide-react";
import { PassLogo } from "@/components/PassLogo";
import { OrbitSelect } from "@/components/OrbitSelect";
import { Navbar } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { useRouter } from "next/navigation";

interface EventoDB {
  id: string;
  titulo: string;
  descricao?: string;
  cidade: string;
  estado: string;
  local: string;
  categoria: string;
  dataInicio: string;
  dataFim?: string;
  bannerUrl?: string;
  status: string;
  classificacao: number;
  produtorId: string;
  menorPreco?: string | number | null;
  loteAtivo?: string | null;
}

export default function HomePage() {
  const [selectedCity, setSelectedCity] = useState("Todas as Cidades");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const [ageBlockModal, setAgeBlockModal] = useState<{ show: boolean; eventTitle: string; minAge: number } | null>(null);
  const [events, setEvents] = useState<EventoDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<string[]>(["Todas as Cidades"]);
  const [user, setUser] = useState<any | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("pass_user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Busca eventos reais do Neon DB via API
  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events");
        const data = await res.json();
        const evts: EventoDB[] = data.events || [];
        setEvents(evts);

        // Extrai cidades únicas dos eventos reais
        const uniqueCities = Array.from(new Set(evts.map((e) => e.cidade))).sort();
        setCities(["Todas as Cidades", ...uniqueCities]);
      } catch (err) {
        console.error("Erro ao buscar eventos:", err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

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

  const getClassificacaoStyle = (c: number) => {
    if (c >= 18) return { bg: "bg-red-600", text: "18+", border: "border-red-500/40" };
    if (c >= 16) return { bg: "bg-orange-500", text: "16+", border: "border-orange-400/40" };
    if (c >= 14) return { bg: "bg-yellow-500 text-black", text: "14+", border: "border-yellow-400/40" };
    return { bg: "bg-emerald-600", text: "Livre", border: "border-emerald-500/40" };
  };

  const formatDate = (isoDate: string): string => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return isoDate;
    }
  };

  const formatTime = (isoDate: string): string => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const formatPrice = (price: string | number | null | undefined): string => {
    if (!price) return "Sob consulta";
    const num = typeof price === "string" ? parseFloat(price) : price;
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleBuyTicket = (evt: EventoDB) => {
    if (evt.classificacao > 0 && user?.dataNascimento) {
      const idade = calcularIdade(user.dataNascimento);
      if (idade < evt.classificacao) {
        setAgeBlockModal({ show: true, eventTitle: evt.titulo, minAge: evt.classificacao });
        return;
      }
    }
    router.push(`/evento/${evt.id}`);
  };

  const filteredEvents = events.filter((event) => {
    const city = event.cidade || (event as any).city || "";
    const title = event.titulo || (event as any).title || "";
    const loc = event.local || (event as any).location || "";
    const cat = event.categoria || "";
    const query = (searchQuery || "").toLowerCase();

    const matchesCity = selectedCity === "Todas as Cidades" || city.toLowerCase() === selectedCity.toLowerCase();
    const matchesSearch =
      title.toLowerCase().includes(query) ||
      loc.toLowerCase().includes(query) ||
      cat.toLowerCase().includes(query);
    return matchesCity && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#060814] text-white flex flex-col font-sans selection:bg-cyan-400 selection:text-black">
      <Navbar selectedCity={selectedCity} onCityChange={setSelectedCity} />

      {/* HERO SECTION: O logo completo com tagline aparece AQUI uma única vez */}
      <section className="relative pt-36 pb-16 px-4 flex flex-col items-center text-center border-b border-white/10 z-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-r from-cyan-500/15 via-purple-600/20 to-pink-500/15 rounded-full blur-[140px] pointer-events-none z-0 overflow-hidden" />

        <div className="container mx-auto max-w-4xl relative z-10 space-y-6">
          {/* Logo Completo Oficial (Marca + Tagline) - ÚNICA APARIÇÃO COMPLETA */}
          <div className="py-2 flex justify-center">
            <PassLogo size="xl" showSubtitle={true} />
          </div>

          <p className="max-w-2xl mx-auto text-base md:text-lg text-white/80 font-normal leading-relaxed">
            Bilhetes digitais autênticos verificados por <span className="text-cyan-300 font-semibold">CPF e QR Code dinâmico</span> em tempo real.
          </p>

          {/* ESTRUTURA DE BUSCA */}
          <div className="max-w-3xl mx-auto mt-6 bg-[#0b0e26]/90 border border-slate-800 p-2.5 rounded-2xl backdrop-blur-md flex flex-col md:flex-row items-center gap-2.5 relative z-30">
            <div className="w-full md:w-auto">
              <OrbitSelect
                options={cities}
                value={selectedCity}
                onChange={setSelectedCity}
                icon={<MapPin className="w-4 h-4 text-cyan-400" />}
                className="w-full md:w-52"
              />
            </div>

            <div className="hidden md:block w-px h-7 bg-white/10" />

            <div className="flex items-center gap-2 flex-1 w-full px-3.5 py-2 bg-white/5 md:bg-transparent rounded-xl border border-white/5 md:border-none">
              <Search className="w-4 h-4 text-white/40 shrink-0" />
              <input
                type="text"
                placeholder="Pesquisar por nome do evento, artista ou festival..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder-white/40 focus:outline-none"
              />
            </div>

            <button className="w-full md:w-auto px-7 py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs rounded-xl uppercase tracking-wider transition-colors cursor-pointer">
              Buscar Eventos
            </button>
          </div>
        </div>
      </section>

      {/* GRID DE EVENTOS DISPONÍVEIS */}
      <section className="py-12 px-4 container mx-auto flex-1 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Eventos Disponíveis</span>
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-white/5 text-cyan-300 border border-white/10">
                {selectedCity}
              </span>
            </h2>
            <p className="text-xs text-white/50 mt-1">
              {loading ? "Carregando eventos..." : `Exibindo ${filteredEvents.length} evento${filteredEvents.length !== 1 ? "s" : ""} com ingressos autênticos`}
            </p>
          </div>

          {/* Filtros de cidade dinâmicos */}
          {cities.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {cities.slice(0, 6).map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCity === city
                      ? "bg-cyan-400 text-black font-extrabold"
                      : "bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Estado de Loading */}
        {loading ? (
          <div className="text-center py-24">
            <Loader2 className="w-8 h-8 text-cyan-400 mx-auto mb-4 animate-spin" />
            <p className="text-sm text-white/50">Buscando eventos no servidor...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          /* Estado vazio — Nenhum evento real cadastrado */
          <div className="text-center py-20 bg-white/[0.03] rounded-2xl border border-white/10">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-5">
              <Ticket className="w-10 h-10 text-white/15" />
            </div>
            <h3 className="text-lg font-bold text-white">Nenhum evento publicado ainda</h3>
            <p className="text-sm text-white/50 mt-2 max-w-md mx-auto">
              {events.length === 0
                ? "Os eventos aparecerão aqui assim que produtores cadastrados publicarem seus eventos na plataforma."
                : "Nenhum evento corresponde à sua busca. Tente alterar a cidade ou o termo."}
            </p>
            {events.length > 0 && (
              <button
                onClick={() => {
                  setSelectedCity("Todas as Cidades");
                  setSearchQuery("");
                }}
                className="mt-5 px-6 py-2.5 bg-white/10 text-cyan-300 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/20 cursor-pointer transition-colors"
              >
                Ver todos os eventos
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-[#0b0e26] border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/40 transition-all duration-200 flex flex-col group"
              >
                {/* Imagem do Card */}
                <div className="relative h-48 overflow-hidden rounded-t-2xl">
                  {evt.bannerUrl ? (
                    <img
                      src={evt.bannerUrl}
                      alt={evt.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                      <Ticket className="w-12 h-12 text-white/10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e26] via-transparent to-transparent opacity-80" />

                  {/* Badge de Lote + Classificação */}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                    {evt.loteAtivo && (
                      <span className="px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                        {evt.loteAtivo}
                      </span>
                    )}
                    {(() => {
                      const cls = getClassificacaoStyle(evt.classificacao);
                      return (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white ${cls.bg} border ${cls.border} flex items-center gap-1`}>
                          <Shield className="w-3 h-3" />
                          {cls.text}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Conteúdo do Card */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {evt.titulo}
                    </h3>

                    <div className="mt-3 space-y-1.5 text-xs text-white/60">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="text-white/80 font-medium">{evt.categoria}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatDate(evt.dataInicio)} às {formatTime(evt.dataInicio)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{evt.local} • {evt.cidade}</span>
                      </div>
                    </div>
                  </div>

                  {/* Preço e Botão */}
                  <div className="pt-3.5 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-white/40 block">A partir de</span>
                      <span className="text-base font-extrabold text-white">
                        {evt.menorPreco ? `R$ ${formatPrice(evt.menorPreco)}` : "—"}
                      </span>
                    </div>

                    <button
                      onClick={() => handleBuyTicket(evt)}
                      className="flex items-center gap-1 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      <span>Garantir Bilhete</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal de Bloqueio por Idade */}
      {ageBlockModal?.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#0b0e26] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4 text-center">
            <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Classificação Indicativa</h3>
            <p className="text-sm text-white/60">
              O evento <strong className="text-white">{ageBlockModal.eventTitle}</strong> possui
              classificação indicativa de <strong className="text-red-400">{ageBlockModal.minAge}+</strong> anos.
            </p>
            <p className="text-xs text-white/40">
              De acordo com sua data de nascimento cadastrada, você não atende à idade mínima exigida para este evento.
            </p>
            <button
              onClick={() => setAgeBlockModal(null)}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Entendi
            </button>
          </div>
        </div>
      )}


      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialRole="CLIENTE"
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          setAuthModalOpen(false);
        }}
      />
    </div>
  );
}
