# Secretaría Documental — Design

## Objetivo
Gestión web de documentos por edificio con versionado, adjuntos PDF/imagen en Supabase Storage privado por edificio, y flujo de aprobación por Admin del edificio. Super Admin visualiza métricas CRM.

## Alcance
Web only. No app. Roles: Admin edificio crea/edita/elimina/aprueba. Super Admin lectura CRM.

## Modelo de datos

document_categories
- id uuid PK
- building_id uuid FK buildings
- name text
- is_active boolean
- created_at timestamptz

documents
- id uuid PK
- building_id uuid FK
- category_id uuid FK document_categories
- title text
- description text
- created_by uuid FK users
- created_at timestamptz
- updated_at timestamptz
- current_version_id uuid FK document_versions

document_versions
- id uuid PK
- document_id uuid FK documents
- version_number int
- storage_path text
- mime_type text
- file_size bigint
- checksum text
- uploaded_by uuid FK users
- uploaded_at timestamptz
- change_note text

document_signatures
- id uuid PK
- document_id uuid FK
- version_id uuid FK document_versions
- signed_by uuid FK users
- signed_at timestamptz
- status text check in ('pending','approved','rejected')
- signature_note text

RLS: policies por building_id y rol admin. Super Admin read-only agregadas.

## Storage
Bucket `building-documents` privado.
Path: `buildings/{building_id}/{category_slug}/{document_id}/v{version}/filename`
Políticas storage basadas en membership del edificio.

## API
POST /api/documents
POST /api/documents/[id]/versions
PATCH /api/documents/[id]/sign
GET /api/documents?buildingId=
GET /api/documents/[id]/versions

## UI Web
Lista por categorías, historial versiones, subir nueva versión, aprobar/rechazar, vista CRM Super Admin.

## Seguridad
RequireAuth Supabase, RLS, audit trail en signatures y versions.

## Pruebas
Crear documento, subir versión, aprobar, verificar RLS por edificio.
