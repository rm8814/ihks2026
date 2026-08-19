import { useMemo, useState } from 'react'
import { useEvents } from './useEvents'
import EventCard from './EventCard'
import SpeakerDirectory from './SpeakerDirectory'
import PicView from './PicView'

const TABS = ['Schedule', 'My PIC', 'Speakers']

export default function App() {
  const { events, loading, error, updateEvent, isLive } = useEvents()

  const [tab, setTab] = useState('Schedule')
  const [editMode, setEditMode] = useState(false)
  const [search, setSearch] = useState('')
  const [dayFilter, setDayFilter] = useState('all')
  const [trackFilter, setTrackFilter] = useState('all')
  const [picGapOnly, setPicGapOnly] = useState(false)
  const [hideDone, setHideDone] = useState(false)
  const [sortMode, setSortMode] = useState('time') // 'time' | 'track'

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
    const set = new Set(['Radit', 'Kynthia', 'Mufida', 'Talita', 'Nadhifa', 'Putri', 'Wardah', 'Anin'])
    events.forEach((e) => (e.assignments || []).forEach((a) => {
      if (a.pic) set.add(a.pic)
      if (a.assist) set.add(a.assist)
    }))
    return [...set].sort()
  }, [events])

  const speakerOptions = useMemo(() => {
    const set = new Set()
    events.forEach((e) => (e.assignments || []).forEach((a) => a.name && set.add(a.name)))
    return [...set].sort()
  }, [events])

  const hasGap = (e) =>
    (e.assignments || []).some((a) => !a.pic) && (e.assignments || []).length > 0

  const filtered = useMemo(() => {
    let list = events
    if (dayFilter !== 'all') list = list.filter((e) => e.day === dayFilter)
    if (trackFilter !== 'all') list = list.filter((e) => e.track === trackFilter)
    if (picGapOnly) list = list.filter(hasGap)
    if (hideDone) list = list.filter((e) => !e.done)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((e) => {
        const haystack = [
          e.title, e.track, e.room, e.notes,
          ...(e.assignments || []).flatMap((a) => [a.name, a.role, a.pic, a.assist]),
        ].filter(Boolean).join(' ').toLowerCase()
        return haystack.includes(q)
      })
    }
    return list
  }, [events, dayFilter, trackFilter, picGapOnly, hideDone, search])

  const grouped = useMemo(() => {
    if (sortMode === 'time') {
      // Group by day only, sections are contiguous time windows, items within
      // sorted chronologically across every track running that day.
      const map = new Map()
      for (const e of filtered) {
        if (!map.has(e.day)) map.set(e.day, { day: e.day, date_label: e.date_label, track: null, room: null, items: [] })
        map.get(e.day).items.push(e)
      }
      for (const group of map.values()) {
        group.items.sort((a, b) => a.start_time.localeCompare(b.start_time) || a.track.localeCompare(b.track))
      }
      return [...map.values()].sort((a, b) => a.day.localeCompare(b.day))
    }

    const map = new Map()
    for (const e of filtered) {
      const key = `${e.day}__${e.track}`
      if (!map.has(key)) map.set(key, { day: e.day, date_label: e.date_label, track: e.track, room: e.room, items: [] })
      map.get(key).items.push(e)
    }
    for (const group of map.values()) {
      group.items.sort((a, b) => a.start_time.localeCompare(b.start_time))
    }
    return [...map.values()].sort((a, b) => (a.day + a.track).localeCompare(b.day + b.track))
  }, [filtered, sortMode])

  const gapCount = useMemo(() => events.filter(hasGap).length, [events])
  const doneCount = useMemo(() => events.filter((e) => e.done).length, [events])

  return (
    <div className="min-h-screen overflow-x-hidden">
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
              {t}
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
          <SpeakerDirectory events={events} editMode={editMode} onUpdateEvent={updateEvent} picOptions={picOptions} />
        ) : tab === 'My PIC' ? (
          <PicView events={events} onUpdateEvent={updateEvent} picOptions={picOptions} />
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
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto sm:max-w-[200px] truncate"
              >
                <option value="all">All days</option>
                {days.map(([day, label]) => (
                  <option key={day} value={day}>{label}</option>
                ))}
              </select>
              <select
                value={trackFilter}
                onChange={(e) => setTrackFilter(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto sm:max-w-[220px] truncate"
                title={trackFilter !== 'all' ? trackFilter : undefined}
              >
                <option value="all">All tracks / rooms</option>
                {tracks.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm border border-slate-300 rounded-lg px-3 py-2 cursor-pointer select-none">
                <input type="checkbox" checked={picGapOnly} onChange={(e) => setPicGapOnly(e.target.checked)} />
                PIC gaps only {gapCount > 0 && <span className="text-red-600 font-medium">({gapCount})</span>}
              </label>
              <label className="flex items-center gap-2 text-sm border border-slate-300 rounded-lg px-3 py-2 cursor-pointer select-none">
                <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} />
                Hide done <span className="text-emerald-600 font-medium">({doneCount}/{events.length} done)</span>
              </label>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                title="How to order sessions"
              >
                <option value="time">Sort by start time</option>
                <option value="track">Group by track</option>
              </select>
            </div>

            {loading && <div className="text-sm text-slate-500">Loading schedule...</div>}
            {!loading && filtered.length === 0 && (
              <div className="text-sm text-slate-500 italic">
                No sessions match your filters.
              </div>
            )}

            <div className="space-y-8">
              {grouped.map((group) => (
                <section key={`${group.day}__${group.track || 'all'}`}>
                  <div className="mb-2">
                    <h2 className="text-base font-semibold text-slate-900">{group.track || group.date_label}</h2>
                    <div className="text-xs text-slate-500">
                      {group.track ? <>{group.date_label}{group.room ? ` · ${group.room}` : ''}</> : `${group.items.length} sessions across all tracks, in time order`}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {group.items.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        editMode={editMode}
                        onUpdate={updateEvent}
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
        Each person on a session has their own PIC — a session with multiple people
        (e.g. a speaker and a course director) can have different PICs for each.
      </footer>
    </div>
  )
}
