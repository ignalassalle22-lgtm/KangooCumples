import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export function useVentas() {
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchVentas = useCallback(async (desde, hasta) => {
    setLoading(true)
    let q = supabase.from('ventas').select('*, venta_items(*)').order('created_at', { ascending: false })
    if (desde) q = q.gte('fecha', desde)
    if (hasta) q = q.lte('fecha', hasta)
    const { data, error } = await q
    if (error) console.warn('ventas:', error.message)
    setVentas(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchVentas() }, [fetchVentas])

  const saveVenta = async (venta, items, updateStockFn) => {
    const numero = `V-${Date.now().toString().slice(-7)}`
    const { data: ventaData, error: ventaError } = await supabase
      .from('ventas')
      .insert({ ...venta, numero })
      .select()
      .single()
    if (ventaError) throw new Error(ventaError.message)

    const itemsToInsert = items.map(it => ({
      venta_id: ventaData.id,
      producto_id: it.producto_id,
      nombre_producto: it.nombre_producto,
      precio_unitario: it.precio_unitario,
      cantidad: it.cantidad,
      subtotal: it.subtotal,
    }))
    const { error: itemsError } = await supabase.from('venta_items').insert(itemsToInsert)
    if (itemsError) throw new Error(itemsError.message)

    // Descontar stock (también para componentes de productos compuestos)
    for (const it of items) {
      if (it.producto_id && updateStockFn) {
        await updateStockFn(it.producto_id, -it.cantidad)
        // Si el producto tiene componentes, descontar de cada componente
        if (it.componentes && it.componentes.length > 0) {
          for (const comp of it.componentes) {
            await updateStockFn(comp.producto_id, -(comp.cantidad * it.cantidad))
          }
        }
      }
    }

    const ventaCompleta = { ...ventaData, venta_items: itemsToInsert }
    setVentas(prev => [ventaCompleta, ...prev])
    return ventaCompleta
  }

  const anularVenta = async (id, updateStockFn) => {
    const venta = ventas.find(v => v.id === id)
    if (!venta) return
    const { error } = await supabase.from('ventas').update({ estado: 'anulada' }).eq('id', id)
    if (error) throw new Error(error.message)
    // Revertir stock
    if (venta.venta_items && updateStockFn) {
      for (const it of venta.venta_items) {
        if (it.producto_id) await updateStockFn(it.producto_id, it.cantidad)
      }
    }
    setVentas(prev => prev.map(v => v.id === id ? { ...v, estado: 'anulada' } : v))
  }

  return { ventas, loading, fetchVentas, saveVenta, anularVenta }
}
