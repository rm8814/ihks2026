import { useState } from 'react'
import { InlineEdit, PicDropdown } from './EditControls'

const TYPE_COLORS = {
  keynote: 'bg-purple-100 text-purple-800',
  symposium: 'bg-blue-100 text-blue-800',
  lecture: 'bg-sky-100 text-sky-800',
  session: 'bg-slate-100 text-slate-700',
  discussion: 'bg-amber-100 text-amber-800',
  panel: 'bg-rose-100 text-rose-800',
  debate: 'bg-rose-100 text-rose-800',
  demo: 'bg-teal-100 text-teal-800',
  'hands-on': 'bg-teal-100 text-teal-800',
  break: 'bg-gray-100 text-gray-500',
  social: 'bg-pink-100 text-pink-800',
}

function TypeBadge({ type }) {
  const cls = TYPE_COLORS[type] || TYPE_COLORS.session
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {type || 'session'}
    </span>
  )
}

function AssignmentRow({ a, picOptions, speakerOptions, onChange, startTime, endTime }) {
  const [editing, setEditing] = useState(false)
  const noPic = !a.pic

  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 py-1.5 px-2 rounded-lg ${noPic ? 'bg-red-50/60' : 'bg-slate-50'}`}>
      {(startTime || endTime) && (
        <span className="text-[11px] font-mono text-slate-400 shrink-0">
          {startTime}{endTime ? `–${endTime}` : ''}
        </span>
      )}
      <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium w-24 shrink-0">{a.role}</span>

      {editing ? (
        <InlineEdit value={a.name} placeholder="name" options={speakerOptions} onSave={(v) => onChange({ ...a, name: v })} />
      ) : (
        <span className="text-sm text-slate-800 font-medium">{a.name}</span>
      )}

      <span className="text-slate-300">·</span>

      {editing ? (
        <span className="flex items-center gap-1">
          <span className="text-[11px] text-slate-400">PIC:</span>
          <PicDropdown value={a.pic} options={picOptions} onSave={(v) => onChange({ ...a, pic: v || null, pic_inferred: false })} />
        </span>
      ) : (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${noPic ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-800'}`}
          title={a.pic_inferred ? "Carried over from this person's other sessions — not an exact match for this slot" : undefined}
        >
          PIC: {a.pic || 'unassigned'}{a.pic && a.pic_inferred ? ' *' : ''}
        </span>
      )}

      {editing ? (
        <span className="flex items-center gap-1">
          <span className="text-[11px] text-slate-400">Assist:</span>
          <PicDropdown value={a.assist} options={picOptions} onSave={(v) => onChange({ ...a, assist: v || null })} />
        </span>
      ) : a.assist ? (
        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium">
          Assists: {a.assist}
        </span>
      ) : null}

      <button
        onClick={() => setEditing((v) => !v)}
        title={editing ? 'Done editing' : 'Edit this person'}
        className={`ml-auto shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs ${
          editing ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600'
        }`}
      >
        {editing ? '✓' : '✏️'}
      </button>
    </div>
  )
}

export default function EventCard({ event, onUpdate, picOptions, speakerOptions }) {
  const assignments = event.assignments || []
  const done = Boolean(event.done)

  const setAssignment = (index, next) => {
    const nextAssignments = assignments.map((a, i) => (i === index ? next : a))
    onUpdate(event.id, { assignments: nextAssignments })
  }

  return (
    <div className={`border rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow ${done ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdate(event.id, { done: !done })}
            title={done ? 'Mark as not done' : 'Mark as done'}
            className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs shrink-0 ${
              done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent hover:border-brand-400'
            }`}
          >
            ✓
          </button>
          <div className="flex items-center gap-2 text-sm font-mono text-slate-500">
            <span>{event.start_time}</span>
            <span className="text-slate-300">&rarr;</span>
            <span>{event.end_time}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <TypeBadge type={event.type} />
        </div>
      </div>

      <h3 className={`mt-2 font-semibold leading-snug ${done ? 'text-slate-500 line-through decoration-emerald-400' : 'text-slate-900'}`}>
        {event.title}
      </h3>
      <div className="mt-1 text-xs text-slate-500">{event.track}{event.room ? ` · ${event.room}` : ''}</div>

      {assignments.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {assignments.map((a, i) => (
            <AssignmentRow
              key={i}
              a={a}
              picOptions={picOptions}
              speakerOptions={speakerOptions}
              onChange={(next) => setAssignment(i, next)}
              startTime={event.start_time}
              endTime={event.end_time}
            />
          ))}
        </div>
      )}

      {event.notes && (
        <div className="mt-2 text-xs text-slate-500 italic">{event.notes}</div>
      )}
    </div>
  )
}
