-- ==============================================================================
-- 🛡️ PARIS SECURITY PULSE - SUPABASE DATABASE SCHEMA (PostgreSQL)
-- ==============================================================================
-- Structure optimisée pour géolocalisation haute performance, TTL dynamique
-- et clustering d'incidents urbains anonymes.
-- ==============================================================================

-- 1. Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- PostGIS pour géodésie native (optionnel mais recommandé sur Supabase)
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Création de la table des incidents
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    location_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'autre',
    severity TEXT NOT NULL CHECK (severity IN ('danger', 'warning', 'safe')), -- rouge, orange, vert
    description TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'Signalement citoyen anonyme',
    reports_count INTEGER NOT NULL DEFAULT 1,
    upvotes INTEGER NOT NULL DEFAULT 1,
    downvotes INTEGER NOT NULL DEFAULT 0,
    reliability_score NUMERIC(4, 2) NOT NULL DEFAULT 0.70,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexation stratégique pour requêtes en temps réel et expiration
CREATE INDEX IF NOT EXISTS idx_incidents_coords ON public.incidents (lat, lon);
CREATE INDEX IF NOT EXISTS idx_incidents_expires_at ON public.incidents (expires_at);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON public.incidents (severity);
CREATE INDEX IF NOT EXISTS idx_incidents_category ON public.incidents (category);

-- 4. Fonction de mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_updated_at ON public.incidents;
CREATE TRIGGER trigger_set_updated_at
    BEFORE UPDATE ON public.incidents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Fonction RPC de clustering géospatial (Rayon de 50 mètres)
-- Permet de trouver instantanément un incident actif dans un rayon de 50m
CREATE OR REPLACE FUNCTION public.find_nearby_active_incident(
    target_lat DOUBLE PRECISION,
    target_lon DOUBLE PRECISION,
    target_category TEXT,
    max_meters DOUBLE PRECISION DEFAULT 50.0
)
RETURNS SETOF public.incidents AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.incidents
    WHERE expires_at > NOW()
      AND category = target_category
      -- Formule de Haversine intégrée (Rayon Terre = 6371000m)
      AND (
        6371000 * acos(
            cos(radians(target_lat)) * cos(radians(lat)) *
            cos(radians(lon) - radians(target_lon)) +
            sin(radians(target_lat)) * sin(radians(lat))
        )
      ) <= max_meters
    ORDER BY created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. Fonction de nettoyage automatique des incidents expirés (Cron/RPC)
CREATE OR REPLACE FUNCTION public.cleanup_expired_incidents()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.incidents
    WHERE expires_at <= NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Sécurité & Politiques RLS (Row Level Security) "Zéro-Log"
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Lecture publique : Tout le monde peut lire les incidents non expirés
CREATE POLICY "Public can read active incidents"
    ON public.incidents
    FOR SELECT
    USING (expires_at > NOW());

-- Insertion publique anonyme : Tout citoyen peut émettre un signalement
CREATE POLICY "Public anonymous insert"
    ON public.incidents
    FOR INSERT
    WITH CHECK (true);

-- Mise à jour publique anonyme (pour upvotes/downvotes/clustering)
CREATE POLICY "Public anonymous update"
    ON public.incidents
    FOR UPDATE
    USING (true);

-- Active la réplication temps réel Supabase
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'incidents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
  END IF;
END $$;
