import { useEffect, useMemo, useState } from 'react'

const PIC_KEY = 'ihks2026_my_pic_v1'
const SUB_VIEWS = ['By Doctor', 'My Schedule', 'Assisting']

function initials(name) {
  const words = (name || '').replace(/^(dr\.|Dr\.|Prof\.|DR\.)\s*/gi, '').trim().split(/\s+/)
  return ((words[0]?.[0] || '') + (words[1]?.[0] || '')).toUpperCase()
}

// Matches the palette from the reference checklist mockup: Thu = purple, Fri = blue, Sat = orange.
const DAY_STYLE = {
  '2026-08-20': { label: 'Thu', style: { background: '#8a5cf5', color: '#fff' } },
  '2026-08-21': { label: 'Fri', style: { background: '#2f9de0', color: '#fff' } },
  '2026-08-22': { label: 'Sat', style: { background: '#e0862f', color: '#fff' } },
}

function dayBadge(day) {
  return DAY_STYLE[day] || { label: day ? day.slice(5) : '?', style: { background: '#94a3b8', color: '#fff' } }
}

function ContactRow({ phone, email }) {
  if (!phone && !email) return null
  return (
    <div className="flex flex-wrap gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
      {phone ? (
        <>
          <a href={`tel:${phone.replace(/\s+/g, '')}`} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-emerald-700 hover:bg-slate-200">
            📞 {phone}
          </a>
          <a href={`https://wa.me/${phone.replace(/[^\d]/g, '')}`} target="_blank" rel="noreferrer"
             className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-emerald-700 hover:bg-slate-200">
            💬 WhatsApp
          </a>
        </>
      ) : (
        <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 text-slate-400">📞 no number on file</span>
      )}
      {email && (
        <a href={`mailto:${email}`} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-brand-700 hover:bg-slate-200">
          ✉ {email}
        </a>
      )}
    </div>
  )
}

function SessionRow({ event, role, note, onToggleDone }) {
  const done = Boolean(event.done)
  return (
    <div className={`flex gap-3 p-3 rounded-lg ${done ? 'bg-emerald-50' : 'bg-slate-50'}`}>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleDone() }}
        className={`w-6 h-6 rounded-md border flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
          done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent hover:border-brand-400'
        }`}
      >✓</button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded" style={dayBadge(event.day).style}>
            {dayBadge(event.day).label}
          </span>
          <span className="text-sm font-bold text-slate-800">{event.start_time}&ndash;{event.end_time}</span>
          <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">{role}</span>
        </div>
        <div className={`text-sm ${done ? 'text-slate-500 line-through decoration-emerald-400' : 'text-slate-800'}`}>{event.title}</div>
        <div className="text-xs text-slate-400 mt-0.5">
          {event.track}{event.room ? ` · ${event.room}` : ''}
          {note && <> &nbsp;·&nbsp; 🤝 {note}</>}
        </div>
      </div>
    </div>
  )
}

export default function PicView({ events, onUpdateEvent, picOptions }) {
  const [myPic, setMyPic] = useState(() => localStorage.getItem(PIC_KEY) || '')
  const [subView, setSubView] = useState('By Doctor')
  const [dayFilter, setDayFilter] = useState('all')
  const [openDoc, setOpenDoc] = useState(null)

  useEffect(() => {
    if (myPic) localStorage.setItem(PIC_KEY, myPic)
  }, [myPic])

  const days = useMemo(() => {
    const seen = new Map()
    for (const e of events) seen.set(e.day, e.date_label)
    return [...seen.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [events])

  // Every (event, assignment) pair where this PIC is either the primary PIC
  // or the assist, scoped to the selected day.
  const myItems = useMemo(() => {
    if (!myPic) return { primary: [], assisting: [] }
    const primary = []
    const assisting = []
    for (const e of events) {
      if (dayFilter !== 'all' && e.day !== dayFilter) continue
      for (const a of e.assignments || []) {
        if (a.pic === myPic) primary.push({ event: e, assignment: a })
        else if (a.assist === myPic) assisting.push({ event: e, assignment: a })
      }
    }
    const byTime = (x, y) => x.event.day.localeCompare(y.event.day) || x.event.start_time.localeCompare(y.event.start_time)
    primary.sort(byTime)
    assisting.sort(byTime)
    return { primary, assisting }
  }, [events, myPic, dayFilter])

  const byDoctor = useMemo(() => {
    const map = new Map()
    for (const { event, assignment } of myItems.primary) {
      if (!map.has(assignment.name)) {
        map.set(assignment.name, { name: assignment.name, phone: assignment.phone, email: assignment.email, sessions: [] })
      }
      map.get(assignment.name).sessions.push({ event, role: assignment.role })
    }
    for (const doc of map.values()) {
      doc.sessions.sort((a, b) => a.event.day.localeCompare(b.event.day) || a.event.start_time.localeCompare(b.event.start_time))
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [myItems])

  const progress = (items) => {
    const total = items.length
    const done = items.filter((i) => i.event.done).length
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 }
  }

  if (!myPic) {
    return (
      <div className="max-w-sm mx-auto text-center py-16">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Who are you?</h2>
        <p className="text-sm text-slate-500 mb-4">Pick your name to see only the doctors and sessions assigned to you.</p>
        <select
          value={myPic}
          onChange={(e) => setMyPic(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full"
        >
          <option value="">Select your name...</option>
          {picOptions.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
    )
  }

  const activeItems = subView === 'Assisting' ? myItems.assisting : myItems.primary
  const { total, done, pct } = progress(activeItems)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Viewing as</span>
          <select
            value={myPic}
            onChange={(e) => setMyPic(e.target.value)}
            className="border border-slate-300 rounded-lg px-2 py-1 text-sm font-semibold text-brand-700"
          >
            {picOptions.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <select
          value={dayFilter}
          onChange={(e) => setDayFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All days</option>
          {days.map(([day, label]) => <option key={day} value={day}>{label}</option>)}
        </select>
      </div>

      <div className="flex gap-1 mb-4">
        {SUB_VIEWS.map((v) => (
          <button
            key={v}
            onClick={() => setSubView(v)}
            className={`flex-1 text-center px-3 py-2 rounded-lg text-xs font-semibold border ${
              subView === v ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {v}{v === 'Assisting' && myItems.assisting.length > 0 ? ` (${myItems.assisting.length})` : ''}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4 text-xs text-slate-500">
        <span>{done} / {total} sessions checked</span>
        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {subView === 'Assisting' && (
        <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          🤝 These are sessions where <b>{myPic}</b> is listed as <b>Assist</b> — helping another PIC, not primary.
        </div>
      )}

      {total === 0 && (
        <div className="text-sm text-slate-400 italic py-8 text-center">
          {subView === 'Assisting' ? `No sessions where ${myPic} is assisting.` : `No sessions assigned to ${myPic} yet.`}
        </div>
      )}

      {subView === 'By Doctor' ? (
        <div className="space-y-3">
          {byDoctor.map((doc) => {
            const isOpen = openDoc === doc.name
            const docProgress = progress(doc.sessions.map((s) => ({ event: s.event })))
            return (
              <div key={doc.name} className={`border rounded-xl bg-white overflow-hidden ${docProgress.done === docProgress.total ? 'border-emerald-200 opacity-70' : 'border-slate-200'}`}>
                <button
                  onClick={() => setOpenDoc(isOpen ? null : doc.name)}
                  className="w-full flex items-start gap-3 p-3 text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {initials(doc.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900">{doc.name}</div>
                    <div className="text-xs px-2 py-0.5 mt-1 inline-block rounded-full bg-brand-50 text-brand-700 font-medium">
                      {doc.sessions.length} session{doc.sessions.length === 1 ? '' : 's'}
                    </div>
                  </div>
                  <span className={`text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
                </button>
                {isOpen && (
                  <div className="px-3 pb-3">
                    <ContactRow phone={doc.phone} email={doc.email} />
                    <div className="space-y-2 mt-2">
                      {doc.sessions.map(({ event, role }, i) => (
                        <SessionRow key={i} event={event} role={role} onToggleDone={() => onUpdateEvent(event.id, { done: !event.done })} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {activeItems.map(({ event, assignment }, i) => (
            <div key={i} className="border border-slate-200 rounded-xl bg-white p-3">
              <div className="text-sm font-semibold text-slate-900 mb-1">{assignment.name}</div>
              <SessionRow
                event={event}
                role={assignment.role}
                note={subView === 'Assisting' ? `Primary PIC: ${assignment.pic}` : undefined}
                onToggleDone={() => onUpdateEvent(event.id, { done: !event.done })}
              />
              <ContactRow phone={assignment.phone} email={assignment.email} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
