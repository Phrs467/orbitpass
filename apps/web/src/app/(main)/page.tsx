import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="w-full relative min-h-screen">
      <section className="relative pt-32 pb-24 flex flex-col lg:flex-row items-center justify-center container mx-auto px-4 gap-12 lg:gap-24">
        
        <div className="text-center lg:text-left flex-1 z-10">
          <div className="mb-8">
            <h1 className="text-6xl sm:text-7xl lg:text-[100px] font-bold text-white tracking-widest leading-none drop-shadow-2xl">
              ORBIT
            </h1>
            <div className="relative inline-block mt-[-10px] lg:mt-[-20px]">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[150%] rounded-full border-[8px] border-transparent border-t-orbit-purple border-r-orbit-blue -rotate-12 z-0 opacity-80"></div>
              <h1 className="text-6xl sm:text-7xl lg:text-[100px] font-extrabold brand-gradient-text tracking-widest relative z-10 leading-none drop-shadow-2xl">
                PASS
              </h1>
            </div>
          </div>
          
          <p className="text-xl text-white/80 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed mb-10 drop-shadow-md">
            A plataforma de ingressos digitais que impede fraudes e cambistas através de QR Codes dinâmicos rotativos.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link href="/events" className="w-full sm:w-auto btn-primary px-8 py-4 flex items-center justify-center gap-2 font-bold text-lg">
              Explorar Eventos <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <div className="relative flex-1 h-[600px] w-full flex items-center justify-center perspective-[1000px] z-10">
          
          <div className="absolute right-0 bottom-1/4 w-80 h-36 ticket-card p-6 flex flex-col justify-between z-20 shadow-2xl rotate-12 hover:rotate-0 transition-transform duration-500">
            <div className="ticket-ring-1 -top-8 -right-8"></div>
            <div className="ticket-ring-2 -bottom-12 -left-12"></div>
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <div className="text-xl font-bold tracking-widest leading-none text-white">ORBIT<br/><span className="text-orbit-blue">PASS</span></div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">GALAXY FEST '24</p>
                <p className="text-[10px] text-gray-400">ingresso digital</p>
                <p className="text-[10px] text-gray-400">25.06.2024 | 12:00</p>
              </div>
            </div>
            <div className="relative z-10 flex items-center gap-2 mt-auto">
              <div className="flex gap-1 h-6 items-end">
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                  <div key={i} className={`bg-white rounded-t-sm w-1 ${i%2==0 ? 'h-full' : 'h-3/4'}`}></div>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute left-0 top-1/4 w-64 h-[450px] bg-black rounded-[40px] border-8 border-gray-900 shadow-2xl overflow-hidden -rotate-6 hover:rotate-0 transition-transform duration-500 z-10">
            <div className="w-full h-full ticket-card rounded-none p-6 flex flex-col items-center">
               <div className="ticket-ring-1 top-20 -left-10"></div>
               <div className="ticket-ring-2 bottom-32 -right-10"></div>
               
               <div className="relative z-10 w-full flex justify-center mb-8 mt-4">
                 <div className="text-2xl font-bold tracking-widest leading-none text-center text-white">ORBIT<br/><span className="text-orbit-blue">PASS</span></div>
               </div>

               <div className="relative z-10 w-44 h-44 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center p-3 mb-8">
                  <div className="w-full h-full bg-white rounded-xl p-2">
                    <div className="w-full h-full bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=orbitpass&color=0A1128&bgcolor=FFFFFF')] bg-contain"></div>
                  </div>
               </div>

               <div className="relative z-10 text-center">
                 <h2 className="text-lg font-bold text-white">GALAXY FEST '24</h2>
                 <p className="text-xs text-gray-400">Ingresso digital</p>
                 <p className="text-xs text-gray-400">25.06.2024 | 12:00</p>
               </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
