import { useState, useCallback } from 'react'
import { supabase } from '../supabase'

// estado: null = ausente, 'presente', 'vacaciones'
export function useAsistencia() {
  const [asistencias, setAsistencias] = useState([])
  const [observaciones, setObservaciones] = useState([]) // [{empleado_id, año, mes, obs}]
  const [loading, setLoading] = useState(false)

  const fetchMes = useCallback(async (año, mes) => {
    setLoading(true)
    const desde = `${año}-${String(mes).padStart(2, '0')}-01`
    const hasta = `${año}-${String(mes).padStart(2, '0')}-31`
    const [asistRes, obsRes] = await Promise.all([
      supabase.from('asistencias').select('*').gte('fecha', desde).lte('fecha', hasta),
      supabase.from('asistencia_obs').select('*').eq('año', año).eq('mes', mes),
    ])
    setAsistencias(asistRes.data || [])
    setObservaciones(obsRes.data || [])
    setLoading(false)
  }, [])

  // Cicla: ausente → presente → vacaciones → ausente
  const toggleAsistencia = useCallback(async (empleadoId, fecha, estadoActual) => {
    const ciclo = { null: 'presente', presente: 'vacaciones', vacaciones: null }
    const nuevo = ciclo[estadoActual ?? 'null'] ?? ciclo['null']

    // Optimistic update
    setAsistencias(prev => {
      const existe = prev.find(a => a.empleado_id === empleadoId && a.fecha === fecha)
      if (nuevo === null) return prev.filter(a => !(a.empleado_id === empleadoId && a.fecha === fecha))
      if (existe) return prev.map(a => a.empleado_id === empleadoId && a.fecha === fecha ? { ...a, estado: nuevo } : a)
      return [...prev, { empleado_id: empleadoId, fecha, estado: nuevo }]
    })

    if (nuevo === null) {
      await supabase.from('asistencias').delete().eq('empleado_id', empleadoId).eq('fecha', fecha)
    } else {
      const { error } = await supabase
        .from('asistencias')
        .upsert({ empleado_id: empleadoId, fecha, estado: nuevo }, { onConflict: 'empleado_id,fecha' })
      if (error) {
        // revertir
        setAsistencias(prev => prev.filter(a => !(a.empleado_id === empleadoId && a.fecha === fecha)))
      }
    }
  }, [])

  const saveObs = useCallback(async (empleadoId, año, mes, obs) => {
    setObservaciones(prev => {
      const existe = prev.find(o => o.empleado_id === empleadoId && o.año === año && o.mes === mes)
      if (existe) return prev.map(o => o.empleado_id === empleadoId && o.año === año && o.mes === mes ? { ...o, obs } : o)
      return [...prev, { empleado_id: empleadoId, año, mes, obs }]
    })
    await supabase.from('asistencia_obs')
      .upsert({ empleado_id: empleadoId, año, mes, obs }, { onConflict: 'empleado_id,año,mes' })
  }, [])

  return { asistencias, observaciones, loading, fetchMes, toggleAsistencia, saveObs }
}
