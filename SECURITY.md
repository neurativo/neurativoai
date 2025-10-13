# Security Guidelines

## Environment Variables

Never commit API keys or secrets to version control. Use environment variables:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key

# Optional
ASSEMBLYAI_API_KEY=your_assemblyai_key
DEEPGRAM_API_KEY=your_deepgram_key
```

## Security Features Implemented

### 1. API Security

- ✅ Input validation and sanitization
- ✅ Rate limiting (basic)
- ✅ Authentication required for sensitive endpoints
- ✅ Ownership verification for user data
- ✅ Security headers on all responses

### 2. Data Protection

- ✅ Quiz content not exposed in network tab
- ✅ API keys never returned to client
- ✅ User data access controlled by authentication
- ✅ File upload validation and sanitization

### 3. Headers Security

- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Content-Security-Policy

### 4. Input Validation

- ✅ Sanitize all user inputs
- ✅ Validate file types and sizes
- ✅ URL validation
- ✅ Question type validation
- ✅ Difficulty level validation

## Security Checklist

- [ ] All API keys in environment variables
- [ ] No hardcoded secrets in code
- [ ] Input validation on all endpoints
- [ ] Authentication on sensitive routes
- [ ] Rate limiting implemented
- [ ] Security headers applied
- [ ] File upload restrictions
- [ ] SQL injection prevention (using Supabase)
- [ ] XSS protection
- [ ] CSRF protection (Next.js built-in)

## Reporting Security Issues

If you find a security vulnerability, please report it privately to the development team.
