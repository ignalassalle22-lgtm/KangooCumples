import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export function useCompras() {
  const [compras, setCompras] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchCompras = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('compras')
      .select('*, compra_items(*)')
      .order('created_at', { ascending: false })
    if (error) console.warn('compras:', error.message)
    setCompras(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCompras() }, [fetchCompras])

  const saveCompra = async (compra, items, updateStockFn, updateCostoFn) => {
    const { data: compraData, error: compraError } = await supabase
      .from('compras')
      .insert(compra)
      .select()
      .single()
    if (compraError) throw new Error(compraError.message)

    const itemsToInsert = items.map(it => ({
      compra_id: compraData.id,
      producto_id: it.producto_id,
      nombre_producto: it.nombre_producto,
      precio_unitario: it.precio_unitario,
      cantidad: it.cantidad,
      subtotal: it.subtotal,
    }))
    const { error: itemsError } = await supabase.from('compra_items').insert(itemsToInsert)
    if (itemsError) throw new Error(itemsError.message)

    // Incrementar stock y actualizar costo
    for (const it of itemsToInsert) {
      if (it.producto_id) {
        if (updateStockFn) await updateStockFn(it.producto_id, it.cantidad)
        if (updateCostoFn && it.precio_unitario > 0) await updateCostoFn(it.producto_id, it.precio_unitario)
      }
    }

    const compraCompleta = { ...compraData, compra_items: itemsToInsert }
    setCompras(prev => [compraCompleta, ...prev])
    return compraCompleta
  }

  return { compras, loading, fetchCompras, saveCompra }
}
