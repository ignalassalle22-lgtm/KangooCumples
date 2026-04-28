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
CREATE TABLE IF NOT EXISTS public.configuracion (
  id          BIGSERIAL PRIMARY KEY,
  clave       TEXT UNIQUE NOT NULL,
  valor       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ── SISTEMA DE VENTAS ────────────────────────
-- ─────────────────────────────────────────────

-- Categorías de productos
CREATE TABLE IF NOT EXISTS public.categorias (
  id         BIGSERIAL PRIMARY KEY,
  nombre     TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Productos (simples y compuestos)
CREATE TABLE IF NOT EXISTS public.productos (
  id           BIGSERIAL PRIMARY KEY,
  codigo       TEXT,
  nombre       TEXT NOT NULL,
  categoria_id BIGINT REFERENCES public.categorias(id) ON DELETE SET NULL,
  tipo         TEXT DEFAULT 'simple',    -- 'simple' | 'compuesto'
  precio_venta NUMERIC DEFAULT 0,
  precio_costo NUMERIC DEFAULT 0,
  unidad       TEXT DEFAULT 'unidad',
  stock_actual NUMERIC DEFAULT 0,
  stock_minimo NUMERIC DEFAULT 0,
  activo       BOOLEAN DEFAULT TRUE,
  componentes  JSONB DEFAULT '[]',       -- [{producto_id, nombre, cantidad}]
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Cajas (sesiones diarias)
CREATE TABLE IF NOT EXISTS public.cajas (
  id             BIGSERIAL PRIMARY KEY,
  fecha          DATE DEFAULT CURRENT_DATE,
  hora_apertura  TEXT,
  hora_cierre    TEXT,
  saldo_inicial  NUMERIC DEFAULT 0,
  saldo_final    NUMERIC,
  total_ventas   NUMERIC DEFAULT 0,
  total_efectivo NUMERIC DEFAULT 0,
  estado         TEXT DEFAULT 'abierta',  -- 'abierta' | 'cerrada'
  obs_cierre     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Ventas (cabecera de ticket)
CREATE TABLE IF NOT EXISTS public.ventas (
  id           BIGSERIAL PRIMARY KEY,
  numero       TEXT,
  fecha        DATE DEFAULT CURRENT_DATE,
  hora         TEXT,
  cliente      TEXT,
  subtotal     NUMERIC DEFAULT 0,
  descuento    NUMERIC DEFAULT 0,
  total        NUMERIC DEFAULT 0,
  metodo_pago  TEXT,
  estado       TEXT DEFAULT 'completada',  -- 'completada' | 'anulada'
  caja_id      BIGINT REFERENCES public.cajas(id) ON DELETE SET NULL,
  obs          TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Items de venta
CREATE TABLE IF NOT EXISTS public.venta_items (
  id              BIGSERIAL PRIMARY KEY,
  venta_id        BIGINT REFERENCES public.ventas(id) ON DELETE CASCADE,
  producto_id     BIGINT REFERENCES public.productos(id) ON DELETE SET NULL,
  nombre_producto TEXT,
  precio_unitario NUMERIC,
  cantidad        NUMERIC,
  subtotal        NUMERIC,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Compras (remitos)
CREATE TABLE IF NOT EXISTS public.compras (
  id            BIGSERIAL PRIMARY KEY,
  fecha         DATE DEFAULT CURRENT_DATE,
  proveedor     TEXT,
  numero_remito TEXT,
  total         NUMERIC DEFAULT 0,
  obs           TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Items de compra
CREATE TABLE IF NOT EXISTS public.compra_items (
  id              BIGSERIAL PRIMARY KEY,
  compra_id       BIGINT REFERENCES public.compras(id) ON DELETE CASCADE,
  producto_id     BIGINT REFERENCES public.productos(id) ON DELETE SET NULL,
  nombre_producto TEXT,
  precio_unitario NUMERIC,
  cantidad        NUMERIC,
  subtotal        NUMERIC,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ──
ALTER TABLE public.eventos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cajas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venta_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compra_items  ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso abierto
CREATE POLICY "allow all eventos"        ON public.eventos       FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow all configuracion"  ON public.configuracion FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow all categorias"     ON public.categorias    FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow all productos"      ON public.productos     FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow all cajas"          ON public.cajas         FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow all ventas"         ON public.ventas        FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow all venta_items"    ON public.venta_items   FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow all compras"        ON public.compras       FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow all compra_items"   ON public.compra_items  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ── Datos iniciales ──
INSERT INTO public.configuracion (clave, valor) VALUES
  ('menus',   '[{"id":1,"n":"Menú Clásico","p":3500},{"id":2,"n":"Menú Vegano","p":4000},{"id":3,"n":"Menú Sin TACC","p":4200}]'),
  ('salones',  '["Salón Naranja","Salón Azul","Salón Verde"]'),
  ('promos',   '[{"id":1,"d":"Cumple entre semana -10%","pct":10},{"id":2,"d":"Grupo +20 chicos -15%","pct":15}]'),
  ('mets',     '["Efectivo","Transferencia","Tarjeta débito","Tarjeta crédito","Mercado Pago"]'),
  ('extras',   '[{"id":1,"n":"Bebidas","p":500},{"id":2,"n":"Medias","p":400},{"id":3,"n":"Hora extra","p":8000},{"id":4,"n":"Saltos adicionales","p":2000},{"id":5,"n":"Parque aéreo adicional","p":3000},{"id":6,"n":"Comida extra","p":1500}]'),
  ('pChico',   '5000'),
  ('pAdulto',  '2500')
ON CONFLICT (clave) DO NOTHING;

INSERT INTO public.categorias (nombre) VALUES
  ('General'), ('Bebidas'), ('Alimentos'), ('Servicios'), ('Indumentaria')
ON CONFLICT DO NOTHING;
