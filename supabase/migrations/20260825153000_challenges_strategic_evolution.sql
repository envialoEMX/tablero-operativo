-- Evolución estratégica de Challenges: impacto, pilar, audiencia y criterio de éxito.
-- Compatible con registros existentes (audiencia = organization por defecto).

-- -----------------------------------------------------------------------------
-- Catálogo configurable de pilares estratégicos
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.strategic_pillars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  sort_order integer NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT strategic_pillars_code_unique UNIQUE (code),
  CONSTRAINT strategic_pillars_nombre_len_chk CHECK (char_length(btrim(nombre)) >= 2)
);

CREATE INDEX IF NOT EXISTS idx_strategic_pillars_activo_sort
  ON public.strategic_pillars (activo, sort_order, nombre);

COMMENT ON TABLE public.strategic_pillars IS
  'Pilares estratégicos configurables para alinear Challenges con prioridades organizacionales.';

DROP TRIGGER IF EXISTS set_strategic_pillars_updated_at ON public.strategic_pillars;
CREATE TRIGGER set_strategic_pillars_updated_at
  BEFORE UPDATE ON public.strategic_pillars
  FOR EACH ROW EXECUTE FUNCTION public.touch_challenges_updated_at();

INSERT INTO public.strategic_pillars (code, nombre, sort_order)
VALUES
  ('otif', 'OTIF', 10),
  ('dso', 'DSO', 20),
  ('margen', 'Margen', 30),
  ('incidencias', 'Incidencias', 40),
  ('evidencias_t0', 'Evidencias T+0', 50),
  ('nps', 'NPS', 60),
  ('cultura_organizacional', 'Cultura Organizacional', 70)
ON CONFLICT (code) DO UPDATE
SET nombre = EXCLUDED.nombre,
    sort_order = EXCLUDED.sort_order,
    activo = true;

ALTER TABLE public.strategic_pillars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS strategic_pillars_select_authenticated ON public.strategic_pillars;
CREATE POLICY strategic_pillars_select_authenticated
ON public.strategic_pillars
FOR SELECT
TO authenticated
USING (activo = true OR public.can_manage_challenges());

DROP POLICY IF EXISTS strategic_pillars_manage_admin ON public.strategic_pillars;
CREATE POLICY strategic_pillars_manage_admin
ON public.strategic_pillars
FOR ALL
TO authenticated
USING (public.can_manage_catalogs())
WITH CHECK (public.can_manage_catalogs());

GRANT SELECT ON TABLE public.strategic_pillars TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.strategic_pillars TO authenticated;

-- -----------------------------------------------------------------------------
-- Columnas nuevas en challenges
-- -----------------------------------------------------------------------------

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS context text,
  ADD COLUMN IF NOT EXISTS question text,
  ADD COLUMN IF NOT EXISTS strategic_pillar_id uuid REFERENCES public.strategic_pillars(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS success_criteria text,
  ADD COLUMN IF NOT EXISTS audience_type text NOT NULL DEFAULT 'organization',
  ADD COLUMN IF NOT EXISTS audience_area_id uuid REFERENCES public.areas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS other_impact text;

ALTER TABLE public.challenges
  DROP CONSTRAINT IF EXISTS challenges_audience_type_chk;

ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_audience_type_chk
  CHECK (audience_type IN ('organization', 'single_area', 'multiple_areas'));

ALTER TABLE public.challenges
  DROP CONSTRAINT IF EXISTS challenges_success_criteria_len_chk;

ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_success_criteria_len_chk
  CHECK (
    success_criteria IS NULL
    OR char_length(btrim(success_criteria)) BETWEEN 5 AND 2000
  );

ALTER TABLE public.challenges
  DROP CONSTRAINT IF EXISTS challenges_other_impact_len_chk;

ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_other_impact_len_chk
  CHECK (
    other_impact IS NULL
    OR char_length(btrim(other_impact)) BETWEEN 2 AND 200
  );

UPDATE public.challenges
SET
  audience_type = COALESCE(audience_type, 'organization'),
  context = COALESCE(NULLIF(btrim(context), ''), description),
  question = COALESCE(NULLIF(btrim(question), ''), title)
WHERE context IS NULL OR question IS NULL OR audience_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_challenges_strategic_pillar
  ON public.challenges(strategic_pillar_id)
  WHERE strategic_pillar_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_challenges_audience_type
  ON public.challenges(audience_type);

-- -----------------------------------------------------------------------------
-- Impactos múltiples
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.challenge_impacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  impact_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT challenge_impacts_unique UNIQUE (challenge_id, impact_type),
  CONSTRAINT challenge_impacts_type_chk CHECK (
    impact_type IN ('time', 'cost', 'customer', 'quality', 'productivity', 'culture', 'other')
  )
);

CREATE INDEX IF NOT EXISTS idx_challenge_impacts_challenge
  ON public.challenge_impacts(challenge_id);

COMMENT ON TABLE public.challenge_impacts IS
  'Impactos esperados por challenge (selección múltiple).';

-- -----------------------------------------------------------------------------
-- Audiencia por áreas (multiple_areas)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.challenge_audience_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  area_id uuid NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT challenge_audience_areas_unique UNIQUE (challenge_id, area_id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_audience_areas_challenge
  ON public.challenge_audience_areas(challenge_id);

CREATE INDEX IF NOT EXISTS idx_challenge_audience_areas_area
  ON public.challenge_audience_areas(area_id);

COMMENT ON TABLE public.challenge_audience_areas IS
  'Áreas destinatarias cuando audience_type = multiple_areas.';

-- -----------------------------------------------------------------------------
-- Helpers de audiencia
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.usuario_belongs_to_area_id(
  p_user_id uuid,
  p_area_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_user_id IS NOT NULL
    AND p_area_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1
        FROM public.usuario_areas ua
        WHERE ua.user_id = p_user_id
          AND ua.area_id = p_area_id
      )
      OR EXISTS (
        SELECT 1
        FROM public.usuarios u
        INNER JOIN public.areas a ON a.id = p_area_id
        WHERE u.id = p_user_id
          AND u.area IS NOT NULL
          AND btrim(u.area) <> ''
          AND public.normalize_business_role(u.area) = public.normalize_business_role(a.nombre)
      )
    );
$$;

COMMENT ON FUNCTION public.usuario_belongs_to_area_id(uuid, uuid) IS
  'True si el usuario pertenece al área por membresía usuario_areas o legacy usuarios.area.';

REVOKE ALL ON FUNCTION public.usuario_belongs_to_area_id(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.usuario_belongs_to_area_id(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.challenge_user_in_audience(
  p_challenge_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_challenge public.challenges%ROWTYPE;
BEGIN
  IF p_user_id IS NULL OR p_challenge_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT * INTO v_challenge
  FROM public.challenges c
  WHERE c.id = p_challenge_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_challenge.audience_type = 'organization' THEN
    RETURN true;
  END IF;

  IF v_challenge.audience_type = 'single_area' THEN
    RETURN public.usuario_belongs_to_area_id(p_user_id, v_challenge.audience_area_id);
  END IF;

  IF v_challenge.audience_type = 'multiple_areas' THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.challenge_audience_areas caa
      WHERE caa.challenge_id = v_challenge.id
        AND public.usuario_belongs_to_area_id(p_user_id, caa.area_id)
    );
  END IF;

  RETURN false;
END;
$$;

COMMENT ON FUNCTION public.challenge_user_in_audience(uuid, uuid) IS
  'Evalúa si un usuario puede ver/participar según audiencia del challenge.';

REVOKE ALL ON FUNCTION public.challenge_user_in_audience(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.challenge_user_in_audience(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.challenge_user_can_view(
  p_challenge_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.challenges c
    WHERE c.id = p_challenge_id
      AND (
        public.can_manage_challenges()
        OR c.created_by = p_user_id
        OR (
          public.challenge_user_in_audience(c.id, p_user_id)
          AND (
            c.status IN ('active', 'finished')
            OR (c.status = 'pending' AND c.created_by = p_user_id)
          )
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.challenge_user_can_view(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.challenge_user_can_view(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.challenge_user_can_participate(
  p_challenge_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.challenges c
    WHERE c.id = p_challenge_id
      AND (
        public.can_manage_challenges()
        OR (
          public.challenge_user_in_audience(c.id, p_user_id)
          AND public.challenge_is_open_for_participation(c.status, c.start_date, c.end_date)
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.challenge_user_can_participate(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.challenge_user_can_participate(uuid, uuid) TO authenticated;

COMMENT ON TABLE public.challenge_votes IS
  'Apoyo único por usuario: indica que el reto merece atención organizacional (no voto de idea/solución).';

-- -----------------------------------------------------------------------------
-- RLS tablas nuevas
-- -----------------------------------------------------------------------------

ALTER TABLE public.challenge_impacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_audience_areas ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.challenge_impacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.challenge_audience_areas TO authenticated;

DROP POLICY IF EXISTS challenge_impacts_select ON public.challenge_impacts;
CREATE POLICY challenge_impacts_select
ON public.challenge_impacts
FOR SELECT
TO authenticated
USING (public.challenge_user_can_view(challenge_id, public.get_my_usuario_id()));

DROP POLICY IF EXISTS challenge_impacts_write ON public.challenge_impacts;
CREATE POLICY challenge_impacts_write
ON public.challenge_impacts
FOR ALL
TO authenticated
USING (
  public.can_manage_challenges()
  OR EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_impacts.challenge_id
      AND c.created_by = public.get_my_usuario_id()
      AND c.status = 'pending'
  )
)
WITH CHECK (
  public.can_manage_challenges()
  OR EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_impacts.challenge_id
      AND c.created_by = public.get_my_usuario_id()
      AND c.status = 'pending'
  )
);

DROP POLICY IF EXISTS challenge_audience_areas_select ON public.challenge_audience_areas;
CREATE POLICY challenge_audience_areas_select
ON public.challenge_audience_areas
FOR SELECT
TO authenticated
USING (public.challenge_user_can_view(challenge_id, public.get_my_usuario_id()));

DROP POLICY IF EXISTS challenge_audience_areas_write ON public.challenge_audience_areas;
CREATE POLICY challenge_audience_areas_write
ON public.challenge_audience_areas
FOR ALL
TO authenticated
USING (
  public.can_manage_challenges()
  OR EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_audience_areas.challenge_id
      AND c.created_by = public.get_my_usuario_id()
      AND c.status = 'pending'
  )
)
WITH CHECK (
  public.can_manage_challenges()
  OR EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_audience_areas.challenge_id
      AND c.created_by = public.get_my_usuario_id()
      AND c.status = 'pending'
  )
);

-- -----------------------------------------------------------------------------
-- Actualizar RLS de challenges y participación
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS challenges_select_visible ON public.challenges;
CREATE POLICY challenges_select_visible
ON public.challenges
FOR SELECT
TO authenticated
USING (
  public.can_manage_challenges()
  OR created_by = public.get_my_usuario_id()
  OR (
    public.challenge_user_in_audience(id, public.get_my_usuario_id())
    AND status IN ('active', 'finished')
    AND (
      status = 'finished'
      OR COALESCE(start_date, CURRENT_DATE) <= CURRENT_DATE
    )
  )
);

DROP POLICY IF EXISTS challenge_votes_select_visible ON public.challenge_votes;
CREATE POLICY challenge_votes_select_visible
ON public.challenge_votes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_votes.challenge_id
      AND public.challenge_user_can_view(c.id, public.get_my_usuario_id())
  )
);

DROP POLICY IF EXISTS challenge_votes_insert_active_own ON public.challenge_votes;
CREATE POLICY challenge_votes_insert_active_own
ON public.challenge_votes
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = public.get_my_usuario_id()
  AND public.challenge_user_can_participate(challenge_id, public.get_my_usuario_id())
);

DROP POLICY IF EXISTS challenge_comments_select_visible ON public.challenge_comments;
CREATE POLICY challenge_comments_select_visible
ON public.challenge_comments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_comments.challenge_id
      AND public.challenge_user_can_view(c.id, public.get_my_usuario_id())
  )
);

DROP POLICY IF EXISTS challenge_comments_insert_active_own ON public.challenge_comments;
CREATE POLICY challenge_comments_insert_active_own
ON public.challenge_comments
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = public.get_my_usuario_id()
  AND public.challenge_user_can_participate(challenge_id, public.get_my_usuario_id())
);

NOTIFY pgrst, 'reload schema';
