-- Run once in Supabase SQL editor to set the studio admin login (safe to re-run).
INSERT INTO admin_users (email, password_hash, full_name, role)
VALUES (
  'afreshfashions@gmail.com',
  '$2b$12$6vfCFG4LBxxFVZAJKQrOhenjVsr82cXg8YeAww4KjPylE4K8gLb8a',
  'Studio Admin',
  'superadmin'
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = TRUE;
