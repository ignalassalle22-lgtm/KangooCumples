import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export function useEmpleados() {
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchEmpleados = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('empleados')
      .select('*')
      .order('nombre')
    if (error) console.warn('empleados:', error.message)
    setEmpleados(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchEmpleados() }, [fetchEmpleados])

  const saveEmpleado = async (nombre) => {
    const { data, error } = await supabase
      .from('empleados')
      .insert({ nombre: nombre.trim() })
      .select()
      .single()
    if (error) throw new Error(error.message)
    setEmpleados(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    return data
  }

  const toggleEmpleado = async (id, activo) => {
    const { data, error } = await supabase
      .from('empleados')
      .update({ activo })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    setEmpleados(prev => prev.map(e => e.id === id ? data : e))
    return data
  }

  const deleteEmpleado = async (id) => {
    const { error } = await supabase.from('empleados').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setEmpleados(prev => prev.filter(e => e.id !== id))
  }

  return { empleados, loading, fetchEmpleados, saveEmpleado, toggleEmpleado, deleteEmpleado }
}
