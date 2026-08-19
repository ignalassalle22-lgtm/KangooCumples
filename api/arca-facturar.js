// api/arca-facturar.js — Obtiene token WSAA + solicita CAE para factura C (monotributista)
import { buildTRA, signTRA, callWSAA, callWSFE, xmlTag } from '../lib/arca.js'

// Cache en memoria (warm instances) + Supabase (persistente entre deploys)
let wsaaCache = null // { token, sign, expiration, ambiente }

async function supabaseGet(service) {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  try {
    const resp = await fetch(`${url}/rest/v1/arca_tokens?id=eq.${service}&select=token,sign,expiration`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    })
    const rows = await resp.json()
    return rows[0] || null
  } catch { return null }
}

async function supabaseSave(service, token, sign, expiration) {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return
  try {
    await fetch(`${url}/rest/v1/arca_tokens?id=eq.${service}`, {
      method: 'PATCH',
      headers: {
        apikey: key, Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json', Prefer: 'return=minimal'
      },
      body: JSON.stringify({ token, sign, expiration })
    })
  } catch {}
}

async function getWSAAToken(cert, key, ambiente) {
  // 1. Cache en memoria (verificar que sea del mismo ambiente)
  if (wsaaCache && wsaaCache.ambiente === ambiente && new Date(wsaaCache.expiration) > new Date(Date.now() + 5 * 60 * 1000)) {
    return { token: wsaaCache.token, sign: wsaaCache.sign }
  }
  wsaaCache = null

  // 2. Cache en Supabase
  const cached = await supabaseGet('wsfe')
  if (cached?.token && cached?.expiration && new Date(cached.expiration) > new Date(Date.now() + 5 * 60 * 1000)) {
    wsaaCache = cached
    return { token: cached.token, sign: cached.sign }
  }

  // 3. Pedir token nuevo a WSAA
  const tra = buildTRA('wsfe')
  const cms = signTRA(tra, cert, key)
  const result = await callWSAA(cms, ambiente)

  wsaaCache = { token: result.token, sign: result.sign, expiration: result.expiration, ambiente }
  await supabaseSave('wsfe', result.token, result.sign, result.expiration)
  return { token: result.token, sign: result.sign }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { total, fecha, clienteCuit } = req.body
  if (!total && total !== 0) return res.status(400).json({ error: 'total requerido' })

  const cert   = process.env.ARCA_CERT
  const key    = process.env.ARCA_KEY
  const cuit   = process.env.ARCA_CUIT?.replace(/[-\s]/g, '')
  const ptoVta = parseInt(process.env.ARCA_PTO_VTA) || 1
  const ambiente = process.env.ARCA_AMBIENTE || 'homologacion'

  if (!cert || !key) return res.status(500).json({ error: 'ARCA no configurado: falta certificado o clave privada en env vars' })
  if (!cuit) return res.status(500).json({ error: 'ARCA_CUIT no configurado' })

  try {
    // 1. Obtener token WSAA (con cache)
    const { token, sign } = await getWSAAToken(cert, key, ambiente)

    // 2. Último comprobante autorizado (Factura C = tipo 11)
    const cbteTipo = 11
    const lastXml = await callWSFE('FECompUltimoAutorizado', `
      <ar:FECompUltimoAutorizado>
        <ar:Auth>
          <ar:Token>${token}</ar:Token>
          <ar:Sign>${sign}</ar:Sign>
          <ar:Cuit>${cuit}</ar:Cuit>
        </ar:Auth>
        <ar:PtoVta>${ptoVta}</ar:PtoVta>
        <ar:CbteTipo>${cbteTipo}</ar:CbteTipo>
      </ar:FECompUltimoAutorizado>`, ambiente)

    const lastNum = parseInt(xmlTag(lastXml, 'CbteNro') || '0')
    const nextNum = lastNum + 1

    // 3. Importes — Factura C: todo va como ImpNeto, sin IVA discriminado
    const impTotal = parseFloat(Number(total).toFixed(2))
    const impNeto  = impTotal

    // 4. Receptor
    const docCuit = (clienteCuit || '').replace(/[-\s]/g, '')
    const docTipo = docCuit ? 80 : 99   // 80=CUIT, 99=Consumidor Final
    const docNro  = docCuit || 0
    // Condición IVA receptor (RG 5616): 5=Consumidor Final, 1=Responsable Inscripto
    const condIvaReceptor = docCuit ? 1 : 5

    // Fecha formato YYYYMMDD
    const fechaStr = (fecha || new Date().toISOString().slice(0, 10)).replace(/-/g, '')

    // 5. FECAESolicitar
    const caeXml = await callWSFE('FECAESolicitar', `
      <ar:FECAESolicitar>
        <ar:Auth>
          <ar:Token>${token}</ar:Token>
          <ar:Sign>${sign}</ar:Sign>
          <ar:Cuit>${cuit}</ar:Cuit>
        </ar:Auth>
        <ar:FeCAEReq>
          <ar:FeCabReq>
            <ar:CantReg>1</ar:CantReg>
            <ar:PtoVta>${ptoVta}</ar:PtoVta>
            <ar:CbteTipo>${cbteTipo}</ar:CbteTipo>
          </ar:FeCabReq>
          <ar:FeDetReq>
            <ar:FECAEDetRequest>
              <ar:Concepto>1</ar:Concepto>
              <ar:DocTipo>${docTipo}</ar:DocTipo>
              <ar:DocNro>${docNro}</ar:DocNro>
              <ar:CbteDesde>${nextNum}</ar:CbteDesde>
              <ar:CbteHasta>${nextNum}</ar:CbteHasta>
              <ar:CbteFch>${fechaStr}</ar:CbteFch>
              <ar:ImpTotal>${impTotal.toFixed(2)}</ar:ImpTotal>
              <ar:ImpTotConc>0.00</ar:ImpTotConc>
              <ar:ImpNeto>${impNeto.toFixed(2)}</ar:ImpNeto>
              <ar:ImpOpEx>0.00</ar:ImpOpEx>
              <ar:ImpIVA>0.00</ar:ImpIVA>
              <ar:ImpTrib>0.00</ar:ImpTrib>
              <ar:MonId>PES</ar:MonId>
              <ar:MonCotiz>1</ar:MonCotiz>
              <ar:CondicionIVAReceptorId>${condIvaReceptor}</ar:CondicionIVAReceptorId>
            </ar:FECAEDetRequest>
          </ar:FeDetReq>
        </ar:FeCAEReq>
      </ar:FECAESolicitar>`, ambiente)

    const resultado = xmlTag(caeXml, 'Resultado')
    const cae       = xmlTag(caeXml, 'CAE')
    const caeVto    = xmlTag(caeXml, 'CAEFchVto')
    const errMsg    = xmlTag(caeXml, 'Msg') || xmlTag(caeXml, 'faultstring') || 'ARCA rechazó el comprobante'

    if (resultado !== 'A' || !cae) {
      return res.status(400).json({ error: errMsg, raw: caeXml })
    }

    // Formatear vencimiento: YYYYMMDD → YYYY-MM-DD
    const caeVtoFmt = caeVto
      ? `${caeVto.slice(0,4)}-${caeVto.slice(4,6)}-${caeVto.slice(6,8)}`
      : null

    return res.status(200).json({
      success: true,
      cae,
      caeVto: caeVtoFmt,
      cbteNumero: nextNum,
      cbteTipo,
      ptoVta,
      cuit,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message, cause: err.cause?.message || err.cause?.code || undefined })
  }
}
