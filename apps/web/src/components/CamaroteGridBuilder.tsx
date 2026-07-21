"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, Grid } from "lucide-react";

interface CamaroteModel {
  id: string;
  name: string;
  price: string;
  capacity: string;
  color: string;
}

interface CamaroteGridBuilderProps {
  area: any;
  onChange: (area: any) => void;
}

const COLORS = [
  "bg-purple-500", "bg-cyan-500", "bg-amber-500", 
  "bg-emerald-500", "bg-rose-500", "bg-blue-500"
];

export function CamaroteGridBuilder({ area, onChange }: CamaroteGridBuilderProps) {
  // Parse existing data or initialize
  const initialRows = area.gridConfig?.rows || area.rows || 5; // A to E
  const initialCols = area.gridConfig?.cols || area.cols || 10; // 1 to 10

  const [rows, setRows] = useState(initialRows);
  const [cols, setCols] = useState(initialCols);
  
  const initialModels = area.models || [
    { id: "m1", name: "Premium", price: "5000", capacity: "10", color: "bg-purple-500" }
  ];
  const initialCells = area.cells || area.grid || {}; // e.g. { "A1": "m1", "A2": "m1" }

  const [models, setModels] = useState<CamaroteModel[]>(initialModels);
  const [cells, setCells] = useState<Record<string, string>>(initialCells);
  const [activeModelId, setActiveModelId] = useState<string | null>(initialModels[0]?.id || null);
  const [isPainting, setIsPainting] = useState(false);

  // Sync state when area prop changes (e.g. when editing a saved event)
  useEffect(() => {
    const savedRows = area.gridConfig?.rows || area.rows || 5;
    const savedCols = area.gridConfig?.cols || area.cols || 10;
    setRows(savedRows);
    setCols(savedCols);
    if (area.models) setModels(area.models);
    if (area.cells || area.grid) setCells(area.cells || area.grid);
  }, [area.id]);

  // Sync to parent
  useEffect(() => {
    onChange({
      ...area,
      gridConfig: { rows, cols },
      rows,
      cols,
      models,
      cells,
    });
  }, [rows, cols, models, cells]);

  const addModel = () => {
    const newId = `m-${Date.now()}`;
    const nextColor = COLORS[models.length % COLORS.length];
    setModels([
      ...models,
      { id: newId, name: "Novo Modelo", price: "0", capacity: "10", color: nextColor }
    ]);
    if (!activeModelId) setActiveModelId(newId);
  };

  const updateModel = (id: string, field: keyof CamaroteModel, value: string) => {
    setModels(models.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const removeModel = (id: string) => {
    setModels(models.filter(m => m.id !== id));
    // Remove cells painted with this model
    const newCells = { ...cells };
    Object.keys(newCells).forEach(k => {
      if (newCells[k] === id) delete newCells[k];
    });
    setCells(newCells);
    if (activeModelId === id) setActiveModelId(models[0]?.id || null);
  };

  const handleCellAction = (rowIdx: number, colIdx: number) => {
    if (!activeModelId) return;
    const letter = String.fromCharCode(65 + rowIdx);
    const num = colIdx + 1;
    const cellId = `${letter}${num}`;
    
    setCells(prev => {
      const newCells = { ...prev };
      // Toggle paint/erase
      if (newCells[cellId] === activeModelId) {
        delete newCells[cellId];
      } else {
        newCells[cellId] = activeModelId;
      }
      return newCells;
    });
  };

  const handleMouseEnter = (rowIdx: number, colIdx: number) => {
    if (isPainting) {
      handleCellAction(rowIdx, colIdx);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration & Models */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bounds Configuration */}
        <div className="col-span-1 bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
          <h5 className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Grid className="w-4 h-4 text-cyan-400" />
            Tamanho da Grade
          </h5>
          <div className="flex gap-4">
            <div className="space-y-1.5 flex-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Linhas (Letras)</label>
              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                <button type="button" onClick={() => setRows(Math.max(1, rows - 1))} className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 font-bold">-</button>
                <div className="flex-1 text-center text-sm font-bold text-white">{rows}</div>
                <button type="button" onClick={() => setRows(rows + 1)} className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 font-bold">+</button>
              </div>
              <span className="text-[9px] text-slate-500">Irá até {String.fromCharCode(65 + rows - 1)}</span>
            </div>
            <div className="space-y-1.5 flex-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Colunas (Núms)</label>
              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                <button type="button" onClick={() => setCols(Math.max(1, cols - 1))} className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 font-bold">-</button>
                <div className="flex-1 text-center text-sm font-bold text-white">{cols}</div>
                <button type="button" onClick={() => setCols(cols + 1)} className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 font-bold">+</button>
              </div>
              <span className="text-[9px] text-slate-500">Irá até {cols}</span>
            </div>
          </div>
        </div>

        {/* Models Definition */}
        <div className="col-span-1 lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-slate-300">Modelos de Camarotes (Pincéis)</h5>
            <button type="button" onClick={addModel} className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider flex items-center gap-1">
              <Plus className="w-3 h-3" /> Adicionar Modelo
            </button>
          </div>

          <div className="space-y-3">
            {models.map(m => (
              <div 
                key={m.id} 
                className={`flex flex-col sm:flex-row gap-3 p-3 rounded-xl border transition-all ${activeModelId === m.id ? 'border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_15px_rgba(0,240,255,0.1)]' : 'border-slate-800 bg-slate-900'}`}
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div 
                    onClick={() => setActiveModelId(m.id)}
                    className={`w-6 h-6 rounded-full cursor-pointer ${m.color} flex-shrink-0 ${activeModelId === m.id ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-100'}`}
                    title="Usar este modelo para pintar a grade"
                  ></div>
                  <input 
                    type="text" 
                    value={m.name} 
                    onChange={e => updateModel(m.id, "name", e.target.value)}
                    placeholder="Nome"
                    className="bg-transparent text-sm font-bold text-white focus:outline-none focus:border-b focus:border-cyan-400 w-full sm:w-32"
                  />
                </div>
                
                <div className="flex gap-3 flex-1">
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-2 text-[10px] text-slate-500 font-bold">R$</span>
                    <input 
                      type="number" 
                      value={m.price} 
                      onChange={e => updateModel(m.id, "price", e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pl-6 pr-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div className="relative flex-1">
                    <input 
                      type="number" 
                      value={m.capacity} 
                      onChange={e => updateModel(m.id, "capacity", e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-500 font-bold">Pessoas</span>
                  </div>
                  {models.length > 1 && (
                    <button type="button" onClick={() => removeModel(m.id)} className="text-slate-600 hover:text-red-400 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Grid Canvas */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-xs font-bold text-slate-300">Mapa Visual</h5>
          <span className="text-[10px] text-slate-500">Selecione um modelo acima e clique nas células (ou arraste) para criar as unidades.</span>
        </div>
        
        <div 
          className="inline-block select-none"
          onMouseDown={() => setIsPainting(true)}
          onMouseUp={() => setIsPainting(false)}
          onMouseLeave={() => setIsPainting(false)}
        >
          {/* Header Row (Numbers) */}
          <div className="flex">
            <div className="w-8 h-8 m-0.5"></div> {/* Empty top-left */}
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="w-10 h-8 m-0.5 flex items-center justify-center text-[10px] font-bold text-slate-500">
                {c + 1}
              </div>
            ))}
          </div>

          {/* Grid Rows */}
          {Array.from({ length: rows }).map((_, r) => {
            const letter = String.fromCharCode(65 + r);
            return (
              <div key={r} className="flex">
                <div className="w-8 h-10 m-0.5 flex items-center justify-center text-[10px] font-bold text-slate-500">
                  {letter}
                </div>
                {Array.from({ length: cols }).map((_, c) => {
                  const cellId = `${letter}${c + 1}`;
                  const modelId = cells[cellId];
                  const model = models.find(m => m.id === modelId);
                  const colorClass = model ? model.color : "bg-slate-800/50 hover:bg-slate-700/50";
                  
                  return (
                    <div 
                      key={c}
                      onMouseDown={() => handleCellAction(r, c)}
                      onMouseEnter={() => handleMouseEnter(r, c)}
                      className={`w-10 h-10 m-0.5 rounded cursor-pointer transition-colors flex items-center justify-center text-[9px] font-bold ${colorClass} ${model ? 'text-white shadow-[0_0_10px_rgba(0,0,0,0.5)]' : 'text-slate-600 border border-dashed border-slate-700'}`}
                      title={`${cellId} ${model ? `- ${model.name}` : ''}`}
                    >
                      {cellId}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        
        {/* Summary */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
          {models.map(m => {
            const count = Object.values(cells).filter(id => id === m.id).length;
            if (count === 0) return null;
            return (
              <div key={m.id} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${m.color}`}></div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">{m.name}:</span>
                <span className="text-xs text-white font-black">{count} un.</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
