import { useState, useCallback } from 'react'
import { supabase } from '../supabase'

export function useAsistencia() {
  const [asistencias, setAsistencias] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchMes = useCallback(async (año, mes) => {
    setLoading(true)
    const desde = `${año}-${String(mes).padStart(2, '0')}-01`
    const hasta = `${año}-${String(mes).padStart(2, '0')}-31`
    const { data } = await supabase
      .from('asistencias')
      .select('*')
      .gte('fecha', desde)
      .lte('fecha', hasta)
    setAsistencias(data || [])
    setLoading(false)
  }, [])

  const toggleAsistencia = useCallback(async (empleadoId, fecha, presenteActual) => {
    const nueva = !presenteActual
    // Optimistic update
    setAsistencias(prev => {
      const existe = prev.find(a => a.empleado_id === empleadoId && a.fecha === fecha)
      if (existe) return prev.map(a => a.empleado_id === empleadoId && a.fecha === fecha ? { ...a, presente: nueva } : a)
      return [...prev, { empleado_id: empleadoId, fecha, presente: nueva }]
    })
    const { error } = await supabase
      .from('asistencias')
      .upsert({ empleado_id: empleadoId, fecha, presente: nueva }, { onConflict: 'empleado_id,fecha' })
    if (error) {
      // revertir
      setAsistencias(prev => prev.map(a =>
        a.empleado_id === empleadoId && a.fecha === fecha ? { ...a, presente: presenteActual } : a
      ))
    }
  }, [])

  return { asistencias, loading, fetchMes, toggleAsistencia }
}
