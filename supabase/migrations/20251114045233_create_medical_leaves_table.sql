/*
  # Create Medical Leaves Table

  1. New Tables
    - `medical_leaves`
      - `id` (uuid, primary key)
      - `student_id` (text, foreign key to users)
      - `class` (text)
      - `section` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `duration_days` (integer)
      - `reason` (text)
      - `certificate_url` (text, optional)
      - `status` (text) - 'pending', 'approved', 'rejected'
      - `remarks` (text, optional)
      - `submitted_at` (timestamptz)
      - `reviewed_at` (timestamptz, optional)
      - `reviewed_by` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on medical_leaves table
    - Students can view and submit their own medical leaves
    - Teachers/admins can review and update medical leaves
*/

CREATE TABLE IF NOT EXISTS medical_leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  class text NOT NULL,
  section text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  duration_days integer NOT NULL,
  reason text NOT NULL,
  certificate_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  remarks text,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE medical_leaves ENABLE ROW LEVEL SECURITY;

-- Policy for students to view their own medical leaves
CREATE POLICY "Students can view own medical leaves"
  ON medical_leaves
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid()::text OR auth.jwt()->>'role' IN ('teacher', 'admin'));

-- Policy for students to submit medical leaves
CREATE POLICY "Students can submit medical leaves"
  ON medical_leaves
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid()::text);

-- Policy for students to update pending leaves
CREATE POLICY "Students can update own pending leaves"
  ON medical_leaves
  FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid()::text AND status = 'pending')
  WITH CHECK (student_id = auth.uid()::text AND status = 'pending');

-- Policy for teachers/admins to review leaves
CREATE POLICY "Teachers and admins can review medical leaves"
  ON medical_leaves
  FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'role' IN ('teacher', 'admin'))
  WITH CHECK (auth.jwt()->>'role' IN ('teacher', 'admin'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_medical_leaves_student_id ON medical_leaves(student_id);
CREATE INDEX IF NOT EXISTS idx_medical_leaves_status ON medical_leaves(status);
CREATE INDEX IF NOT EXISTS idx_medical_leaves_class_section ON medical_leaves(class, section);
CREATE INDEX IF NOT EXISTS idx_medical_leaves_start_date ON medical_leaves(start_date);
CREATE INDEX IF NOT EXISTS idx_medical_leaves_created_at ON medical_leaves(created_at DESC);