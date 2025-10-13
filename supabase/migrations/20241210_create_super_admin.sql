-- Create super admin user
-- Replace 'your-user-id-here' with your actual user ID from auth.users table
-- You can find your user ID by running: SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- First, make sure you have a user account created
-- If you don't have a user account yet, sign up through the normal registration process first

-- Then run this SQL to make yourself a super admin:
INSERT INTO admin_users (user_id, role, created_by) 
VALUES ('your-user-id-here', 'super_admin', 'your-user-id-here');

-- To verify the admin was created, run:
-- SELECT au.*, p.email FROM admin_users au 
-- JOIN auth.users p ON au.user_id = p.id 
-- WHERE au.role = 'super_admin';
