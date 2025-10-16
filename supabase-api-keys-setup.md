# Supabase API Keys Setup Guide

## 🔑 **API Keys Configuration**

### **1. Environment Variables (.env.local)**

Add these to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_hwbpTxxxxxxxxxxxxxxxxxx_iReh7

# Optional: Service role key (only for admin operations that need to bypass RLS)
SUPABASE_SERVICE_ROLE_KEY=your_secret_key_here
```

### **2. How to Use Each Key**

#### **Publishable Key (Anon Key)**
- **Use for:** Client-side operations (browser, mobile apps)
- **Security:** Safe to expose publicly
- **RLS:** Respects Row Level Security policies
- **Example usage:** User authentication, data fetching with RLS

#### **Secret Key (Service Role)**
- **Use for:** Server-side operations only
- **Security:** Keep secret, never expose to client
- **RLS:** Bypasses Row Level Security
- **Example usage:** Admin operations, data migrations

### **3. Recommended Approach**

Instead of using service role everywhere, use:

1. **Publishable key** for normal operations
2. **RLS policies** to control access
3. **Admin user table** to identify admins
4. **API routes** with proper authentication

### **4. Current Setup**

We're refactoring to use:
- ✅ Publishable key for client-side operations
- ✅ RLS policies for admin access control
- ✅ Admin user authentication system
- ✅ Proper API key management

### **5. Next Steps**

1. Add the keys to your `.env.local`
2. Run the RLS policies SQL script
3. Create admin users in the database
4. Test the new authentication system
