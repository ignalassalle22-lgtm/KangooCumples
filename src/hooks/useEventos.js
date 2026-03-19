import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

// Map Supabase snake_case -> camelCase
function fromDB(row) {
  if (!row) return row
  return { ...row, promoId: row.promo_id }
}

// Map camelCase -> Supabase snake_case
function toDB(ev) {
  const { promoId, ...rest } = ev
  return { ...rest, promo_id: promoId || null }
}

export function useEventos() {
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchEventos = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .order('fecha', { ascending: true })

    if (error) {
      console.warn('Supabase fetchEventos error:', error.message)
      setError(error.message)
      setLoading(false)
      return
    }
    setEventos((data || []).map(fromDB))
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchEventos()
  }, [fetchEventos])

  const saveEvento = async (ev) => {
    const dbRow = toDB(ev)

    if (ev.id) {
      const { data, error } = await supabase
        .from('eventos')
        .update(dbRow)
        .eq('id', ev.id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      const updated = fromDB(data)
      setEventos(prev => prev.map(e => e.id === ev.id ? updated : e))
      return updated
    } else {
      const { id: _id, ...insertRow } = dbRow
      const { data, error } = await supabase
        .from('eventos')
        .insert(insertRow)
        .select()
        .single()
      if (error) throw new Error(error.message)
      const created = fromDB(data)
      setEventos(prev => [...prev, created])
      return created
    }
  }

  const deleteEvento = async (id) => {
    const { error } = await supabase.from('eventos').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setEventos(prev => prev.filter(e => e.id !== id))
  }

  return { eventos, setEventos, loading, error, fetchEventos, saveEvento, deleteEvento }
}
