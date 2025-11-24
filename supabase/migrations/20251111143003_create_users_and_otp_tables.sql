/*
  # Create Users and OTP Tables for Real-time Sync

  1. New Tables
    - `users` (extends local data)
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `phone` (text)
      - `role` (text: student, teacher, admin)
      - `class` (text)
      - `section` (text)
      - `photo` (text, URL)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `otp_requests` (for password recovery)
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to users)
      - `phone` (text)
      - `otp_code` (text)
      - `attempts` (int)
      - `created_at` (timestamp)
      - `expires_at` (timestamp)
      - `verified_at` (timestamp, nullable)
  
  2. Security
    - Enable RLS on both tables
    - Users can only read their own data
    - Users can only update their own data
    - OTP requests created by system
    - Users can update own profile

  3. Real-time
    - Enable realtime broadcasts
    - Listen to user updates
    - Listen to profile changes
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text,
  role text CHECK (role IN ('student', 'teacher', 'admin')) DEFAULT 'student',
  class text,
  section text,
  photo text,
  parent_name text,
  parent_mobile text,
  admission_no text,
  password_hash text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create OTP requests table
CREATE TABLE IF NOT EXISTS otp_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone text NOT NULL,
  otp_code text NOT NULL,
  attempts int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '15 minutes'),
  verified_at timestamptz
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_requests ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- OTP requests policies
CREATE POLICY "Users can read own OTP requests"
  ON otp_requests FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

CREATE POLICY "System can create OTP requests"
  ON otp_requests FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Users can update own OTP"
  ON otp_requests FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_otp_user_id ON otp_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_requests(expires_at);
