export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute top-1/4 left-0 w-64 h-64 border border-orbit-purple/20 rounded-full blur-[1px] -translate-x-1/2"></div>
      <div className="absolute bottom-1/4 right-0 w-96 h-96 border border-orbit-blue/20 rounded-full blur-[1px] translate-x-1/3"></div>

      <div className="z-10 w-full max-w-sm flex flex-col items-center space-y-8">
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-1">
            ORBIT<span className="orbit-gradient-text">PASS</span>
          </h1>
          <p className="text-orbit-text-muted text-sm font-medium">O ingresso digital</p>
        </div>

        <div className="glass-card w-full rounded-3xl p-6 flex flex-col items-center relative overflow-hidden shadow-2xl shadow-orbit-purple/10">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-orbit-blue/20 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orbit-purple/20 rounded-full blur-2xl"></div>

          <div className="z-10 flex flex-col items-center w-full">
            <h2 className="text-2xl font-bold text-white mb-1">GALAXY FEST '24</h2>
            <p className="text-orbit-text-muted text-xs mb-2">Ingresso #{id}</p>
            <p className="text-orbit-text-muted text-xs mb-6">25.06.2024 | 12:00</p>

            <div className="bg-white p-4 rounded-2xl w-48 h-48 flex items-center justify-center relative shadow-[0_0_15px_rgba(0,229,255,0.3)] border border-orbit-blue/50 mb-6 group">
              <div className="w-full h-full bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=orbitpass_mockup&color=060B19&bgcolor=FFFFFF')] bg-cover opacity-90 transition-all duration-300 group-hover:scale-105"></div>
              <div className="absolute top-0 left-0 w-full h-[2px] bg-orbit-blue shadow-[0_0_8px_rgba(0,229,255,0.8)] animate-pulse"></div>
            </div>

            <div className="w-full space-y-4">
              <button className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-orbit-blue to-orbit-purple hover:opacity-90 transition-opacity shadow-lg shadow-orbit-blue/20 flex items-center justify-center gap-2">
                Transferir Ingresso
              </button>
              <button className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-orbit-dark-light border border-white/10 hover:bg-white/5 transition-colors">
                Revender (Escrow)
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-orbit-text-muted text-center max-w-[250px]">
          Seu QR Code é dinâmico e renovado a cada 30 segundos. <span className="text-orbit-blue">Não tire print.</span>
        </p>
      </div>
    </main>
  );
}
