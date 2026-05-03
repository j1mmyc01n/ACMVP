/*
# Ensure Default Admin Accounts Are Active

Upserts the two built-in admin accounts so they always exist with status 'active',
even if a previous migration was skipped or the rows were modified/deleted.
*/

INSERT INTO admin_users_1777025000000 (email, role, status)
VALUES
  ('ops@acuteconnect.health',       'Admin',    'active'),
  ('sysadmin@acuteconnect.health',  'SysAdmin', 'active')
ON CONFLICT (email) DO UPDATE
  SET status = 'active',
      role   = EXCLUDED.role;
