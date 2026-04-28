import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export function useCaja() {
  const [cajaActual, setCajaActual] = useState(null)
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchCaja = useCallback(async () => {
    setLoading(true)
    const { data: actual } = await supabase
      .from('cajas')
      .select('*')
      .eq('estado', 'abierta')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setCajaActual(actual || null)

    const { data: hist } = await supabase
      .from('cajas')
      .select('*')
      .eq('estado', 'cerrada')
      .order('created_at', { ascending: false })
      .limit(30)
    setHistorial(hist || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCaja() }, [fetchCaja])

  const abrirCaja = async (saldo_inicial) => {
    const ahora = new Date()
    const hora_apertura = ahora.toTimeString().slice(0, 5)
    const fecha = ahora.toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('cajas')
      .insert({ saldo_inicial, hora_apertura, fecha, estado: 'abierta' })
      .select()
      .single()
    if (error) throw new Error(error.message)
    setCajaActual(data)
    return data
  }

  const cerrarCaja = async ({ saldo_final, obs_cierre, total_ventas, total_efectivo }) => {
    if (!cajaActual) return
    const hora_cierre = new Date().toTimeString().slice(0, 5)
    const { data, error } = await supabase
      .from('cajas')
      .update({ saldo_final, obs_cierre, hora_cierre, estado: 'cerrada', total_ventas, total_efectivo })
      .eq('id', cajaActual.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    setCajaActual(null)
    setHistorial(prev => [data, ...prev])
    return data
  }

  return { cajaActual, historial, loading, abrirCaja, cerrarCaja, fetchCaja }
}
