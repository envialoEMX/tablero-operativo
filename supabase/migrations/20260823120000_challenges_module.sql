-- Challenges / Ideas MVP.
-- Cierre automatico V1: estado efectivo al consultar. Si status='active' y end_date < current_date
-- se muestra como finished y se bloquea la participacion sin requerir cron.

CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  area_id uuid REFERENCES public.areas(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  proposed_start_date date,
  proposed_end_date date,
  start_date date,
  end_date date,
  approved_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  approved_at timestamptz,
  published_at timestamptz,
  rejection_reason text,
  result_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT challenges_status_chk CHECK (status IN ('pending', 'active', 'finished', 'rejected')),
  CONSTRAINT challenges_title_len_chk CHECK (char_length(btrim(title)) BETWEEN 5 AND 120),
  CONSTRAINT challenges_description_len_chk CHECK (char_length(btrim(description)) BETWEEN 20 AND 5000),
  CONSTRAINT challenges_rejection_reason_chk CHECK (
    status <> 'rejected' OR char_length(btrim(COALESCE(rejection_reason, ''))) >= 5
  ),
  CONSTRAINT challenges_dates_chk CHECK (
    COALESCE(end_date, proposed_end_date) IS NULL
    OR COALESCE(start_date, proposed_start_date, CURRENT_DATE) <= COALESCE(end_date, proposed_end_date)
  )
);

CREATE TABLE IF NOT EXISTS public.challenge_votes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT challenge_votes_unique_user UNIQUE (challenge_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.challenge_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT challenge_comments_content_len_chk CHECK (char_length(btrim(content)) BETWEEN 2 AND 3000)
);

CREATE INDEX IF NOT EXISTS idx_challenges_status_dates
  ON public.challenges(status, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_challenges_created_by
  ON public.challenges(created_by);
CREATE INDEX IF NOT EXISTS idx_challenges_area
  ON public.challenges(area_id) WHERE area_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_challenge_votes_challenge
  ON public.challenge_votes(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_votes_user
  ON public.challenge_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_comments_challenge
  ON public.challenge_comments(challenge_id, created_at);
CREATE INDEX IF NOT EXISTS idx_challenge_comments_user
  ON public.challenge_comments(user_id);

CREATE OR REPLACE FUNCTION public.touch_challenges_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_challenges_updated_at ON public.challenges;
CREATE TRIGGER set_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.touch_challenges_updated_at();

DROP TRIGGER IF EXISTS set_challenge_comments_updated_at ON public.challenge_comments;
CREATE TRIGGER set_challenge_comments_updated_at
  BEFORE UPDATE ON public.challenge_comments
  FOR EACH ROW EXECUTE FUNCTION public.touch_challenges_updated_at();

CREATE OR REPLACE FUNCTION public.can_manage_challenges()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    public.can_manage_catalogs()
    OR public.has_business_role('DG')
    OR public.has_business_role('Sistemas')
    OR public.has_business_role('Direccion')
    OR public.has_business_role('super_admin');
$$;

CREATE OR REPLACE FUNCTION public.challenge_effective_status(
  p_status text,
  p_start_date date,
  p_end_date date
)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN p_status = 'active' AND p_end_date IS NOT NULL AND p_end_date < CURRENT_DATE THEN 'finished'
    WHEN p_status = 'active' AND p_start_date IS NOT NULL AND p_start_date > CURRENT_DATE THEN 'pending'
    ELSE p_status
  END;
$$;

CREATE OR REPLACE FUNCTION public.challenge_is_open_for_participation(
  p_status text,
  p_start_date date,
  p_end_date date
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT p_status = 'active'
    AND COALESCE(p_start_date, CURRENT_DATE) <= CURRENT_DATE
    AND COALESCE(p_end_date, CURRENT_DATE) >= CURRENT_DATE;
$$;

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_comments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.challenges, public.challenge_votes, public.challenge_comments FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.challenges, public.challenge_votes, public.challenge_comments TO authenticated;

DROP POLICY IF EXISTS challenges_select_visible ON public.challenges;
CREATE POLICY challenges_select_visible
ON public.challenges
FOR SELECT
TO authenticated
USING (
  public.can_manage_challenges()
  OR created_by = public.get_my_usuario_id()
  OR status = 'finished'
  OR (
    status = 'active'
    AND COALESCE(start_date, CURRENT_DATE) <= CURRENT_DATE
  )
);

DROP POLICY IF EXISTS challenges_insert_own_pending ON public.challenges;
CREATE POLICY challenges_insert_own_pending
ON public.challenges
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = public.get_my_usuario_id()
  AND status = 'pending'
  AND approved_by IS NULL
  AND approved_at IS NULL
  AND published_at IS NULL
);

DROP POLICY IF EXISTS challenges_update_owner_pending ON public.challenges;
CREATE POLICY challenges_update_owner_pending
ON public.challenges
FOR UPDATE
TO authenticated
USING (
  public.can_manage_challenges()
  OR (created_by = public.get_my_usuario_id() AND status = 'pending')
)
WITH CHECK (
  public.can_manage_challenges()
  OR (
    created_by = public.get_my_usuario_id()
    AND status = 'pending'
    AND approved_by IS NULL
    AND approved_at IS NULL
    AND published_at IS NULL
    AND rejection_reason IS NULL
    AND result_summary IS NULL
  )
);

DROP POLICY IF EXISTS challenges_delete_admin ON public.challenges;
CREATE POLICY challenges_delete_admin
ON public.challenges
FOR DELETE
TO authenticated
USING (public.can_manage_challenges());

DROP POLICY IF EXISTS challenge_votes_select_visible ON public.challenge_votes;
CREATE POLICY challenge_votes_select_visible
ON public.challenge_votes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_votes.challenge_id
      AND (
        public.can_manage_challenges()
        OR c.created_by = public.get_my_usuario_id()
        OR c.status = 'finished'
        OR (c.status = 'active' AND COALESCE(c.start_date, CURRENT_DATE) <= CURRENT_DATE)
      )
  )
);

DROP POLICY IF EXISTS challenge_votes_insert_active_own ON public.challenge_votes;
CREATE POLICY challenge_votes_insert_active_own
ON public.challenge_votes
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = public.get_my_usuario_id()
  AND EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_votes.challenge_id
      AND public.challenge_is_open_for_participation(c.status, c.start_date, c.end_date)
  )
);

DROP POLICY IF EXISTS challenge_votes_delete_own_or_admin ON public.challenge_votes;
CREATE POLICY challenge_votes_delete_own_or_admin
ON public.challenge_votes
FOR DELETE
TO authenticated
USING (
  public.can_manage_challenges()
  OR user_id = public.get_my_usuario_id()
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
      AND (
        public.can_manage_challenges()
        OR c.created_by = public.get_my_usuario_id()
        OR c.status = 'finished'
        OR (c.status = 'active' AND COALESCE(c.start_date, CURRENT_DATE) <= CURRENT_DATE)
      )
  )
);

DROP POLICY IF EXISTS challenge_comments_insert_active_own ON public.challenge_comments;
CREATE POLICY challenge_comments_insert_active_own
ON public.challenge_comments
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = public.get_my_usuario_id()
  AND EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_comments.challenge_id
      AND public.challenge_is_open_for_participation(c.status, c.start_date, c.end_date)
  )
);

DROP POLICY IF EXISTS challenge_comments_update_own_or_admin ON public.challenge_comments;
CREATE POLICY challenge_comments_update_own_or_admin
ON public.challenge_comments
FOR UPDATE
TO authenticated
USING (
  public.can_manage_challenges()
  OR user_id = public.get_my_usuario_id()
)
WITH CHECK (
  public.can_manage_challenges()
  OR user_id = public.get_my_usuario_id()
);

DROP POLICY IF EXISTS challenge_comments_delete_own_or_admin ON public.challenge_comments;
CREATE POLICY challenge_comments_delete_own_or_admin
ON public.challenge_comments
FOR DELETE
TO authenticated
USING (
  public.can_manage_challenges()
  OR user_id = public.get_my_usuario_id()
);

INSERT INTO public.app_modules (key, nombre, descripcion, route, section, sort_order)
VALUES (
  'challenges',
  'Challenges',
  'Retos internos, participacion e ideas de mejora.',
  '/challenges',
  'innovacion',
  85
)
ON CONFLICT (key) DO UPDATE
SET nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    route = EXCLUDED.route,
    section = EXCLUDED.section,
    sort_order = EXCLUDED.sort_order,
    activo = true;

INSERT INTO public.catalog_role_modules (role_id, module_key)
SELECT cr.id, 'challenges'
FROM public.catalog_roles cr
WHERE cr.activo
  AND public.normalize_business_role(cr.nombre) IN (
    'super_admin',
    'direccion',
    'operativo',
    'analista',
    'lider',
    'dg',
    'sistemas'
  )
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.challenges IS
  'Retos internos propuestos por usuarios; requieren aprobacion antes de publicarse.';
COMMENT ON TABLE public.challenge_votes IS
  'Voto unico de apoyo por usuario y challenge.';
COMMENT ON TABLE public.challenge_comments IS
  'Conversacion simple por challenge.';
