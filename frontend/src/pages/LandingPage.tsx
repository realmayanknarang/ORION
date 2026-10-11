import { useNavigate } from 'react-router-dom'

// ====================================================================
// TATVA | Investigative Hero Variant (Landing Page)
// ====================================================================

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="bg-[#131314] text-[#e5e2e3] min-h-screen flex flex-col overflow-x-hidden" style={{ fontFamily: 'Geist, sans-serif' }}>
      {/* ── TOP APP BAR ── */}
      <header className="bg-[#131314]/80 backdrop-blur-xl fixed top-0 left-0 w-full z-50 flex justify-between items-center border-b border-[#3f4852]/30 h-16" style={{ padding: '0 32px' }}>
        <div className="flex items-center gap-8">
          <span className="text-headline-md font-bold tracking-tighter cursor-pointer" style={{ color: '#ffbf00', fontFamily: 'Geist' }} onClick={() => navigate('/')}>TATVA</span>
          <nav className="hidden md:flex gap-6">
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/case/new') }} className="font-medium hover:text-[#ffdb9d] transition-colors duration-200" style={{ color: '#bec7d4', fontFamily: 'Geist', fontSize: '16px' }}>Dashboard</a>
          </nav>
        </div>
        <button
          onClick={() => navigate('/case/new')}
          className="btn-mechanical flex items-center gap-2 px-4 py-1.5 hover:bg-[#ffd966] transition-colors"
          style={{ background: '#ffbf00', color: '#3d2d00', fontFamily: 'JetBrains Mono', fontSize: '14px', fontWeight: '500', borderRadius: '2px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          New Case
        </button>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-grow pt-16 relative z-10">
        {/* ── HERO SECTION ── */}
        <section className="relative flex items-center justify-center overflow-hidden border-b border-[#3f4852]/20 bg-black" style={{ minHeight: '600px', padding: '0 32px' }}>
          <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center bg-black/40 p-12 rounded-xl backdrop-blur-sm border border-[#ffbf00]/20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#ffbf00]/30 mb-6 uppercase tracking-wider"
              style={{ background: 'rgba(255,191,0,0.05)', color: '#ffbf00', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffbf00] animate-pulse" />
              System Online
            </div>
            <h1 className="text-[#e5e2e3] mb-4 tracking-tight drop-shadow-md" style={{ fontFamily: 'Geist', fontSize: '40px', fontWeight: '700' }}>
              Tatva
            </h1>
            <p className="max-w-2xl mb-8" style={{ fontFamily: 'Geist', fontSize: '18px', color: '#bec7d4' }}>
              Autonomous digital forensics intelligence engine synthesizing unstructured evidence into explainable graph architectures.
            </p>
            <button
              onClick={() => navigate('/case/new')}
              className="btn-mechanical flex items-center justify-center gap-2"
              style={{ background: '#ffbf00', color: '#3d2d00', fontFamily: 'JetBrains Mono', fontSize: '14px', fontWeight: '500', padding: '16px 32px', borderRadius: '2px' }}
            >
              Enter Investigation Console
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* ── PIPELINE FLOW OVERVIEW ── */}
        <section className="relative z-10 border-b border-[#3f4852]/20" style={{ padding: '64px 32px', background: '#0e0e0f' }}>
          <div className="max-w-7xl mx-auto">
            <h3 style={{ fontFamily: 'Geist', fontSize: '24px', fontWeight: '600', color: '#e5e2e3', textAlign: 'center', marginBottom: '32px' }}>
              End-to-End Forensic Processing Pipeline
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { label: 'Multimodal Ingestion', desc: 'CDR, Chat, GPS, Financials' },
                { label: 'Entity Resolution', desc: 'Cross-Source Identity Deduplication' },
                { label: 'Knowledge Graph', desc: 'Unified 3D Graph Structure' },
                { label: 'Risk Intelligence', desc: 'Rule Validation & Scorer' },
                { label: 'Synthesized XAI', desc: 'Gemini Forensic Dossier' },
              ].map((step, idx) => (
                <div key={idx} className="p-4 border border-[#3f4852]/30 rounded bg-[#1c1b1c] text-center">
                  <div className="font-bold text-[#ffbf00] mb-1" style={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }}>STEP 0{idx + 1}</div>
                  <div className="font-semibold text-sm mb-1">{step.label}</div>
                  <div className="text-xs text-[#bec7d4]">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full flex justify-between items-center bg-[#0e0e0f] border-t border-[#3f4852]/10 p-6">
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '14px', color: '#ffbf00' }}>TATVA</span>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#bec7d4' }}>© 2024 FORENSIC INTELLIGENCE COMMAND</span>
      </footer>
    </div>
  )
}
