"use client";

import React from "react";
import { Check, Info } from "lucide-react";

interface CheckoutCamaroteGridProps {
  area: any;
  selectedCells: string[];
  onSelectCell: (cellId: string, model: any) => void;
  // This could receive a list of sold cells in the future
  soldCells?: string[];
}

export function CheckoutCamaroteGrid({ area, selectedCells, onSelectCell, soldCells = [] }: CheckoutCamaroteGridProps) {
  const rows = area.gridConfig?.rows || area.rows || 5;
  const cols = area.gridConfig?.cols || area.cols || 10;
  
  const models = area.models || [];
  const cells = area.cells || area.grid || {};

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 mb-2">
        <Info className="w-4 h-4 text-cyan-400" />
        <span className="text-xs text-slate-300">Selecione o camarote desejado no mapa abaixo:</span>
      </div>

      <div className="overflow-x-auto custom-scrollbar pb-4">
        <div className="inline-block p-4 bg-slate-900/40 rounded-xl border border-slate-800">
          {/* Column Headers */}
          <div className="flex mb-1">
            <div className="w-8 h-8 mr-1"></div>
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="w-10 h-6 mx-0.5 flex items-center justify-center text-[10px] font-bold text-slate-500">
                {c + 1}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex flex-col gap-1">
            {Array.from({ length: rows }).map((_, r) => {
              const letter = String.fromCharCode(65 + r);
              return (
                <div key={r} className="flex items-center">
                  {/* Row Header */}
                  <div className="w-8 h-10 mr-1 flex items-center justify-center text-[10px] font-bold text-slate-500">
                    {letter}
                  </div>
                  {/* Cells */}
                  {Array.from({ length: cols }).map((_, c) => {
                    const cellId = `${letter}${c + 1}`;
                    const modelId = cells[cellId];
                    const model = models.find((m: any) => m.id === modelId);
                    
                    const isConfigured = !!model;
                    const isSold = soldCells.includes(cellId);
                    const isSelected = selectedCells.includes(cellId);

                    if (!isConfigured) {
                      return (
                        <div key={c} className="w-10 h-10 mx-0.5 rounded-lg bg-slate-900/50 border border-slate-800/50 flex items-center justify-center opacity-30 cursor-not-allowed">
                          <span className="text-[8px] text-slate-700">{cellId}</span>
                        </div>
                      );
                    }

                    if (isSold) {
                      return (
                        <div key={c} className="w-10 h-10 mx-0.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center cursor-not-allowed relative group overflow-hidden">
                          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center backdrop-blur-[1px]">
                            <span className="text-[9px] font-black text-red-400 rotate-[-15deg] uppercase tracking-tighter">Vendido</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onSelectCell(cellId, model)}
                        className={`w-10 h-10 mx-0.5 rounded-lg flex items-center justify-center transition-all cursor-pointer text-xs font-bold relative group ${
                          isSelected
                            ? "bg-cyan-500 text-white shadow-[0_0_15px_rgba(0,240,255,0.6)] ring-2 ring-cyan-300 scale-110 z-10"
                            : `${model.color.replace('bg-', 'bg-').replace('-500', '-500/30')} border ${model.color.replace('bg-', 'border-').replace('-500', '-500/50')} text-slate-300 hover:brightness-125 hover:scale-105`
                        }`}
                        title={`${model.name} - ${model.capacity} pessoas - R$ ${model.price}`}
                      >
                        {isSelected ? <Check className="w-5 h-5 drop-shadow-md" /> : cellId}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2">
        {models.map((m: any) => (
          <div key={m.id} className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <div className={`w-3 h-3 rounded-sm ${m.color} opacity-70`}></div>
            <span>{m.name} (<span className="font-mono text-cyan-400">R$ {m.price}</span><span className="text-[9px] text-slate-500 font-bold ml-1">+ taxas</span>)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
