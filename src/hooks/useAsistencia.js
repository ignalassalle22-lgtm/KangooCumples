import { useState, useCallback } from 'react'
import { supabase } from '../supabase'

export function useAsistencia() {
  const [asistencias, setAsistencias] = useState([])
  const [observaciones, setObservaciones] = useState([])
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

  // Guarda o elimina un registro de asistencia
  const saveAsistencia = useCallback(async (empleadoId, fecha, { hora_entrada, hora_salida, vacaciones }) => {
    const isEmpty = !hora_entrada && !hora_salida && !vacaciones

    // Optimistic update
    setAsistencias(prev => {
      const existe = prev.find(a => a.empleado_id === empleadoId && a.fecha === fecha)
      if (isEmpty) return prev.filter(a => !(a.empleado_id === empleadoId && a.fecha === fecha))
      const nuevo = { empleado_id: empleadoId, fecha, hora_entrada: hora_entrada || null, hora_salida: hora_salida || null, vacaciones: !!vacaciones }
      if (existe) return prev.map(a => a.empleado_id === empleadoId && a.fecha === fecha ? { ...a, ...nuevo } : a)
      return [...prev, nuevo]
    })

    if (isEmpty) {
      await supabase.from('asistencias').delete().eq('empleado_id', empleadoId).eq('fecha', fecha)
    } else {
      await supabase.from('asistencias')
        .upsert({ empleado_id: empleadoId, fecha, hora_entrada: hora_entrada || null, hora_salida: hora_salida || null, vacaciones: !!vacaciones }, { onConflict: 'empleado_id,fecha' })
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

  return { asistencias, observaciones, loading, fetchMes, saveAsistencia, saveObs }
}
