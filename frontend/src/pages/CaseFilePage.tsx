import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CognitiveConfig } from '../types/case'

export default function CaseFilePage() {
  const navigate = useNavigate()
  const [caseTitle, setCaseTitle] = useState('')
  const [investigator, setInvestigator] = useState('Officer J. Miller')
  const [description, setDescription] = useState('')
  const [cognitiveConfig, setCognitiveConfig] = useState<CognitiveConfig>({
    anomaly: true,
    gnn: true,
    intel: false,
    temporal: true,
  })

  return (
    <div className="bg-[#131314] text-[#e5e2e3] min-h-screen flex flex-col p-8" style={{ fontFamily: 'Geist, sans-serif' }}>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#ffbf00]">Initialize Case Investigation</h1>
        <p className="text-sm text-[#bec7d4]">Configure case details and cognitive synthesis engine settings.</p>
      </header>

      <main className="max-w-4xl space-y-6">
        <section className="bg-[#1c1b1c] p-6 rounded border border-[#3f4852]/30 space-y-4">
          <h2 className="text-lg font-semibold text-[#e5e2e3]">Case Details</h2>
          <div>
            <label className="block text-xs text-[#bec7d4] mb-1">CASE TITLE</label>
            <input
              type="text"
              value={caseTitle}
              onChange={(e) => setCaseTitle(e.target.value)}
              placeholder="e.g. OPERATION MIDNIGHT SHADOW"
              className="w-full bg-[#201f20] border border-[#3f4852] p-2 rounded text-sm text-[#e5e2e3]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#bec7d4] mb-1">PRIMARY INVESTIGATOR</label>
            <input
              type="text"
              value={investigator}
              onChange={(e) => setInvestigator(e.target.value)}
              className="w-full bg-[#201f20] border border-[#3f4852] p-2 rounded text-sm text-[#e5e2e3]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#bec7d4] mb-1">CASE SUMMARY</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of allegations and intelligence..."
              className="w-full bg-[#201f20] border border-[#3f4852] p-2 rounded text-sm text-[#e5e2e3]"
            />
          </div>
        </section>

        <section className="bg-[#1c1b1c] p-6 rounded border border-[#3f4852]/30 space-y-4">
          <h2 className="text-lg font-semibold text-[#e5e2e3]">Cognitive Configuration</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(cognitiveConfig).map(([key, val]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={val}
                  onChange={() => setCognitiveConfig(prev => ({ ...prev, [key]: !prev[key as keyof CognitiveConfig] }))}
                  className="rounded bg-[#201f20] border-[#3f4852] text-[#ffbf00]"
                />
                <span className="text-sm uppercase">{key}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="flex justify-end gap-4">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm text-[#bec7d4] border border-[#3f4852] rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => navigate('/investigation')}
            className="px-6 py-2 text-sm font-semibold bg-[#ffbf00] text-[#3d2d00] rounded"
          >
            Initialize Investigation
          </button>
        </div>
      </main>
    </div>
  )
}
