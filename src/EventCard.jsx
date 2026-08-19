import { useState } from 'react'

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

function EditableField({ label, value, onSave, placeholder, options }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setDraft(value || ''); setEditing(true) }}
        className="text-left group/field"
        title={`Click to edit ${label}`}
      >
        <span className="text-[11px] uppercase tracking-wide text-slate-400">{label}</span>
        <div className="text-sm text-slate-800 group-hover/field:underline decoration-dashed underline-offset-2">
          {value || <span className="text-slate-400 italic">{placeholder || 'set ' + label}</span>}
        </div>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">{label}</span>
      <div className="flex gap-1">
        <input
          autoFocus
          list={options ? `${label}-options` : undefined}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { onSave(draft); setEditing(false) }
            if (e.key === 'Escape') setEditing(false)
          }}
          className="border border-brand-300 rounded px-2 py-1 text-sm flex-1 min-w-0"
        />
        {options && (
          <datalist id={`${label}-options`}>
            {options.map((o) => <option key={o} value={o} />)}
          </datalist>
        )}
        <button
          onClick={() => { onSave(draft); setEditing(false) }}
          className="px-2 py-1 text-xs bg-brand-600 text-white rounded hover:bg-brand-700"
        >Save</button>
        <button
          onClick={() => setEditing(false)}
          className="px-2 py-1 text-xs bg-slate-200 rounded hover:bg-slate-300"
        >Cancel</button>
      </div>
    </div>
  )
}

export default function EventCard({ event, editMode, onUpdate, bookmarked, onToggleBookmark, picOptions, speakerOptions }) {
  const speakersText = (event.speakers || []).join(', ')

  return (
    <div className="border border-slate-200 rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-mono text-slate-500 shrink-0">
          <span>{event.start_time}</span>
          <span className="text-slate-300">&rarr;</span>
          <span>{event.end_time}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <TypeBadge type={event.type} />
          <button
            onClick={() => onToggleBookmark(event.id)}
            title={bookmarked ? 'Remove from My Agenda' : 'Add to My Agenda'}
            className={`text-lg leading-none ${bookmarked ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'}`}
          >
            {bookmarked ? '★' : '☆'}
          </button>
        </div>
      </div>

      <h3 className="mt-2 font-semibold text-slate-900 leading-snug">{event.title}</h3>
      <div className="mt-1 text-xs text-slate-500">{event.track}{event.room ? ` · ${event.room}` : ''}</div>

      {!editMode && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
          {event.speakers?.length > 0 && (
            <div><span className="text-slate-400">Speaker:</span> {event.speakers.join(', ')}</div>
          )}
          {event.chairman && <div><span className="text-slate-400">Chairman:</span> {event.chairman}</div>}
          {event.co_chairman && <div><span className="text-slate-400">Co-Chairman:</span> {event.co_chairman}</div>}
          {event.moderator && <div><span className="text-slate-400">Moderator:</span> {event.moderator}</div>}
          {event.course_director && <div><span className="text-slate-400">Course Director:</span> {event.course_director}</div>}
        </div>
      )}

      {!editMode && (event.pic_name || event.assist_pic_name) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {event.pic_name && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
              PIC: {event.pic_name}
            </span>
          )}
          {event.assist_pic_name && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium">
              Assists: {event.assist_pic_name}
            </span>
          )}
        </div>
      )}

      {!editMode && !event.pic_name && event.type !== 'break' && event.type !== 'social' && (
        <div className="mt-2">
          <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-200">
            No PIC assigned
          </span>
        </div>
      )}

      {event.notes && (
        <div className="mt-2 text-xs text-slate-500 italic">{event.notes}</div>
      )}

      {editMode && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-brand-50/60 border border-brand-100 rounded-lg p-3">
          <EditableField
            label="Speakers (comma-sep)"
            value={speakersText}
            placeholder="add speaker(s)"
            options={speakerOptions}
            onSave={(v) => onUpdate(event.id, { speakers: v.split(',').map((s) => s.trim()).filter(Boolean) })}
          />
          <EditableField label="Chairman" value={event.chairman} onSave={(v) => onUpdate(event.id, { chairman: v || null })} />
          <EditableField label="Co-Chairman" value={event.co_chairman} onSave={(v) => onUpdate(event.id, { co_chairman: v || null })} />
          <EditableField label="Moderator" value={event.moderator} onSave={(v) => onUpdate(event.id, { moderator: v || null })} />
          <EditableField
            label="PIC"
            value={event.pic_name}
            placeholder="assign PIC"
            options={picOptions}
            onSave={(v) => onUpdate(event.id, { pic_name: v || null })}
          />
          <EditableField
            label="Assist PIC"
            value={event.assist_pic_name}
            placeholder="assign assist"
            options={picOptions}
            onSave={(v) => onUpdate(event.id, { assist_pic_name: v || null })}
          />
        </div>
      )}
    </div>
  )
}
