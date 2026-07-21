"use client";

import React, { useState } from "react";
import { X, Send, DollarSign, ShieldAlert, CheckCircle2, ArrowRight } from "lucide-react";

interface TicketTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketTitle: string;
  ticketId: string;
}

export function TicketTransferModal({ isOpen, onClose, ticketTitle, ticketId }: TicketTransferModalProps) {
  const [tab, setTab] = useState<"transfer" | "resale">("transfer");
  const [recipient, setRecipient] = useState("");
  const [resalePrice, setResalePrice] = useState("180.00");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "transfer") {
      setSuccessMsg(`Ingresso ${ticketId} transferido com sucesso para ${recipient}!`);
    } else {
      setSuccessMsg(`Ingresso anunciado com sucesso no Mercado Secundário PASS por R$ ${resalePrice}!`);
    }
    setTimeout(() => {
      setSuccessMsg("");
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0b0e26] border border-cyan-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,240,255,0.2)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-white tracking-tight mb-1">Gestão de Ingresso</h3>
        <p className="text-xs text-white/60 mb-6">{ticketTitle} • ID: {ticketId}</p>

        {/* Tab Switcher */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 mb-6">
          <button
            onClick={() => setTab("transfer")}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              tab === "transfer"
                ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Transferir Grátis</span>
          </button>

          <button
            onClick={() => setTab("resale")}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              tab === "resale"
                ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                : "text-white/60 hover:text-white"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Revender no Escrow</span>
          </button>
        </div>

        {successMsg ? (
          <div className="py-8 text-center space-y-3 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-white">Operação Concluída!</h4>
            <p className="text-xs text-white/70">{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleAction} className="space-y-4">
            {tab === "transfer" ? (
              <div className="space-y-3">
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-xs text-cyan-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>A transferência é instantânea e irreversível. O titular receberá a posse e um novo QR Code dinâmico.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/70">E-mail ou CPF do Destinatário</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: amigo@email.com ou 000.000.000-00"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Proteção Contra Cambismo: O preço de revenda tem um teto limite configurado pelo produtor do evento.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/70">Valor da Revenda (R$)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={resalePrice}
                    onChange={(e) => setResalePrice(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-purple-400 font-bold"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-3.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                tab === "transfer"
                  ? "bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                  : "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]"
              }`}
            >
              <span>{tab === "transfer" ? "Confirmar Transferência" : "Anunciar Ingresso"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
