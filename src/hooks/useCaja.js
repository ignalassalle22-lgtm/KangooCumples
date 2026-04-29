import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export function useCaja() {
  const [cajasAbiertas, setCajasAbiertas] = useState([])
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchCaja = useCallback(async () => {
    setLoading(true)
    const { data: abiertas } = await supabase
      .from('cajas')
      .select('*')
      .eq('estado', 'abierta')
      .order('created_at', { ascending: false })
    setCajasAbiertas(abiertas || [])

    const { data: hist } = await supabase
      .from('cajas')
      .select('*')
      .eq('estado', 'cerrada')
      .order('created_at', { ascending: false })
      .limit(50)
    setHistorial(hist || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCaja() }, [fetchCaja])

  const abrirCaja = async ({ saldo_inicial, nombre, turno }) => {
    const ahora = new Date()
    const hora_apertura = ahora.toTimeString().slice(0, 5)
    const fecha = ahora.toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('cajas')
      .insert({ saldo_inicial, hora_apertura, fecha, estado: 'abierta', nombre: nombre || 'Caja', turno: turno || '' })
      .select()
      .single()
    if (error) throw new Error(error.message)
    setCajasAbiertas(prev => [data, ...prev])
    return data
  }

  const cerrarCaja = async ({ cajaId, saldo_final, obs_cierre, total_ventas, total_efectivo }) => {
    const hora_cierre = new Date().toTimeString().slice(0, 5)
    const { data, error } = await supabase
      .from('cajas')
      .update({ saldo_final, obs_cierre, hora_cierre, estado: 'cerrada', total_ventas, total_efectivo })
      .eq('id', cajaId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    setCajasAbiertas(prev => prev.filter(c => c.id !== cajaId))
    setHistorial(prev => [data, ...prev])
    return data
  }

  return { cajasAbiertas, historial, loading, abrirCaja, cerrarCaja, fetchCaja }
}
