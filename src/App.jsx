import { useEffect, useMemo, useState } from 'react'
import { useEvents } from './useEvents'
import EventCard from './EventCard'
import SpeakerDirectory from './SpeakerDirectory'

const BOOKMARK_KEY = 'ihks2026_bookmarks_v1'

function useBookmarks() {
  const [ids, setIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]'))
    } catch {
      return new Set()
    }
  })
  useEffect(() => {
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...ids]))
  }, [ids])
  const toggle = (id) => {
    setIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  return { ids, toggle }
}

const TABS = ['Schedule', 'My Agenda', 'Speakers']

export default function App() {
  const { events, loading, error, updateEvent, isLive } = useEvents()
  const bookmarks = useBookmarks()

  const [tab, setTab] = useState('Schedule')
  const [editMode, setEditMode] = useState(false)
  const [search, setSearch] = useState('')
  const [dayFilter, setDayFilter] = useState('all')
  const [trackFilter, setTrackFilter] = useState('all')
  const [picGapOnly, setPicGapOnly] = useState(false)

  const days = useMemo(() => {
    const seen = new Map()
    for (const e of events) seen.set(e.day, e.date_label)
    return [...seen.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [events])

  const tracks = useMemo(() => {
    const set = new Set(events.filter((e) => dayFilter === 'all' || e.day === dayFilter).map((e) => e.track))
    return [...set].sort()
  }, [events, dayFilter])

  const picOptions = useMemo(() => {
    const set = new Set()
    events.forEach((e) => { if (e.pic_name) set.add(e.pic_name); if (e.assist_pic_name) set.add(e.assist_pic_name) })
    ;['Radit', 'Kynthia', 'Mufida', 'Talita', 'Nadhifa', 'Putri', 'Wardah', 'Anin'].forEach((n) => set.add(n))
    return [...set].sort()
  }, [events])

  const speakerOptions = useMemo(() => {
    const set = new Set()
    events.forEach((e) => (e.speakers || []).forEach((s) => set.add(s)))
    return [...set].sort()
  }, [events])

  const filtered = useMemo(() => {
    let list = events
    if (dayFilter !== 'all') list = list.filter((e) => e.day === dayFilter)
    if (trackFilter !== 'all') list = list.filter((e) => e.track === trackFilter)
    if (picGapOnly) list = list.filter((e) => !e.pic_name && e.type !== 'break' && e.type !== 'social')
    if (tab === 'My Agenda') list = list.filter((e) => bookmarks.ids.has(e.id))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((e) => {
        const haystack = [
          e.title, e.track, e.room, e.notes,
          ...(e.speakers || []), e.chairman, e.co_chairman, e.moderator,
          e.course_director, e.pic_name, e.assist_pic_name,
        ].filter(Boolean).join(' ').toLowerCase()
        return haystack.includes(q)
      })
    }
    return list
  }, [events, dayFilter, trackFilter, picGapOnly, tab, bookmarks.ids, search])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const e of filtered) {
      const key = `${e.day}__${e.track}`
      if (!map.has(key)) map.set(key, { day: e.day, date_label: e.date_label, track: e.track, room: e.room, items: [] })
      map.get(key).items.push(e)
    }
    return [...map.values()].sort((a, b) => (a.day + a.track).localeCompare(b.day + b.track))
  }, [filtered])

  const gapCount = useMemo(
    () => events.filter((e) => !e.pic_name && e.type !== 'break' && e.type !== 'social').length,
    [events]
  )

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div>
            <h1 className="text-lg font-bold text-brand-800">IHKS 2026 · Interactive Schedule</h1>
            <p className="text-xs text-slate-500">
              Yogyakarta Marriott Hotel · 19&ndash;23 August 2026
              {' · '}
              <span className={isLive ? 'text-emerald-600' : 'text-amber-600'}>
                {isLive ? 'Live (Supabase)' : 'Local mode (Supabase not configured)'}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode((v) => !v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                editMode ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-brand-700 border-brand-300'
              }`}
            >
              {editMode ? 'Editing: On' : 'Edit Speakers / PIC'}
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 flex gap-1 pb-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                tab === t ? 'bg-brand-100 text-brand-800' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {t}{t === 'My Agenda' && bookmarks.ids.size > 0 ? ` (${bookmarks.ids.size})` : ''}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
            Couldn't load from Supabase: {error}
          </div>
        )}

        {tab === 'Speakers' ? (
          <SpeakerDirectory events={events} />
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, speaker, PIC, room..."
                className="flex-1 min-w-[220px] border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
              <select
                value={dayFilter}
                onChange={(e) => { setDayFilter(e.target.value); setTrackFilter('all') }}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All days</option>
                {days.map(([day, label]) => (
                  <option key={day} value={day}>{label}</option>
                ))}
              </select>
              <select
                value={trackFilter}
                onChange={(e) => setTrackFilter(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All tracks / rooms</option>
                {tracks.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm border border-slate-300 rounded-lg px-3 py-2 cursor-pointer select-none">
                <input type="checkbox" checked={picGapOnly} onChange={(e) => setPicGapOnly(e.target.checked)} />
                PIC gaps only {gapCount > 0 && <span className="text-red-600 font-medium">({gapCount})</span>}
              </label>
            </div>

            {loading && <div className="text-sm text-slate-500">Loading schedule...</div>}
            {!loading && filtered.length === 0 && (
              <div className="text-sm text-slate-500 italic">
                {tab === 'My Agenda' ? 'Nothing bookmarked yet — star sessions from the Schedule tab.' : 'No sessions match your filters.'}
              </div>
            )}

            <div className="space-y-8">
              {grouped.map((group) => (
                <section key={`${group.day}__${group.track}`}>
                  <div className="mb-2">
                    <h2 className="text-base font-semibold text-slate-900">{group.track}</h2>
                    <div className="text-xs text-slate-500">{group.date_label}{group.room ? ` · ${group.room}` : ''}</div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {group.items.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        editMode={editMode}
                        onUpdate={updateEvent}
                        bookmarked={bookmarks.ids.has(event.id)}
                        onToggleBookmark={bookmarks.toggle}
                        picOptions={picOptions}
                        speakerOptions={speakerOptions}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-xs text-slate-400">
        Data sourced from the official IHKS 2026 program book and committee recap sheet.
        Times/speakers marked "verify" in notes were ambiguous in the source PDF layout — double-check before publishing externally.
      </footer>
    </div>
  )
}
