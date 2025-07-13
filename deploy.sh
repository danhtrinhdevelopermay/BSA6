#!/bin/bash

echo "🚀 Starting Firebase deployment process..."

# Check if Firebase CLI is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Please run 'firebase login' first"
    exit 1
fi

# Check if project ID is set
if grep -q "your-project-id" .firebaserc; then
    echo "❌ Please update .firebaserc with your actual Firebase project ID"
    exit 1
fi

echo "📦 Building the application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Your app is now available at:"
    firebase hosting:channel:open live
else
    echo "❌ Deployment failed"
    exit 1
fi