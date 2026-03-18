-- KangooCumples — Supabase schema
-- Ejecutá este SQL en el SQL Editor de tu proyecto Supabase

-- ── Tabla de eventos ──
CREATE TABLE IF NOT EXISTS public.eventos (
  id          BIGSERIAL PRIMARY KEY,
  fecha       DATE,
  hora        TEXT,
  salon       TEXT,
  reservante  TEXT,
  telefono    TEXT,
  cumple      TEXT,
  edad        TEXT,
  tipo        TEXT,
  privado     BOOLEAN DEFAULT FALSE,
  chi         INTEGER DEFAULT 0,
  adu         INTEGER DEFAULT 0,
  obs         TEXT,
  pago        TEXT DEFAULT 'none',   -- 'none' | 'sena' | 'paid'
  monto       NUMERIC DEFAULT 0,
  met         TEXT,
  total       NUMERIC DEFAULT 0,
  promo_id    TEXT,
  mrows       JSONB DEFAULT '[]',    -- [{mid, qty}]
  extras      JSONB DEFAULT '[]',    -- [{eid, qty}]
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tabla de configuración (clave→valor JSON) ──
-- Claves usadas: menus, salones, promos, mets, extras, pChico, pAdulto
CREATE TABLE IF NOT EXISTS public.configuracion (
  id          BIGSERIAL PRIMARY KEY,
  clave       TEXT UNIQUE NOT NULL,
  valor       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ──
ALTER TABLE public.eventos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso abierto (ajustá según tu modelo de autenticación)
CREATE POLICY "allow all eventos"       ON public.eventos       FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow all configuracion" ON public.configuracion FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ── Datos iniciales de configuración ──
INSERT INTO public.configuracion (clave, valor) VALUES
  ('menus',   '[{"id":1,"n":"Menú Clásico","p":3500},{"id":2,"n":"Menú Vegano","p":4000},{"id":3,"n":"Menú Sin TACC","p":4200}]'),
  ('salones',  '["Salón Naranja","Salón Azul","Salón Verde"]'),
  ('promos',   '[{"id":1,"d":"Cumple entre semana -10%","pct":10},{"id":2,"d":"Grupo +20 chicos -15%","pct":15}]'),
  ('mets',     '["Efectivo","Transferencia","Tarjeta débito","Tarjeta crédito","Mercado Pago"]'),
  ('extras',   '[{"id":1,"n":"Bebidas","p":500},{"id":2,"n":"Medias","p":400},{"id":3,"n":"Hora extra","p":8000},{"id":4,"n":"Saltos adicionales","p":2000},{"id":5,"n":"Parque aéreo adicional","p":3000},{"id":6,"n":"Comida extra","p":1500}]'),
  ('pChico',   '5000'),
  ('pAdulto',  '2500')
ON CONFLICT (clave) DO NOTHING;
