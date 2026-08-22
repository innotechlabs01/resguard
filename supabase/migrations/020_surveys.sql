-- Surveys (Encuestas de Satisfaccion) module
-- Created: 2026-08-22

-- ============================================================
-- 1. SURVEYS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,

  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by VARCHAR(100) NOT NULL,

  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed')),

  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. SURVEY QUESTIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,

  question_text TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('rating', 'text', 'yes_no', 'multiple_choice')),
  options JSONB,
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. SURVEY RESPONSES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  respondent_id UUID NOT NULL,
  respondent_name VARCHAR(100),
  respondent_unit VARCHAR(20),

  rating_value INTEGER CHECK (rating_value >= 1 AND rating_value <= 5),
  text_value TEXT,
  selected_option TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_surveys_building ON surveys(building_id);
CREATE INDEX IF NOT EXISTS idx_survey_questions_survey ON survey_questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_respondent ON survey_responses(respondent_id);

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Surveys: residents can see surveys from their building
CREATE POLICY "surveys_select_building" ON surveys FOR SELECT USING (
  building_id IN (SELECT building_id FROM users WHERE id = auth.uid()::text)
);

-- Surveys: admin/super_admin can create surveys in their building
CREATE POLICY "surveys_insert_admin" ON surveys FOR INSERT WITH CHECK (
  building_id IN (SELECT building_id FROM users WHERE id = auth.uid()::text AND role IN ('admin', 'super_admin'))
);

-- Surveys: admin/super_admin can update surveys in their building
CREATE POLICY "surveys_update_admin" ON surveys FOR UPDATE USING (
  building_id IN (SELECT building_id FROM users WHERE id = auth.uid()::text AND role IN ('admin', 'super_admin'))
);

-- Survey questions: anyone in the building can read questions
CREATE POLICY "survey_questions_select" ON survey_questions FOR SELECT USING (
  survey_id IN (SELECT id FROM surveys WHERE building_id IN (SELECT building_id FROM users WHERE id = auth.uid()::text))
);

-- Survey questions: admin can insert questions
CREATE POLICY "survey_questions_insert_admin" ON survey_questions FOR INSERT WITH CHECK (
  survey_id IN (SELECT id FROM surveys WHERE building_id IN (SELECT building_id FROM users WHERE id = auth.uid()::text AND role IN ('admin', 'super_admin')))
);

-- Survey responses: anyone in the building can read responses
CREATE POLICY "survey_responses_select" ON survey_responses FOR SELECT USING (
  survey_id IN (SELECT id FROM surveys WHERE building_id IN (SELECT building_id FROM users WHERE id = auth.uid()::text))
);

-- Survey responses: users can insert responses as themselves
CREATE POLICY "survey_responses_insert" ON survey_responses FOR INSERT WITH CHECK (
  respondent_id = auth.uid()::text
);
