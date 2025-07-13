# Firebase Deployment Setup for Replit

## 🔑 Authentication Method for Replit

Since regular Firebase login doesn't work in Replit, we'll use a Firebase CI token:

### Step 1: Get Firebase CI Token

On your local computer (not in Replit):

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Generate CI Token**:
   ```bash
   firebase login:ci
   ```
   
   This will generate a token that looks like:
   ```
   1//03_some_long_token_string_here
   ```

### Step 2: Set Up Token in Replit

1. **Add the token as a secret** in your Replit project:
   - Go to Replit Secrets (lock icon in sidebar)
   - Add new secret: `FIREBASE_TOKEN`
   - Value: Your CI token from Step 1

2. **Update Firebase project ID**:
   - Edit `.firebaserc` file
   - Replace `"your-project-id"` with your actual Firebase project ID

### Step 3: Deploy Using Token

Once you have the token set up, use this command:

```bash
firebase deploy --only hosting --token "$FIREBASE_TOKEN"
```

## 🚀 Quick Deploy Script

I've created an updated deployment script that uses the token method:

```bash
./deploy-with-token.sh
```

## 📋 What You Need:

1. **Firebase Project**: Create one at https://console.firebase.google.com
2. **Firebase CLI Token**: Generated from your local machine
3. **Project ID**: From your Firebase console

## 🔧 Alternative: Manual Build & Upload

If token method doesn't work, you can:

1. **Build locally**:
   ```bash
   npm run build
   ```

2. **Download the `dist` folder**

3. **Upload manually** to Firebase Console → Hosting → Deploy

Would you like me to help you set up the Firebase CI token method?