import { useCallback, useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from './supabaseClient'
import fallbackEvents from './eventsFallback'

const LOCAL_KEY = 'ihks2026_local_events_v1'

function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('Could not read local events cache', e)
  }
  return fallbackEvents
}

function saveLocal(events) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(events))
  } catch (e) {
    console.warn('Could not persist local events cache', e)
  }
}

export function useEvents() {
  const [events, setEvents] = useState(() => (supabaseConfigured ? [] : loadLocal()))
  const [loading, setLoading] = useState(supabaseConfigured)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!supabaseConfigured) {
      setEvents(loadLocal())
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) {
      setError(error.message)
    } else {
      setEvents(data)
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const updateEvent = useCallback(async (id, patch) => {
    if (!supabaseConfigured) {
      setEvents((prev) => {
        const next = prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
        saveLocal(next)
        return next
      })
      return { error: null }
    }
    const { error } = await supabase.from('events').update(patch).eq('id', id)
    if (!error) {
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
    }
    return { error }
  }, [])

  return {
    events,
    loading,
    error,
    refresh,
    updateEvent,
    isLive: supabaseConfigured,
  }
}
