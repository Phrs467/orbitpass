import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default async function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <div className="w-full min-h-screen">
      
      <div className="w-full pt-32 pb-12 border-b border-white/10 relative overflow-hidden bg-white/5 backdrop-blur-3xl">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orbit-blue/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <Link href="/events" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-bold mb-6">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <div className="flex items-center gap-4 mb-4">
             <span className="px-3 py-1 bg-white/10 border border-white/20 text-white text-xs font-bold rounded-full">FESTIVAL</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">Galaxy Fest '24</h1>
          <p className="text-white/70 text-lg font-medium">25 de Junho, 2024 • Allianz Parque, SP</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-12 gap-16">
          
          <div className="lg:col-span-7 space-y-12">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Sobre o evento</h3>
              <p className="text-white/80 leading-relaxed text-lg font-light">
                O maior espetáculo audiovisual do universo. A entrada no evento se dá exclusivamente pelo aplicativo OrbitPass. Não são aceitos prints de tela em hipótese alguma. Seu ingresso digital rotativo garante uma experiência livre de fraudes.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">Regras e Segurança</h3>
              <ul className="space-y-4">
                {['Transferência de ingressos liberada até 24h antes do evento.', 'O QR Code do ingresso é gerado 6h antes da abertura dos portões.', 'Revenda oficial permitida apenas por preço igual ou inferior ao original.'].map((rule, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/90 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-orbit-blue shrink-0 mt-0.5" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-32 glass-card p-8">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
                <h3 className="text-xl font-bold text-white">Ingressos</h3>
                <span className="px-3 py-1 bg-white/10 text-white text-xs font-bold rounded-full">LOTE 2</span>
              </div>
              
              <div className="space-y-4 mb-10">
                
                <label className="flex items-center justify-between p-5 rounded-2xl border-2 border-white/10 hover:border-orbit-blue/50 cursor-pointer transition-colors bg-white/5">
                  <div className="flex items-center gap-4">
                    <input type="radio" name="ticket" className="w-5 h-5 accent-orbit-blue" defaultChecked />
                    <div>
                      <p className="font-bold text-white">Pista Comum</p>
                      <p className="text-sm text-white/70 font-medium mt-0.5">Venda Oficial</p>
                    </div>
                  </div>
                  <span className="font-bold text-white text-lg">R$ 120</span>
                </label>
                
                <label className="flex items-center justify-between p-5 rounded-2xl border-2 border-orbit-purple/30 hover:border-orbit-purple cursor-pointer transition-colors bg-orbit-purple/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-orbit-purple text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-wider">ESCROW</div>
                  <div className="flex items-center gap-4 mt-2">
                    <input type="radio" name="ticket" className="w-5 h-5 accent-orbit-purple" />
                    <div>
                      <p className="font-bold text-white">Pista VIP</p>
                      <p className="text-sm text-orbit-purple font-bold mt-0.5">REVENDA SEGURA</p>
                    </div>
                  </div>
                  <span className="font-bold text-white text-lg">R$ 200</span>
                </label>

              </div>

              <div className="space-y-4 pt-6 border-t border-white/10 mb-8">
                <div className="flex justify-between text-white/70 font-medium">
                  <span>Subtotal</span>
                  <span className="text-white">R$ 120,00</span>
                </div>
                <div className="flex justify-between text-white/70 font-medium">
                  <span>Taxa de Serviço (10%)</span>
                  <span className="text-white">R$ 12,00</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-white pt-4 border-t border-white/10">
                  <span>Total</span>
                  <span>R$ 132,00</span>
                </div>
              </div>

              <Link href="/ticket/123-demo" className="btn-primary w-full py-4 flex items-center justify-center font-bold text-lg">
                Finalizar Compra
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
