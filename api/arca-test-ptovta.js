// api/arca-test-ptovta.js — Verifica si el punto de venta está habilitado
import { callWSFE, xmlTag } from '../lib/arca.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const ambiente = process.env.ARCA_AMBIENTE || 'homologacion'
  const sbUrl = process.env.VITE_SUPABASE_URL
  const sbKey = process.env.VITE_SUPABASE_ANON_KEY

  // Get cached token from Supabase
  const resp = await fetch(`${sbUrl}/rest/v1/arca_tokens?id=eq.wsfe&select=token,sign`, {
    headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` }
  })
  const rows = await resp.json()
  const { token, sign } = rows[0]
  const cuit = process.env.ARCA_CUIT?.replace(/[-\s]/g, '')
  const ptoVta = parseInt(process.env.ARCA_PTO_VTA) || 3

  // 1. Consultar puntos de venta habilitados
  const ptvXml = await callWSFE('FEParamGetPtosVenta', `
    <ar:FEParamGetPtosVenta>
      <ar:Auth>
        <ar:Token>${token}</ar:Token>
        <ar:Sign>${sign}</ar:Sign>
        <ar:Cuit>${cuit}</ar:Cuit>
      </ar:Auth>
    </ar:FEParamGetPtosVenta>`, ambiente)

  // 2. Consultar último comprobante
  let lastXml = ''
  try {
    lastXml = await callWSFE('FECompUltimoAutorizado', `
      <ar:FECompUltimoAutorizado>
        <ar:Auth>
          <ar:Token>${token}</ar:Token>
          <ar:Sign>${sign}</ar:Sign>
          <ar:Cuit>${cuit}</ar:Cuit>
        </ar:Auth>
        <ar:PtoVta>${ptoVta}</ar:PtoVta>
        <ar:CbteTipo>11</ar:CbteTipo>
      </ar:FECompUltimoAutorizado>`, ambiente)
  } catch (e) {
    lastXml = e.message
  }

  return res.json({
    ptoVta,
    cuit,
    ambiente,
    puntosDeVenta: ptvXml.slice(0, 2000),
    ultimoComprobante: lastXml.slice(0, 1000)
  })
}
