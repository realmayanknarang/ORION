import { useState, useEffect } from 'react'
import ForceGraphKnowledgeGraph from '../components/ForceGraphKnowledgeGraph'
import TopNavBar from '../components/TopNavBar'
import SideNavBar from '../components/SideNavBar'
import {
  type GraphRenderPayload,
  type GraphView,
  type EntityStatus,
  type AssessmentsMap,
  GRAPH_FILTERS,
  filterGraphData,
} from '../types/graph'

const STATUS_OPTIONS: EntityStatus[] = ['ACTIVE', 'CLEARED', 'PERSON_OF_INTEREST', 'PRIORITY_TARGET']

export default function InvestigationPage() {
  const [graphView, setGraphView] = useState<GraphView>('FULL')
  const [fullGraphData, setFullGraphData] = useState<GraphRenderPayload | null>(null)
  const [graphLoading, setGraphLoading] = useState(true)
  const [selectedEntity, setSelectedEntity] = useState<any>(null)
  const [assessments, setAssessments] = useState<AssessmentsMap>({})
  const [detailStatus, setDetailStatus] = useState<EntityStatus>('ACTIVE')
  const [detailReason, setDetailReason] = useState('')

  useEffect(() => {
    fetch('http://localhost:8000/graph/render')
      .then(res => res.json())
      .then(data => {
        setFullGraphData(data)
        setGraphLoading(false)
      })
      .catch(() => setGraphLoading(false))
  }, [])

  const filteredData = fullGraphData ? filterGraphData(fullGraphData, graphView) : { nodes: [], links: [] }

  const handleNodeClick = (node: any) => {
    setSelectedEntity(node)
    const existing = assessments[node.id]
    if (existing) {
      setDetailStatus(existing.status)
      setDetailReason(existing.reason || '')
    } else {
      setDetailStatus('ACTIVE')
      setDetailReason('')
    }
  }

  const handleSaveAssessment = () => {
    if (!selectedEntity) return
    setAssessments(prev => ({
      ...prev,
      [selectedEntity.id]: { status: detailStatus, reason: detailReason },
    }))
  }

  return (
    <div className="bg-[#131314] text-[#e5e2e3] h-screen flex flex-col overflow-hidden">
      <TopNavBar avatarSrc="/assets/avatars/investigator-1.jpg" />
      <div className="flex-1 flex pt-16 overflow-hidden">
        <SideNavBar />
        <main className="flex-1 flex relative">
          <aside className="w-64 bg-[#1c1b1c] border-r border-[#3f4852]/30 p-4 space-y-2 z-10">
            <h3 className="text-xs font-bold text-[#bec7d4] mb-3 tracking-wider">GRAPH FILTERS</h3>
            {Object.entries(GRAPH_FILTERS).map(([key, filter]) => (
              <button
                key={key}
                onClick={() => setGraphView(key as GraphView)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs transition-colors ${
                  graphView === key ? 'bg-[#ffbf00]/20 text-[#ffbf00]' : 'text-[#bec7d4] hover:bg-[#201f20]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{filter.icon}</span>
                <span>{filter.label}</span>
              </button>
            ))}
          </aside>

          <div className="flex-1 relative bg-black">
            {graphLoading ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-[#bec7d4]">
                Loading Knowledge Graph...
              </div>
            ) : (
              <ForceGraphKnowledgeGraph
                graphData={filteredData}
                onNodeClick={handleNodeClick}
                onLinkClick={() => {}}
              />
            )}
          </div>

          {selectedEntity && (
            <aside className="w-80 bg-[#1c1b1c] border-l border-[#3f4852]/30 p-4 flex flex-col justify-between z-10">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-sm text-[#e5e2e3]">{selectedEntity.label}</h3>
                  <button onClick={() => setSelectedEntity(null)} className="text-xs text-[#bec7d4]">✕</button>
                </div>
                <div className="text-xs space-y-2 text-[#bec7d4] mb-6">
                  <div>Type: <span className="text-[#e5e2e3]">{selectedEntity.type}</span></div>
                  <div>Risk Score: <span className="text-[#ffbf00]">{selectedEntity.risk_score}</span></div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-[#bec7d4]">STATUS ASSESSMENT</label>
                  <select
                    value={detailStatus}
                    onChange={(e) => setDetailStatus(e.target.value as EntityStatus)}
                    className="w-full bg-[#201f20] border border-[#3f4852] text-xs p-2 rounded text-[#e5e2e3]"
                  >
                    {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <textarea
                    rows={3}
                    value={detailReason}
                    onChange={(e) => setDetailReason(e.target.value)}
                    placeholder="Rationale for assessment..."
                    className="w-full bg-[#201f20] border border-[#3f4852] text-xs p-2 rounded text-[#e5e2e3]"
                  />
                  <button
                    onClick={handleSaveAssessment}
                    className="w-full py-1.5 bg-[#ffbf00] text-[#3d2d00] font-bold text-xs rounded"
                  >
                    Record Assessment
                  </button>
                </div>
              </div>
            </aside>
          )}
        </main>
      </div>
    </div>
  )
}
