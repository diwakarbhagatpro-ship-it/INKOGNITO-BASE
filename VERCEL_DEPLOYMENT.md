# Vercel Deployment Guide for InscribeMate

## Prerequisites
1. Vercel account
2. GitHub repository with the code
3. Supabase project set up

## Step 1: Environment Variables Setup

In your Vercel project dashboard, add these environment variables:

### Required Environment Variables:
```
VITE_SUPABASE_URL=https://aqvpvtqywojhybhjogiv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnB2dHF5d29oanliaGpvZ2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNDAyNDMsImV4cCI6MjA3MzcxNjI0M30.rwPp2JzLlFsGXslS1KvSSUbzNgS1dWO9q9mOSkFmjm8
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DATABASE_URL=postgresql://postgres.aqvpvtqywojhybhjogiv:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres
JWT_SECRET=inscribemate_jwt_secret_2024_production_ready
ENCRYPTION_KEY=inscribemate_encryption_key_32_chars_long
NODE_ENV=production
CORS_ORIGIN=https://your-app-name.vercel.app
```

### Optional Environment Variables:
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add ENCRYPTION_KEY
vercel env add NODE_ENV
vercel env add CORS_ORIGIN
```

### Option B: Deploy via GitHub Integration
1. Connect your GitHub repository to Vercel
2. Import the project
3. Set environment variables in the Vercel dashboard
4. Deploy

## Step 3: Database Setup

1. Run the database migrations in Supabase:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the migration files from `supabase/migrations/`

## Step 4: Verify Deployment

1. Check that the API endpoints are working:
   - `https://your-app.vercel.app/api/health`
   - `https://your-app.vercel.app/api/auth/signup`
   - `https://your-app.vercel.app/api/auth/signin`

2. Test the frontend:
   - Visit `https://your-app.vercel.app`
   - Try signing up and signing in

## Troubleshooting

### Common Issues:

1. **Environment Variables Not Loading**
   - Ensure all required environment variables are set in Vercel dashboard
   - Check that variable names match exactly (case-sensitive)

2. **CORS Errors**
   - Update `CORS_ORIGIN` to match your Vercel domain
   - Check that all origins are included in the CORS configuration

3. **Database Connection Issues**
   - Verify `DATABASE_URL` is correct
   - Ensure Supabase project is active
   - Check that migrations have been run

4. **Build Failures**
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in `package.json`
   - Verify TypeScript compilation passes

### Performance Optimization:

1. **Enable Edge Functions** (if needed):
   - Move heavy operations to Vercel Edge Functions
   - Use Supabase Edge Functions for real-time features

2. **Caching**:
   - Implement proper caching headers
   - Use Vercel's built-in caching

3. **Database Optimization**:
   - Use connection pooling
   - Implement proper indexing
   - Consider read replicas for heavy queries

## Monitoring

1. **Vercel Analytics**: Enable in project settings
2. **Error Tracking**: Set up error monitoring
3. **Performance Monitoring**: Use Vercel's built-in monitoring
4. **Database Monitoring**: Monitor Supabase usage and performance

## Security Checklist

- [ ] Environment variables are properly secured
- [ ] CORS is configured correctly
- [ ] Rate limiting is enabled
- [ ] Input validation is in place
- [ ] SQL injection protection is active
- [ ] Authentication is properly implemented
- [ ] HTTPS is enforced
- [ ] Security headers are configured

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Review environment variable configuration
4. Test API endpoints individually
5. Check browser console for frontend errors