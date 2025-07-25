# Task Manager App - Hostinger Deployment Guide

## 🚀 Deployment Steps

### 1. Build the Application
```bash
npm run build
```
This creates a `dist` folder with optimized production files.

### 2. Upload to Hostinger

#### Option A: Using File Manager
1. **Login to Hostinger Control Panel**
   - Go to [hpanel.hostinger.com](https://hpanel.hostinger.com)
   - Login with your credentials

2. **Access File Manager**
   - Click on "File Manager" in the left sidebar
   - Navigate to your domain's public_html folder

3. **Upload Files**
   - Upload ALL contents from the `dist` folder to `public_html`
   - Make sure to upload:
     - `index.html`
     - `.htaccess`
     - `assets/` folder (with all subfolders)

#### Option B: Using FTP/SFTP
1. **Get FTP Credentials**
   - In Hostinger Control Panel, go to "Files" → "FTP Accounts"
   - Create or use existing FTP account

2. **Connect via FTP Client**
   - Use FileZilla, WinSCP, or any FTP client
   - Connect to your domain with FTP credentials
   - Navigate to `public_html` folder

3. **Upload Files**
   - Upload all contents from `dist` folder to `public_html`

### 3. Verify Deployment
- Visit your domain: `https://yourdomain.com`
- Test all routes and functionality
- Check browser console for any errors

## 📁 File Structure After Upload
```
public_html/
├── index.html
├── .htaccess
└── assets/
    ├── css/
    ├── js/
    └── png/
```

## ⚙️ Important Configuration

### Firebase Configuration
Make sure your Firebase configuration in `src/firebase.js` is set up for production:
- Use production Firebase project
- Configure proper security rules
- Set up authentication providers

### Environment Variables
If you have any environment variables, make sure they're properly configured for production.

## 🔧 Troubleshooting

### Common Issues:

1. **404 Errors on Routes**
   - Ensure `.htaccess` file is uploaded
   - Check that mod_rewrite is enabled on Hostinger

2. **Assets Not Loading**
   - Verify all files in `assets/` folder are uploaded
   - Check file permissions (should be 644 for files, 755 for folders)

3. **Firebase Connection Issues**
   - Verify Firebase configuration
   - Check domain is added to Firebase authorized domains

4. **Performance Issues**
   - Files are already optimized by Vite build
   - `.htaccess` includes compression and caching rules

## 📞 Support
If you encounter issues:
1. Check Hostinger's knowledge base
2. Contact Hostinger support
3. Verify all files are uploaded correctly

## 🔄 Updates
To update your deployed app:
1. Make changes to your code
2. Run `npm run build` again
3. Upload the new `dist` contents to replace old files
4. Clear browser cache if needed

---
**Note:** This guide assumes you have a Hostinger hosting plan with cPanel access. The process may vary slightly depending on your specific hosting plan. 