# InscribeMate Vercel Deployment Checklist

## ✅ Pre-Deployment Setup

### 1. Environment Variables
- [ ] Set up Supabase project
- [ ] Get Supabase URL and keys
- [ ] Configure database connection string
- [ ] Set up JWT secret and encryption key

### 2. Database Setup
- [ ] Run initial schema migration (`000_initial_schema.sql`)
- [ ] Run PostGIS migration (`001_enable_postgis_and_location_columns.sql`)
- [ ] Run RLS policies migration (`005_comprehensive_rls_policies.sql`)
- [ ] Run location point migration (`005_add_location_point.sql`)
- [ ] Run RLS enablement migration (`006_enable_rls.sql`)

### 3. Code Preparation
- [ ] All TypeScript errors resolved
- [ ] Tests passing
- [ ] Build successful
- [ ] Environment variables properly configured

## 🚀 Vercel Deployment

### 1. Vercel Project Setup
- [ ] Connect GitHub repository to Vercel
- [ ] Configure build settings
- [ ] Set up environment variables in Vercel dashboard

### 2. Required Environment Variables in Vercel
```
VITE_SUPABASE_URL=https://aqvpvtqywojhybhjogiv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnB2dHF5d29oanliaGpvZ2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNDAyNDMsImV4cCI6MjA3MzcxNjI0M30.rwPp2JzLlFsGXslS1KvSSUbzNgS1dWO9q9mOSkFmjm8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnB2dHF5d29oanliaGpvZ2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNDAyNDMsImV4cCI6MjA3MzcxNjI0M30.rwPp2JzLlFsGXslS1KvSSUbzNgS1dWO9q9mOSkFmjm8
DATABASE_URL=postgresql://postgres.aqvpvtqywojhybhjogiv:Jc775869w@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
JWT_SECRET=inscribemate_jwt_secret_2024_production_ready
ENCRYPTION_KEY=inscribemate_encryption_key_32_chars_long
NODE_ENV=production
CORS_ORIGIN=https://your-app-name.vercel.app
```

### 3. Deploy
- [ ] Run `vercel --prod` or deploy via GitHub
- [ ] Monitor deployment logs
- [ ] Verify deployment success

## 🧪 Post-Deployment Testing

### 1. API Endpoints
- [ ] Health check: `GET /api/health`
- [ ] Sign up: `POST /api/auth/signup`
- [ ] Sign in: `POST /api/auth/signin`
- [ ] Sign out: `POST /api/auth/signout`
- [ ] User profile: `GET /api/users/me`
- [ ] Create request: `POST /api/requests`
- [ ] Get requests: `GET /api/requests`
- [ ] Matchmaking: `POST /api/matchmaking/nearby`

### 2. Frontend Testing
- [ ] App loads successfully
- [ ] Sign up form works
- [ ] Sign in form works
- [ ] Dashboard displays user data
- [ ] Request creation works
- [ ] Volunteer matching works
- [ ] TTS functionality works
- [ ] Accessibility features work

### 3. Database Testing
- [ ] User creation works
- [ ] Request creation works
- [ ] Match creation works
- [ ] RLS policies work correctly
- [ ] Location queries work

## 🔧 Troubleshooting

### Common Issues
1. **Environment Variables Not Loading**
   - Check Vercel dashboard settings
   - Verify variable names match exactly
   - Ensure all required variables are set

2. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check Supabase project is active
   - Ensure migrations have been run

3. **CORS Errors**
   - Update CORS_ORIGIN to match Vercel domain
   - Check CORS configuration in server

4. **Build Failures**
   - Check build logs in Vercel
   - Ensure all dependencies are installed
   - Verify TypeScript compilation

### Performance Optimization
- [ ] Enable Vercel Analytics
- [ ] Set up error monitoring
- [ ] Configure caching headers
- [ ] Optimize database queries
- [ ] Monitor performance metrics

## 📊 Monitoring

### 1. Vercel Dashboard
- [ ] Monitor deployment status
- [ ] Check function logs
- [ ] Monitor performance metrics
- [ ] Set up alerts

### 2. Supabase Dashboard
- [ ] Monitor database usage
- [ ] Check query performance
- [ ] Monitor authentication
- [ ] Review logs

### 3. Application Monitoring
- [ ] Set up error tracking
- [ ] Monitor user activity
- [ ] Track performance metrics
- [ ] Set up uptime monitoring

## 🎯 Success Criteria

- [ ] Application deploys successfully
- [ ] All API endpoints work
- [ ] Frontend loads and functions correctly
- [ ] Authentication works end-to-end
- [ ] Database operations work
- [ ] Matchmaking functionality works
- [ ] TTS and accessibility features work
- [ ] Performance is acceptable
- [ ] No critical errors in logs

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Review environment variable configuration
4. Test API endpoints individually
5. Check browser console for frontend errors
6. Review this checklist for missed steps