'use client'
import { useEffect, useMemo, useState } from 'react'

type Template = {
  id: string; title: string; doc_type: string; jurisdiction: string; tags: string[]; body_md: string
}

export default function TemplatePicker({
  selectedTemplate, onSelect
}: { selectedTemplate: Template | null, onSelect: (t: Template)=>void }) {

  const [q, setQ] = useState('')
  const [jurisdiction, setJurisdiction] = useState('usa')
  const [results, setResults] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)

  const tagPills = ['nda','founders','corporate','core','risk']

  async function searchTemplates(payload: any) {
    setLoading(true)
    const res = await fetch('/api/templates/search', {
      method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json()
    setResults(json.results ?? [])
    setLoading(false)
  }

  // initial + whenever q/jurisdiction changes (debounced)
  useEffect(() => {
    const h = setTimeout(() => searchTemplates({ q, jurisdiction }), 200)
    return () => clearTimeout(h)
  }, [q, jurisdiction])

  async function toggleFavorite(t: Template, fav: boolean) {
    // requires session; backend returns {ok:true}
    await fetch('/api/templates/favorite', {
      method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ templateId: t.id, fav })
    })
  }

  return (
    <div className="space-y-3">
      <div className="font-semibold">Templates</div>
      <input
        className="w-full border rounded p-2"
        placeholder="Search templates…"
        value={q} onChange={e=>setQ(e.target.value)}
      />
      <select className="w-full border rounded p-2" value={jurisdiction} onChange={e=>setJurisdiction(e.target.value)}>
        <option value="usa">USA</option><option value="ukc">UK</option><option value="eu">EU</option>
        <option value="mena">MENA</option><option value="asia">Asia</option>
      </select>

      <div className="flex flex-wrap gap-2">
        {tagPills.map(tag => (
          <button key={tag} className="text-xs border rounded px-2 py-1"
            onClick={() => setQ(tag)}>{tag}</button>
        ))}
      </div>

      {loading && <div className="text-sm opacity-70">Loading…</div>}
      {!loading && results.length === 0 && <div className="text-sm opacity-70">No templates match your filters.</div>}

      <ul className="space-y-2 max-h-[60vh] overflow-auto">
        {results.map(t => (
          <li key={t.id} className={`border rounded p-2 ${selectedTemplate?.id===t.id ? 'ring-2' : ''}`}>
            <div className="flex items-center justify-between">
              <button className="text-left font-medium" onClick={()=>onSelect(t)}>{t.title}</button>
              <div className="flex items-center gap-2">
                <button title="Favorite" onClick={()=>toggleFavorite(t, true)}>★</button>
              </div>
            </div>
            <div className="text-xs opacity-70">{t.doc_type} · {t.jurisdiction}</div>
            <div className="text-xs opacity-70">{(t.tags||[]).join(', ')}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
