-- Challenges 2.0: ideas, voting, feedback and lightweight moderation.
-- Depends on 20260823120000_challenges_module.sql and 20260825153000_challenges_strategic_evolution.sql.

CREATE TABLE IF NOT EXISTS public.challenge_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  expected_contribution text,
  status text NOT NULL DEFAULT 'active',
  selected_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  selected_at timestamptz,
  moderation_status text NOT NULL DEFAULT 'visible',
  duplicate_of_idea_id uuid REFERENCES public.challenge_ideas(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT challenge_ideas_title_len_chk CHECK (char_length(btrim(title)) BETWEEN 5 AND 140),
  CONSTRAINT challenge_ideas_description_len_chk CHECK (char_length(btrim(description)) BETWEEN 10 AND 5000),
  CONSTRAINT challenge_ideas_expected_contribution_len_chk CHECK (
    expected_contribution IS NULL OR char_length(btrim(expected_contribution)) BETWEEN 5 AND 3000
  ),
  CONSTRAINT challenge_ideas_status_chk CHECK (status IN ('active', 'selected', 'not_selected', 'implemented', 'archived')),
  CONSTRAINT challenge_ideas_moderation_status_chk CHECK (moderation_status IN ('visible', 'hidden')),
  CONSTRAINT challenge_ideas_duplicate_self_chk CHECK (duplicate_of_idea_id IS NULL OR duplicate_of_idea_id <> id),
  CONSTRAINT challenge_ideas_selected_fields_chk CHECK (
    (status <> 'selected' AND selected_by IS NULL AND selected_at IS NULL)
    OR (status = 'selected' AND selected_by IS NOT NULL AND selected_at IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.challenge_idea_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.challenge_ideas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT challenge_idea_votes_unique_user UNIQUE (idea_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.challenge_idea_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.challenge_ideas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES public.challenge_idea_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  moderation_status text NOT NULL DEFAULT 'visible',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT challenge_idea_comments_content_len_chk CHECK (char_length(btrim(content)) BETWEEN 2 AND 3000),
  CONSTRAINT challenge_idea_comments_moderation_status_chk CHECK (moderation_status IN ('visible', 'hidden')),
  CONSTRAINT challenge_idea_comments_parent_self_chk CHECK (parent_comment_id IS NULL OR parent_comment_id <> id)
);

CREATE TABLE IF NOT EXISTS public.challenge_idea_comment_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.challenge_idea_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT challenge_idea_comment_votes_unique_user UNIQUE (comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.challenge_idea_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.challenge_ideas(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  content_type text,
  uploaded_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT challenge_idea_attachments_storage_path_unique UNIQUE (storage_path)
);

CREATE TABLE IF NOT EXISTS public.challenge_content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  idea_id uuid REFERENCES public.challenge_ideas(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.challenge_idea_comments(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  CONSTRAINT challenge_content_reports_reason_chk CHECK (
    reason IN ('inappropriate', 'duplicate', 'off_topic', 'other')
  ),
  CONSTRAINT challenge_content_reports_status_chk CHECK (status IN ('open', 'reviewed', 'dismissed')),
  CONSTRAINT challenge_content_reports_target_chk CHECK (
    (idea_id IS NOT NULL AND comment_id IS NULL)
    OR (idea_id IS NULL AND comment_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_challenge_ideas_challenge_created
  ON public.challenge_ideas(challenge_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_ideas_challenge_status
  ON public.challenge_ideas(challenge_id, status, moderation_status);
CREATE INDEX IF NOT EXISTS idx_challenge_ideas_author
  ON public.challenge_ideas(author_user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_idea_votes_idea
  ON public.challenge_idea_votes(idea_id);
CREATE INDEX IF NOT EXISTS idx_challenge_idea_votes_user
  ON public.challenge_idea_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_idea_comments_idea_parent
  ON public.challenge_idea_comments(idea_id, parent_comment_id, created_at);
CREATE INDEX IF NOT EXISTS idx_challenge_idea_comments_user
  ON public.challenge_idea_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_idea_comment_votes_comment
  ON public.challenge_idea_comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_challenge_idea_attachments_idea
  ON public.challenge_idea_attachments(idea_id);
CREATE INDEX IF NOT EXISTS idx_challenge_content_reports_status
  ON public.challenge_content_reports(status, created_at DESC);

DROP TRIGGER IF EXISTS set_challenge_ideas_updated_at ON public.challenge_ideas;
CREATE TRIGGER set_challenge_ideas_updated_at
  BEFORE UPDATE ON public.challenge_ideas
  FOR EACH ROW EXECUTE FUNCTION public.touch_challenges_updated_at();

DROP TRIGGER IF EXISTS set_challenge_idea_comments_updated_at ON public.challenge_idea_comments;
CREATE TRIGGER set_challenge_idea_comments_updated_at
  BEFORE UPDATE ON public.challenge_idea_comments
  FOR EACH ROW EXECUTE FUNCTION public.touch_challenges_updated_at();

CREATE OR REPLACE FUNCTION public.challenge_idea_user_can_view(
  p_idea_id uuid,
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
    FROM public.challenge_ideas i
    WHERE i.id = p_idea_id
      AND public.challenge_user_can_view(i.challenge_id, p_user_id)
      AND (i.moderation_status = 'visible' OR public.can_manage_challenges() OR i.author_user_id = p_user_id)
  );
$$;

REVOKE ALL ON FUNCTION public.challenge_idea_user_can_view(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.challenge_idea_user_can_view(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.challenge_idea_user_can_participate(
  p_idea_id uuid,
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
    FROM public.challenge_ideas i
    WHERE i.id = p_idea_id
      AND i.moderation_status = 'visible'
      AND public.challenge_user_can_participate(i.challenge_id, p_user_id)
  );
$$;

REVOKE ALL ON FUNCTION public.challenge_idea_user_can_participate(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.challenge_idea_user_can_participate(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_challenge_idea_vote()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_author uuid;
BEGIN
  SELECT author_user_id INTO v_author
  FROM public.challenge_ideas
  WHERE id = NEW.idea_id;

  IF v_author IS NULL THEN
    RAISE EXCEPTION 'Idea no encontrada' USING ERRCODE = 'P0002';
  END IF;

  IF v_author = NEW.user_id THEN
    RAISE EXCEPTION 'No puedes apoyar tu propia propuesta' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_challenge_idea_vote() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_challenge_idea_vote() TO authenticated;

DROP TRIGGER IF EXISTS validate_challenge_idea_vote_before_insert ON public.challenge_idea_votes;
CREATE TRIGGER validate_challenge_idea_vote_before_insert
  BEFORE INSERT ON public.challenge_idea_votes
  FOR EACH ROW EXECUTE FUNCTION public.validate_challenge_idea_vote();

CREATE OR REPLACE FUNCTION public.validate_challenge_idea_comment_parent()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_parent_idea uuid;
  v_parent_parent uuid;
BEGIN
  IF NEW.parent_comment_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT idea_id, parent_comment_id
  INTO v_parent_idea, v_parent_parent
  FROM public.challenge_idea_comments
  WHERE id = NEW.parent_comment_id;

  IF v_parent_idea IS NULL THEN
    RAISE EXCEPTION 'Comentario padre no encontrado' USING ERRCODE = 'P0002';
  END IF;

  IF v_parent_idea <> NEW.idea_id THEN
    RAISE EXCEPTION 'La respuesta debe pertenecer a la misma idea' USING ERRCODE = '23514';
  END IF;

  IF v_parent_parent IS NOT NULL THEN
    RAISE EXCEPTION 'Solo se permite un nivel de respuestas' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_challenge_idea_comment_parent() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_challenge_idea_comment_parent() TO authenticated;

DROP TRIGGER IF EXISTS validate_challenge_idea_comment_parent_before_write ON public.challenge_idea_comments;
CREATE TRIGGER validate_challenge_idea_comment_parent_before_write
  BEFORE INSERT OR UPDATE OF parent_comment_id, idea_id ON public.challenge_idea_comments
  FOR EACH ROW EXECUTE FUNCTION public.validate_challenge_idea_comment_parent();

ALTER TABLE public.challenge_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_idea_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_idea_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_idea_comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_idea_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_content_reports ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.challenge_ideas,
  public.challenge_idea_votes,
  public.challenge_idea_comments,
  public.challenge_idea_comment_votes,
  public.challenge_idea_attachments,
  public.challenge_content_reports
FROM PUBLIC, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.challenge_ideas,
  public.challenge_idea_votes,
  public.challenge_idea_comments,
  public.challenge_idea_comment_votes,
  public.challenge_idea_attachments,
  public.challenge_content_reports
TO authenticated;

DROP POLICY IF EXISTS challenge_ideas_select_visible ON public.challenge_ideas;
CREATE POLICY challenge_ideas_select_visible
ON public.challenge_ideas
FOR SELECT
TO authenticated
USING (
  public.challenge_user_can_view(challenge_id, public.get_my_usuario_id())
  AND (moderation_status = 'visible' OR public.can_manage_challenges() OR author_user_id = public.get_my_usuario_id())
);

DROP POLICY IF EXISTS challenge_ideas_insert_participant ON public.challenge_ideas;
CREATE POLICY challenge_ideas_insert_participant
ON public.challenge_ideas
FOR INSERT
TO authenticated
WITH CHECK (
  author_user_id = public.get_my_usuario_id()
  AND status = 'active'
  AND moderation_status = 'visible'
  AND selected_by IS NULL
  AND selected_at IS NULL
  AND public.challenge_user_can_participate(challenge_id, public.get_my_usuario_id())
);

DROP POLICY IF EXISTS challenge_ideas_update_owner_or_admin ON public.challenge_ideas;
CREATE POLICY challenge_ideas_update_owner_or_admin
ON public.challenge_ideas
FOR UPDATE
TO authenticated
USING (
  public.can_manage_challenges()
  OR (
    author_user_id = public.get_my_usuario_id()
    AND status = 'active'
    AND moderation_status = 'visible'
    AND public.challenge_user_can_participate(challenge_id, public.get_my_usuario_id())
  )
)
WITH CHECK (
  public.can_manage_challenges()
  OR (
    author_user_id = public.get_my_usuario_id()
    AND status = 'active'
    AND moderation_status = 'visible'
    AND selected_by IS NULL
    AND selected_at IS NULL
    AND duplicate_of_idea_id IS NULL
  )
);

DROP POLICY IF EXISTS challenge_ideas_delete_admin ON public.challenge_ideas;
CREATE POLICY challenge_ideas_delete_admin
ON public.challenge_ideas
FOR DELETE
TO authenticated
USING (public.can_manage_challenges());

DROP POLICY IF EXISTS challenge_idea_votes_select_visible ON public.challenge_idea_votes;
CREATE POLICY challenge_idea_votes_select_visible
ON public.challenge_idea_votes
FOR SELECT
TO authenticated
USING (public.challenge_idea_user_can_view(idea_id, public.get_my_usuario_id()));

DROP POLICY IF EXISTS challenge_idea_votes_insert_own ON public.challenge_idea_votes;
CREATE POLICY challenge_idea_votes_insert_own
ON public.challenge_idea_votes
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = public.get_my_usuario_id()
  AND public.challenge_idea_user_can_participate(idea_id, public.get_my_usuario_id())
);

DROP POLICY IF EXISTS challenge_idea_votes_delete_own_or_admin ON public.challenge_idea_votes;
CREATE POLICY challenge_idea_votes_delete_own_or_admin
ON public.challenge_idea_votes
FOR DELETE
TO authenticated
USING (public.can_manage_challenges() OR user_id = public.get_my_usuario_id());

DROP POLICY IF EXISTS challenge_idea_comments_select_visible ON public.challenge_idea_comments;
CREATE POLICY challenge_idea_comments_select_visible
ON public.challenge_idea_comments
FOR SELECT
TO authenticated
USING (
  public.challenge_idea_user_can_view(idea_id, public.get_my_usuario_id())
  AND (moderation_status = 'visible' OR public.can_manage_challenges() OR user_id = public.get_my_usuario_id())
);

DROP POLICY IF EXISTS challenge_idea_comments_insert_own ON public.challenge_idea_comments;
CREATE POLICY challenge_idea_comments_insert_own
ON public.challenge_idea_comments
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = public.get_my_usuario_id()
  AND moderation_status = 'visible'
  AND public.challenge_idea_user_can_participate(idea_id, public.get_my_usuario_id())
);

DROP POLICY IF EXISTS challenge_idea_comments_update_own_or_admin ON public.challenge_idea_comments;
CREATE POLICY challenge_idea_comments_update_own_or_admin
ON public.challenge_idea_comments
FOR UPDATE
TO authenticated
USING (
  public.can_manage_challenges()
  OR (
    user_id = public.get_my_usuario_id()
    AND moderation_status = 'visible'
    AND public.challenge_idea_user_can_participate(idea_id, public.get_my_usuario_id())
  )
)
WITH CHECK (
  public.can_manage_challenges()
  OR (
    user_id = public.get_my_usuario_id()
    AND moderation_status = 'visible'
  )
);

DROP POLICY IF EXISTS challenge_idea_comments_delete_admin ON public.challenge_idea_comments;
CREATE POLICY challenge_idea_comments_delete_admin
ON public.challenge_idea_comments
FOR DELETE
TO authenticated
USING (public.can_manage_challenges());

DROP POLICY IF EXISTS challenge_idea_comment_votes_select_visible ON public.challenge_idea_comment_votes;
CREATE POLICY challenge_idea_comment_votes_select_visible
ON public.challenge_idea_comment_votes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.challenge_idea_comments c
    WHERE c.id = challenge_idea_comment_votes.comment_id
      AND public.challenge_idea_user_can_view(c.idea_id, public.get_my_usuario_id())
  )
);

DROP POLICY IF EXISTS challenge_idea_comment_votes_insert_own ON public.challenge_idea_comment_votes;
CREATE POLICY challenge_idea_comment_votes_insert_own
ON public.challenge_idea_comment_votes
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = public.get_my_usuario_id()
  AND EXISTS (
    SELECT 1
    FROM public.challenge_idea_comments c
    WHERE c.id = challenge_idea_comment_votes.comment_id
      AND c.user_id <> public.get_my_usuario_id()
      AND c.moderation_status = 'visible'
      AND public.challenge_idea_user_can_participate(c.idea_id, public.get_my_usuario_id())
  )
);

DROP POLICY IF EXISTS challenge_idea_comment_votes_delete_own_or_admin ON public.challenge_idea_comment_votes;
CREATE POLICY challenge_idea_comment_votes_delete_own_or_admin
ON public.challenge_idea_comment_votes
FOR DELETE
TO authenticated
USING (public.can_manage_challenges() OR user_id = public.get_my_usuario_id());

DROP POLICY IF EXISTS challenge_idea_attachments_select_visible ON public.challenge_idea_attachments;
CREATE POLICY challenge_idea_attachments_select_visible
ON public.challenge_idea_attachments
FOR SELECT
TO authenticated
USING (public.challenge_idea_user_can_view(idea_id, public.get_my_usuario_id()));

DROP POLICY IF EXISTS challenge_idea_attachments_insert_author ON public.challenge_idea_attachments;
CREATE POLICY challenge_idea_attachments_insert_author
ON public.challenge_idea_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by = public.get_my_usuario_id()
  AND EXISTS (
    SELECT 1
    FROM public.challenge_ideas i
    WHERE i.id = challenge_idea_attachments.idea_id
      AND i.author_user_id = public.get_my_usuario_id()
      AND public.challenge_idea_user_can_participate(i.id, public.get_my_usuario_id())
  )
);

DROP POLICY IF EXISTS challenge_idea_attachments_delete_author_or_admin ON public.challenge_idea_attachments;
CREATE POLICY challenge_idea_attachments_delete_author_or_admin
ON public.challenge_idea_attachments
FOR DELETE
TO authenticated
USING (
  public.can_manage_challenges()
  OR uploaded_by = public.get_my_usuario_id()
);

DROP POLICY IF EXISTS challenge_content_reports_select_admin_or_own ON public.challenge_content_reports;
CREATE POLICY challenge_content_reports_select_admin_or_own
ON public.challenge_content_reports
FOR SELECT
TO authenticated
USING (public.can_manage_challenges() OR reporter_user_id = public.get_my_usuario_id());

DROP POLICY IF EXISTS challenge_content_reports_insert_participant ON public.challenge_content_reports;
CREATE POLICY challenge_content_reports_insert_participant
ON public.challenge_content_reports
FOR INSERT
TO authenticated
WITH CHECK (
  reporter_user_id = public.get_my_usuario_id()
  AND public.challenge_user_can_view(challenge_id, public.get_my_usuario_id())
);

DROP POLICY IF EXISTS challenge_content_reports_update_admin ON public.challenge_content_reports;
CREATE POLICY challenge_content_reports_update_admin
ON public.challenge_content_reports
FOR UPDATE
TO authenticated
USING (public.can_manage_challenges())
WITH CHECK (public.can_manage_challenges());

NOTIFY pgrst, 'reload schema';
