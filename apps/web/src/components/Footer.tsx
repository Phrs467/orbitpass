import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white tracking-tight">
              ORBIT<span className="orbit-gradient-text">PASS</span>
            </h3>
            <p className="text-orbit-text-muted text-sm">
              O ingresso que nunca sai de órbita. Plataforma segura contra cambistas e fraudes.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Para Participantes</h4>
            <ul className="space-y-2 text-sm text-orbit-text-muted">
              <li>Explorar Eventos</li>
              <li>Como funciona o Escrow</li>
              <li>Central de Ajuda</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Para Produtores</h4>
            <ul className="space-y-2 text-sm text-orbit-text-muted">
              <li>
                <Link href="/produtor" className="hover:text-cyan-400 transition-colors">
                  Criar Evento
                </Link>
              </li>
              <li>Taxas e Preços</li>
              <li>Integrações</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-orbit-text-muted">
              <li>Termos de Uso</li>
              <li>Privacidade</li>
              <li>LGPD</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/5 text-center text-sm text-orbit-text-muted">
          &copy; {new Date().getFullYear()} OrbitPass. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
