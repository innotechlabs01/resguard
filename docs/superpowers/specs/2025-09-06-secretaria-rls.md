# Secretaría Documental RLS

Políticas por building_id y rol admin.

document_categories:
- SELECT: building_id IN (SELECT building_id FROM building_memberships WHERE user_id = auth.uid())
- INSERT/UPDATE/DELETE: rol admin del edificio

documents:
- SELECT: mismo filtro
- INSERT: admin edificio
- UPDATE/DELETE: admin edificio

document_versions:
- SELECT: via documents
- INSERT: admin edificio

document_signatures:
- SELECT: admin edificio o Super Admin
- INSERT: admin edificio

Storage building-documents:
- Path prefix buildings/{building_id}/...
- Policy: user pertenece al edificio y es admin.
