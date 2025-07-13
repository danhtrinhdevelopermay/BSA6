# Firebase Deployment Guide for StudyVibe

## 🚀 Quick Setup Instructions

### 1. Initialize Firebase Project
```bash
# Login to Firebase (run this first)
firebase login

# Initialize your project
firebase init hosting

# Select these options:
# - Configure files for Firebase Hosting
# - Set public directory to: dist
# - Configure as single-page app: Yes
# - Set up automatic builds: No
```

### 2. Update Firebase Configuration
Update `.firebaserc` with your actual Firebase project ID:
```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

### 3. Build and Deploy
```bash
# Build the application
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

## 📋 Important Notes

**This is a full-stack application** with both frontend and backend components:

- **Frontend**: React app that will be deployed to Firebase Hosting
- **Backend**: Express.js server that needs to run separately (currently on Replit)

**What this deployment does:**
- Deploys the React frontend to Firebase Hosting
- Creates a publicly accessible URL for your app
- Provides fast, global CDN delivery

**What you need to handle:**
- The backend API server needs to remain running on Replit
- You may need to update API endpoints in your frontend to point to the Replit server
- Consider using environment variables for API base URLs

## 🔧 Next Steps After Deployment

1. **Test the deployed app**: Make sure all features work correctly
2. **Update API endpoints**: If needed, configure your frontend to communicate with the Replit backend
3. **Set up custom domain**: Optional - configure a custom domain in Firebase Console

## 📱 Your App Will Be Available At:
`https://your-project-id.web.app` or `https://your-project-id.firebaseapp.com`

Need help with any of these steps? I can guide you through the process!