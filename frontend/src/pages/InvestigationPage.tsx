import { useState, useEffect } from 'react'
import ForceGraphKnowledgeGraph from '../components/ForceGraphKnowledgeGraph'
import TopNavBar from '../components/TopNavBar'
import SideNavBar from '../components/SideNavBar'
import {
  type GraphRenderPayload,
  type GraphView,
  GRAPH_FILTERS,
  filterGraphData,
} from '../types/graph'

export default function InvestigationPage() {
  const [graphView, setGraphView] = useState<GraphView>('FULL')
  const [fullGraphData, setFullGraphData] = useState<GraphRenderPayload | null>(null)
  const [graphLoading, setGraphLoading] = useState(true)

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
                onNodeClick={() => {}}
                onLinkClick={() => {}}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
