# Environment Setup for Production

## Firebase Configuration

Before deploying to Hostinger, you need to set up your Firebase configuration for production:

### 1. Create Production Environment File
Create a `.env.production` file in your project root with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. Get Firebase Credentials
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. Copy the configuration values

### 3. Firebase Security Rules
Make sure your Firestore security rules are properly configured for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Add your security rules here
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Authorized Domains
In Firebase Console:
1. Go to Authentication → Settings → Authorized domains
2. Add your Hostinger domain (e.g., `yourdomain.com`)

## Build with Production Environment
After setting up the environment file:
```bash
npm run build
```

This will use the production environment variables for the build. 