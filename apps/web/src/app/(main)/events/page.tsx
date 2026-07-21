import Link from "next/link";
import { Search, MapPin, Calendar, ArrowRight } from "lucide-react";

const mockEvents = [
  { id: 1, name: "Galaxy Fest '24", date: "25 JUN", location: "São Paulo, SP", price: 120, img: "https://images.unsplash.com/photo-1540039155732-d68a29a101b7?q=80&w=800&auto=format&fit=crop" },
  { id: 2, name: "Tech Summit Brasil", date: "10 JUL", location: "Rio de Janeiro, RJ", price: 350, img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop" },
  { id: 3, name: "Nebula Sunset", date: "05 AGO", location: "Belo Horizonte, MG", price: 90, img: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop" },
  { id: 4, name: "Orbit Conference", date: "12 SET", location: "Curitiba, PR", price: 200, img: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=800&auto=format&fit=crop" },
];

export default function EventsPage() {
  return (
    <div className="container mx-auto px-4 py-32 min-h-screen">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div>
          <h1 className="text-5xl font-extrabold text-white mb-3 tracking-tight">Explorar Eventos</h1>
          <p className="text-orbit-text-muted text-lg font-light">Os melhores eventos com segurança garantida contra cambistas.</p>
        </div>

        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-white/40" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar por nome, artista ou local..." 
            className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 shadow-inner focus:outline-none focus:border-orbit-blue/50 focus:bg-white/10 transition-all placeholder:text-white/40"
          />
        </div>
      </div>

      {/* Grid de Eventos - Sem caixas brancas! */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockEvents.map((event) => (
          <Link href={`/events/${event.id}`} key={event.id} className="group flex flex-col">
            <div className="glass-card flex flex-col h-full p-2">
              
              {/* Imagem do Evento */}
              <div 
                className="h-56 w-full rounded-xl relative overflow-hidden bg-cover bg-center mb-4"
                style={{ backgroundImage: `url(${event.img})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-white border border-white/10 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-orbit-blue" /> {event.date}
                </div>
              </div>

              {/* Detalhes */}
              <div className="px-3 pb-3 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orbit-blue transition-colors">
                  {event.name}
                </h3>
                
                <div className="flex items-center gap-1.5 text-orbit-text-muted text-sm mb-6 mt-auto">
                  <MapPin className="w-4 h-4 text-white/40" />
                  <span>{event.location}</span>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                     <span className="text-xs text-white/50 block">A partir de</span>
                     <span className="text-lg font-bold text-white">R$ {event.price}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-orbit-blue group-hover:text-black transition-colors">
                     <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
