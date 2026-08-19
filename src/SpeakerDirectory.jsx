import { useMemo, useState } from 'react'

function collectSpeakers(events) {
  const map = new Map()
  for (const e of events) {
    const roles = [
      ...(e.speakers || []).map((n) => [n, 'Speaker']),
      e.chairman ? [e.chairman, 'Chairman'] : null,
      e.co_chairman ? [e.co_chairman, 'Co-Chairman'] : null,
      e.moderator ? [e.moderator, 'Moderator'] : null,
      e.course_director ? [e.course_director, 'Course Director'] : null,
    ].filter(Boolean)

    for (const [name, role] of roles) {
      if (!name) continue
      if (!map.has(name)) map.set(name, [])
      map.get(name).push({ event: e, role })
    }
  }
  return map
}

export default function SpeakerDirectory({ events }) {
  const [query, setQuery] = useState('')
  const speakerMap = useMemo(() => collectSpeakers(events), [events])

  const names = useMemo(() => {
    const all = [...speakerMap.keys()].sort((a, b) => a.localeCompare(b))
    if (!query.trim()) return all
    const q = query.toLowerCase()
    return all.filter((n) => n.toLowerCase().includes(q))
  }, [speakerMap, query])

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search speaker name..."
        className="w-full sm:w-80 border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4"
      />
      <div className="text-sm text-slate-500 mb-3">{names.length} speaker{names.length === 1 ? '' : 's'}</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {names.map((name) => {
          const entries = speakerMap.get(name)
          return (
            <div key={name} className="border border-slate-200 rounded-xl bg-white p-4">
              <div className="font-semibold text-slate-900">{name}</div>
              <div className="text-xs text-slate-400 mb-2">{entries.length} session{entries.length === 1 ? '' : 's'}</div>
              <ul className="space-y-1.5">
                {entries.map(({ event, role }, i) => (
                  <li key={i} className="text-sm text-slate-700 leading-snug">
                    <span className="text-slate-400">{event.date_label?.split(',')[0]} {event.start_time}</span>
                    {' · '}
                    <span className="text-slate-500 text-xs uppercase tracking-wide">{role}</span>
                    <div className="text-slate-800">{event.title}</div>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
