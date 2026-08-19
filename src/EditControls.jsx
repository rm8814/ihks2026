import { useState } from 'react'

export function InlineEdit({ value, onSave, placeholder, options, small }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const listId = `opts-${Math.random().toString(36).slice(2)}`

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setDraft(value || ''); setEditing(true) }}
        className={`text-left hover:underline decoration-dashed underline-offset-2 ${small ? 'text-xs' : 'text-sm'}`}
      >
        {value || <span className="text-slate-400 italic">{placeholder}</span>}
      </button>
    )
  }

  return (
    <span className="inline-flex gap-1 items-center">
      <input
        autoFocus
        list={options ? listId : undefined}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { onSave(draft); setEditing(false) }
          if (e.key === 'Escape') setEditing(false)
        }}
        onBlur={() => setEditing(false)}
        className="border border-brand-300 rounded px-1.5 py-0.5 text-xs w-28"
      />
      {options && (
        <datalist id={listId}>
          {options.map((o) => <option key={o} value={o} />)}
        </datalist>
      )}
      <button
        onMouseDown={(e) => { e.preventDefault(); onSave(draft); setEditing(false) }}
        className="px-1.5 py-0.5 text-[11px] bg-brand-600 text-white rounded"
      >✓</button>
    </span>
  )
}

export function PicDropdown({ value, onSave, options }) {
  const [editing, setEditing] = useState(false)
  const [customizing, setCustomizing] = useState(false)
  const [draft, setDraft] = useState(value || '')

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setDraft(value || ''); setCustomizing(false); setEditing(true) }}
        className="text-left text-xs hover:underline decoration-dashed underline-offset-2"
      >
        {value || <span className="text-slate-400 italic">assign</span>}
      </button>
    )
  }

  if (customizing) {
    return (
      <span className="inline-flex gap-1 items-center">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { onSave(draft); setEditing(false) }
            if (e.key === 'Escape') setEditing(false)
          }}
          placeholder="new name..."
          className="border border-brand-300 rounded px-1.5 py-0.5 text-xs w-24"
        />
        <button
          onMouseDown={(e) => { e.preventDefault(); onSave(draft); setEditing(false) }}
          className="px-1.5 py-0.5 text-[11px] bg-brand-600 text-white rounded"
        >✓</button>
      </span>
    )
  }

  return (
    <select
      autoFocus
      value={value && options.includes(value) ? value : ''}
      onChange={(e) => {
        if (e.target.value === '__custom__') { setCustomizing(true); return }
        onSave(e.target.value || null)
        setEditing(false)
      }}
      onBlur={() => setEditing(false)}
      className="border border-brand-300 rounded px-1.5 py-0.5 text-xs bg-white"
    >
      <option value="">unassigned</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
      <option value="__custom__">+ add new...</option>
    </select>
  )
}
