#!/bin/bash

echo "🚀 Starting Firebase deployment with CI token..."

# Check if Firebase token is set
if [ -z "$FIREBASE_TOKEN" ]; then
    echo "❌ FIREBASE_TOKEN environment variable is not set"
    echo "Please add your Firebase CI token to Replit Secrets"
    echo "Generate token locally with: firebase login:ci"
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

echo "🚀 Deploying to Firebase using CI token..."
firebase deploy --only hosting --token "$FIREBASE_TOKEN"

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Your app is now live!"
else
    echo "❌ Deployment failed"
    exit 1
fi