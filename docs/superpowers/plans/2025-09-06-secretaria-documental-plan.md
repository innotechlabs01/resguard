# Secretaría Documental Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement web-only Secretaría Documental con versionado, storage privado por edificio y flujo de aprobación.

**Architecture:** Next.js App Router + Supabase Auth/DB/Storage, RLS por building_id, APIs en app/api, UI en app/(dashboard)/secretaria.

**Tech Stack:** Next.js 14, Supabase JS, Prisma-free SQL migrations, Tailwind, Zod.

**Spec:** docs/superpowers/specs/2025-09-06-secretaria-documental-design.md

## Global Constraints
- Idioma español neutro profesional.
- RLS siempre activo.
- Autenticación Supabase Auth nativo.
- Web only, no app.
- Storage privado por edificio.

---

### Task 1: DB schema y RLS
- [x] Migration created
