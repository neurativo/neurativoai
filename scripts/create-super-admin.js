// Script to create a super admin user
// Run this with: node scripts/create-super-admin.js

const { createClient } = require('@supabase/supabase-js');

// Replace these with your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSuperAdmin() {
  try {
    // Get the email from command line arguments
    const email = process.argv[2];
    
    if (!email) {
      console.error('❌ Please provide an email address: node scripts/create-super-admin.js your-email@example.com');
      process.exit(1);
    }

    console.log(`🔍 Looking for user with email: ${email}`);

    // Find the user by email
    const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(email);
    
    if (userError) {
      console.error('❌ Error finding user:', userError.message);
      process.exit(1);
    }

    if (!user.user) {
      console.error('❌ User not found. Please make sure the user has signed up first.');
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.user.email} (ID: ${user.user.id})`);

    // Check if user is already an admin
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.user.id)
      .single();

    if (existingAdmin) {
      console.log('⚠️  User is already an admin with role:', existingAdmin.role);
      return;
    }

    // Create super admin
    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .insert({
        user_id: user.user.id,
        role: 'super_admin',
        created_by: user.user.id,
        is_active: true
      })
      .select()
      .single();

    if (adminError) {
      console.error('❌ Error creating super admin:', adminError.message);
      process.exit(1);
    }

    console.log('🎉 Super admin created successfully!');
    console.log('📧 Email:', user.user.email);
    console.log('🆔 User ID:', user.user.id);
    console.log('👑 Role: super_admin');
    console.log('');
    console.log('🔗 You can now access the admin panel at: /admin/login');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

createSuperAdmin();
