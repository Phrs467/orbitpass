import Link from "next/link";
import { Search, Menu, Ticket } from "lucide-react";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[#030712]/80 backdrop-blur-xl border-b border-white/5">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-bold text-white tracking-widest">
            ORBIT<span className="brand-gradient-text">PASS</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          <Link href="/events" className="text-sm font-semibold tracking-wide text-white/60 hover:text-white transition-colors">EXPLORAR</Link>
          <Link href="/dashboard" className="text-sm font-semibold tracking-wide text-white/60 hover:text-white transition-colors">PRODUTORES</Link>
        </nav>

        <div className="flex items-center gap-6">
          <button className="text-white/60 hover:text-white transition-colors hidden sm:block">
            <Search className="w-5 h-5" />
          </button>
          
          <Link href="/ticket/demo" className="hidden md:flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors rounded-lg px-6 py-2.5 text-sm font-semibold">
            Minha Carteira
          </Link>
          
          <button className="md:hidden text-white">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
