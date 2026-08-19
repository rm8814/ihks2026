import { useMemo, useState } from 'react'
import { InlineEdit, PicDropdown } from './EditControls'

function collectPeople(events) {
  const map = new Map()
  for (const e of events) {
    for (const a of e.assignments || []) {
      if (!a.name) continue
      if (!map.has(a.name)) map.set(a.name, { sessions: [], phone: null, email: null })
      const entry = map.get(a.name)
      entry.sessions.push({ event: e, role: a.role, pic: a.pic, picInferred: a.pic_inferred })
      if (a.phone) entry.phone = a.phone
      if (a.email) entry.email = a.email
    }
  }
  for (const entry of map.values()) {
    entry.sessions.sort((x, y) => x.event.day.localeCompare(y.event.day) || x.event.start_time.localeCompare(y.event.start_time))
  }
  return map
}

function primaryPic(sessions) {
  const counts = new Map()
  for (const s of sessions) {
    if (!s.pic) continue
    counts.set(s.pic, (counts.get(s.pic) || 0) + 1)
  }
  let best = null, bestCount = 0
  for (const [pic, count] of counts) {
    if (count > bestCount) { best = pic; bestCount = count }
  }
  const consistent = [...counts.keys()].length <= 1
  return { pic: best, consistent }
}

function PersonCard({ name, sessions, phone, email, picOptions, setSessionPic, setPersonContact }) {
  const [editing, setEditing] = useState(false)
  const { pic, consistent } = primaryPic(sessions)

  return (
    <div className="border border-slate-200 rounded-xl bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-slate-900">{name}</div>
        <div className="flex items-center gap-1 shrink-0">
          {!editing && (pic ? (
            <span
              className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium"
              title={consistent ? 'Same PIC across all sessions' : 'Most common PIC — varies by session, see below'}
            >
              PIC: {pic}{!consistent ? ' *' : ''}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium border border-red-200">
              unassigned
            </span>
          ))}
          <button
            onClick={() => setEditing((v) => !v)}
            title={editing ? 'Done editing' : 'Edit this person'}
            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${
              editing ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600'
            }`}
          >
            {editing ? '✓' : '✏️'}
          </button>
        </div>
      </div>

      {editing ? (
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            📞 <InlineEdit value={phone} placeholder="add phone" small onSave={(v) => setPersonContact(name, 'phone', v)} />
          </span>
          <span className="flex items-center gap-1">
            ✉ <InlineEdit value={email} placeholder="add email" small onSave={(v) => setPersonContact(name, 'email', v)} />
          </span>
        </div>
      ) : (phone || email) && (
        <div className="mt-1 text-xs text-slate-500 space-x-3">
          {phone && <a href={`tel:${phone}`} className="hover:text-brand-600">📞 {phone}</a>}
          {email && <a href={`mailto:${email}`} className="hover:text-brand-600">✉ {email}</a>}
        </div>
      )}

      <div className="text-xs text-slate-400 mt-2 mb-2">{sessions.length} session{sessions.length === 1 ? '' : 's'}</div>
      <ul className="space-y-1.5">
        {sessions.map(({ event, role, pic: sPic }, i) => (
          <li key={i} className="text-sm text-slate-700 leading-snug">
            <span className="text-slate-400">{event.date_label?.split(',')[0]} {event.start_time}</span>
            {' · '}
            <span className="text-slate-500 text-xs uppercase tracking-wide">{role}</span>
            <div className="text-slate-800">{event.title}</div>
            <div className="text-xs flex items-center gap-1">
              <span>PIC:</span>
              {editing ? (
                <PicDropdown value={sPic} options={picOptions} onSave={(v) => setSessionPic(event, role, name, 'pic', v)} />
              ) : sPic ? (
                <span className="text-emerald-700 font-medium">{sPic}</span>
              ) : (
                <span className="text-red-600">unassigned</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function SpeakerDirectory({ events, onUpdateEvent, picOptions }) {
  const [query, setQuery] = useState('')
  const peopleMap = useMemo(() => collectPeople(events), [events])

  const names = useMemo(() => {
    const all = [...peopleMap.keys()].sort((a, b) => a.localeCompare(b))
    if (!query.trim()) return all
    const q = query.toLowerCase()
    return all.filter((n) => n.toLowerCase().includes(q))
  }, [peopleMap, query])

  // Editing a single session's PIC from here just patches that one event's
  // assignments array, same as the Schedule tab.
  const setSessionPic = (event, role, personName, field, value) => {
    const nextAssignments = (event.assignments || []).map((a) =>
      a.role === role && a.name === personName ? { ...a, [field]: value || null, ...(field === 'pic' ? { pic_inferred: false } : {}) } : a
    )
    onUpdateEvent(event.id, { assignments: nextAssignments })
  }

  // Editing phone/email applies to every session this person appears on, so
  // their contact info stays consistent everywhere instead of drifting.
  const setPersonContact = (personName, field, value) => {
    for (const e of events) {
      const touches = (e.assignments || []).some((a) => a.name === personName)
      if (!touches) continue
      const nextAssignments = e.assignments.map((a) =>
        a.name === personName ? { ...a, [field]: value || null } : a
      )
      onUpdateEvent(e.id, { assignments: nextAssignments })
    }
  }

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search speaker name..."
        className="w-full sm:w-80 border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4"
      />
      <div className="text-sm text-slate-500 mb-3">{names.length} people</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {names.map((name) => {
          const { sessions, phone, email } = peopleMap.get(name)
          return (
            <PersonCard
              key={name}
              name={name}
              sessions={sessions}
              phone={phone}
              email={email}
              picOptions={picOptions}
              setSessionPic={setSessionPic}
              setPersonContact={setPersonContact}
            />
          )
        })}
      </div>
    </div>
  )
}
