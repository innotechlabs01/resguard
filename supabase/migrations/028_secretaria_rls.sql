-- RLS policies for Secretaría Documental
-- Asume tabla building_memberships(user_id, building_id, role)

create policy "select categories by building membership"
on document_categories for select
using (exists (select 1 from building_memberships bm where bm.building_id = document_categories.building_id and bm.user_id = auth.uid()));

create policy "insert categories by admin"
on document_categories for insert
with check (exists (select 1 from building_memberships bm where bm.building_id = building_id and bm.user_id = auth.uid() and bm.role = 'admin'));

create policy "select documents by building membership"
on documents for select
using (exists (select 1 from building_memberships bm where bm.building_id = documents.building_id and bm.user_id = auth.uid()));

create policy "insert documents by admin"
on documents for insert
with check (exists (select 1 from building_memberships bm where bm.building_id = building_id and bm.user_id = auth.uid() and bm.role = 'admin'));

create policy "update documents by admin"
on documents for update
using (exists (select 1 from building_memberships bm where bm.building_id = documents.building_id and bm.user_id = auth.uid() and bm.role = 'admin'));

create policy "select versions by building membership"
on document_versions for select
using (exists (select 1 from documents d join building_memberships bm on bm.building_id = d.building_id where d.id = document_versions.document_id and bm.user_id = auth.uid()));

create policy "insert versions by admin"
on document_versions for insert
with check (exists (select 1 from documents d join building_memberships bm on bm.building_id = d.building_id where d.id = document_id and bm.user_id = auth.uid() and bm.role = 'admin'));

create policy "select signatures by admin or super"
on document_signatures for select
using (exists (select 1 from documents d join building_memberships bm on bm.building_id = d.building_id where d.id = document_signatures.document_id and bm.user_id = auth.uid() and bm.role in ('admin','super_admin')));
