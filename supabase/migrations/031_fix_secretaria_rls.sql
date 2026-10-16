-- Fix T-025: Secretaría RLS policies referencing non-existent building_memberships
-- Replaces policies created in 028_secretaria_rls.sql with correct user building_id/role checks
-- Uses existing helpers get_user_building_id() and get_user_role() from 009_enable_rls.sql

-- Drop policies created by 028 that reference building_memberships
DROP POLICY IF EXISTS "select categories by building membership" ON public.document_categories;
DROP POLICY IF EXISTS "insert categories by admin" ON public.document_categories;
DROP POLICY IF EXISTS "select documents by building membership" ON public.documents;
DROP POLICY IF EXISTS "insert documents by admin" ON public.documents;
DROP POLICY IF EXISTS "update documents by admin" ON public.documents;
DROP POLICY IF EXISTS "select versions by building membership" ON public.document_versions;
DROP POLICY IF EXISTS "insert versions by admin" ON public.document_versions;
DROP POLICY IF EXISTS "select signatures by admin or super" ON public.document_signatures;

-- document_categories
CREATE POLICY "select categories by building membership"
ON public.document_categories FOR SELECT
USING (building_id = public.get_user_building_id());

CREATE POLICY "insert categories by admin"
ON public.document_categories FOR INSERT
WITH CHECK (building_id = public.get_user_building_id() AND public.get_user_role() = 'admin');

-- documents
CREATE POLICY "select documents by building membership"
ON public.documents FOR SELECT
USING (building_id = public.get_user_building_id());

CREATE POLICY "insert documents by admin"
ON public.documents FOR INSERT
WITH CHECK (building_id = public.get_user_building_id() AND public.get_user_role() = 'admin');

CREATE POLICY "update documents by admin"
ON public.documents FOR UPDATE
USING (building_id = public.get_user_building_id() AND public.get_user_role() = 'admin')
WITH CHECK (building_id = public.get_user_building_id() AND public.get_user_role() = 'admin');

-- document_versions
CREATE POLICY "select versions by building membership"
ON public.document_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_versions.document_id
    AND d.building_id = public.get_user_building_id()
  )
);

CREATE POLICY "insert versions by admin"
ON public.document_versions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_id
    AND d.building_id = public.get_user_building_id()
  )
  AND public.get_user_role() = 'admin'
);

-- document_signatures
CREATE POLICY "select signatures by admin or super"
ON public.document_signatures FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_signatures.document_id
    AND d.building_id = public.get_user_building_id()
  )
  AND public.get_user_role() IN ('admin','super_admin')
);
