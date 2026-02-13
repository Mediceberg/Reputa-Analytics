# Production Database Setup Guide

## Overview
This guide covers setting up production database connections for Reputa Analytics on Vercel.

## Required Environment Variables

### 1. MongoDB Atlas Setup

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free account

2. **Create a Cluster**
   - Create a new cluster (M0 free tier is sufficient for testing)
   - Choose a region close to your users

3. **Get Connection String**
   - In your cluster, click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

4. **Environment Variable**
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database>?retryWrites=true&w=majority
   MONGODB_DB_NAME=reputa-v3
   ```

### 2. Upstash Redis Setup

1. **Create Upstash Account**
   - Go to [Upstash](https://upstash.com/)
   - Create a free account

2. **Create Redis Database**
   - Click "Create Database"
   - Choose a region (same as MongoDB if possible)
   - Give it a name (e.g., "reputa-cache")

3. **Get Connection Details**
   - In your database, go to "Details"
   - Copy the REST URL and REST Token

4. **Environment Variables**
   ```
   UPSTASH_REDIS_REST_URL=https://<your-upstash-redis-url>.upstash.io
   UPSTASH_REDIS_REST_TOKEN=<your-upstash-redis-token>
   ```

## Vercel Configuration

### Adding Environment Variables to Vercel

1. **Via Vercel Dashboard**
   - Go to your Vercel project
   - Navigate to "Settings" → "Environment Variables"
   - Add each variable with its value

2. **Via Vercel CLI**
   ```bash
   vercel env add MONGODB_URI
   vercel env add MONGODB_DB_NAME
   vercel env add UPSTASH_REDIS_REST_URL
   vercel env add UPSTASH_REDIS_REST_TOKEN
   vercel env add ADMIN_PASSWORD
   ```

3. **Required Variables**
   ```
   MONGODB_URI=mongodb+srv://...
   MONGODB_DB_NAME=reputa-v3
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   ADMIN_PASSWORD=your-secure-admin-password
   NODE_ENV=production
   PROTOCOL_VERSION=3.0
   ```

## Testing the Setup

### 1. Health Check Endpoint
After deployment, test your health check:
```
https://reputa-score.vercel.app/api/health-check
```

Expected response:
```json
{
  "success": true,
  "mongodb": {
    "status": "connected",
    "latency": 150
  },
  "upstash": {
    "status": "connected", 
    "latency": 45
  },
  "uptime": 0,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### 2. Admin Portal Test
```
https://reputa-score.vercel.app/reputa-admin-portal
```

- Login with your ADMIN_PASSWORD
- Check for error alerts (should be none if setup is correct)
- Verify data loads in the dashboard

## Troubleshooting

### MongoDB Connection Issues

**Error**: `MONGODB_URI environment variable is required`
- **Solution**: Add MONGODB_URI to Vercel environment variables

**Error**: `Authentication failed`
- **Solution**: Check username/password in connection string
- Ensure IP whitelist includes Vercel's IP ranges (0.0.0.0/0 for testing)

### Upstash Redis Issues

**Error**: `Redis credentials are missing`
- **Solution**: Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN

**Error**: `Redis connection failed`
- **Solution**: Verify REST URL and token are correct
- Check Upstash database is active

### General Issues

**Error**: `Database connection timeout`
- **Solution**: Check network connectivity
- Verify firewall settings
- Ensure database clusters are running

## Security Best Practices

1. **Use Strong Passwords**
   - Generate strong passwords for MongoDB
   - Use a secure ADMIN_PASSWORD

2. **Network Access**
   - Limit MongoDB IP whitelist to Vercel's ranges
   - Use VPC peering if available

3. **Environment Variable Security**
   - Never commit .env files to git
   - Use Vercel's encrypted environment variables
   - Rotate secrets regularly

4. **Monitoring**
   - Monitor database connection logs
   - Set up alerts for connection failures
   - Check Vercel function logs for errors

## Deployment Checklist

- [ ] MongoDB Atlas cluster created and running
- [ ] Upstash Redis database created and active
- [ ] All environment variables added to Vercel
- [ ] Health check endpoint returns success
- [ ] Admin portal loads without errors
- [ ] Data displays correctly in dashboard
- [ ] Error alerts are not showing
- [ ] Auto-refresh is working (30s intervals)

## Support

If you encounter issues:

1. Check Vercel function logs
2. Verify environment variables are set correctly
3. Test database connections directly
4. Review MongoDB Atlas and Upstash dashboards

For additional help, refer to:
- [MongoDB Atlas Documentation](https://docs.mongodb.com/atlas/)
- [Upstash Documentation](https://upstash.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
