"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ticket, User, PlusCircle, LogOut, ChevronDown, Settings, HelpCircle, BarChart3 } from "lucide-react";
import { PassLogo } from "./PassLogo";
import { AuthModal } from "./AuthModal";

interface NavbarProps {
  selectedCity?: string;
  onCityChange?: (city: string) => void;
}

export function Navbar({ selectedCity = "São Paulo", onCityChange }: NavbarProps) {
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [user, setUser] = useState<{ name: string; email: string; role?: string; cpf?: string; cnpj?: string } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("pass_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleNavClick = (e: React.MouseEvent, targetRole: "CLIENTE" | "PRODUTOR", path: string) => {
    if (!user) {
      if (targetRole === "PRODUTOR") {
        return;
      }
      e.preventDefault();
      setAuthMode("login");
      setAuthOpen(true);
      return;
    }

    if (targetRole === "PRODUTOR" && user.role === "CLIENTE") {
      return;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("pass_user");
    setUser(null);
    setProfileOpen(false);
    window.location.href = "/";
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#090c15]/90 backdrop-blur-md border-b border-slate-800 transition-all duration-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo Brand */}
          <Link href="/" className="flex items-center gap-3">
            <PassLogo size="sm" showSubtitle={false} />
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link
              href="/"
              className="text-xs font-bold text-slate-300 hover:text-white transition-colors"
            >
              Eventos
            </Link>

            {(!user || user.role === "CLIENTE" || !user.role) && (
              <Link
                href="/meus-ingressos"
                onClick={(e) => handleNavClick(e, "CLIENTE", "/meus-ingressos")}
                className="text-xs font-bold text-slate-300 hover:text-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Ticket className="w-4 h-4 text-cyan-400" />
                Meus Ingressos
              </Link>
            )}

            {(!user || user.role === "PRODUTOR" || user.role === "ADMIN") && (
              <Link
                href="/produtor"
                onClick={(e) => handleNavClick(e, "PRODUTOR", "/produtor")}
                className="text-xs font-bold text-slate-300 hover:text-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-cyan-400" />
                Área do Produtor
              </Link>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-full py-1 px-3 transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 text-white flex items-center justify-center font-extrabold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-semibold text-white leading-none">{user.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {user.role === 'PRODUTOR' ? 'Produtor' : 'Comprador'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown */}
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full z-50 mt-2 w-56 bg-[#111633] border border-slate-700 rounded-xl shadow-2xl shadow-black/50 py-1">
                      {/* User Header */}
                      <div className="px-4 py-3 border-b border-slate-700">
                        <p className="text-sm font-bold text-white">{user.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{user.email}</p>
                      </div>

                      {/* Menu Items */}
                      {user.role === "CLIENTE" || !user.role ? (
                        <>
                          <Link
                            href="/meus-ingressos"
                            onClick={() => setProfileOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                          >
                            <Ticket className="w-4 h-4 text-slate-500" />
                            <span>Meus Ingressos</span>
                          </Link>
                          <Link
                            href="/produtor"
                            onClick={() => setProfileOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                          >
                            <PlusCircle className="w-4 h-4 text-slate-500" />
                            <span>Ser Produtor</span>
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/produtor"
                            onClick={() => setProfileOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                          >
                            <BarChart3 className="w-4 h-4 text-slate-500" />
                            <span>Painel do Produtor</span>
                          </Link>
                        </>
                      )}

                      <button
                        onClick={() => setProfileOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        <span>Configurações</span>
                      </button>
                      <button
                        onClick={() => setProfileOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
                      >
                        <HelpCircle className="w-4 h-4 text-slate-500" />
                        <span>Ajuda</span>
                      </button>

                      <div className="border-t border-slate-700 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sair</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode("login");
                  setAuthOpen(true);
                }}
                className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Entrar / Cadastrar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onSuccess={(u) => setUser(u)}
      />
    </>
  );
}
