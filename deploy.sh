#!/bin/bash

echo "🚀 Starting deployment process..."

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "⚠️  Warning: .env.production file not found!"
    echo "Please create .env.production with your Firebase credentials"
    echo "See ENVIRONMENT_SETUP.md for instructions"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📁 Files ready for upload:"
    echo "   - dist/index.html"
    echo "   - dist/.htaccess"
    echo "   - dist/assets/ (entire folder)"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Login to Hostinger Control Panel"
    echo "   2. Go to File Manager"
    echo "   3. Navigate to public_html"
    echo "   4. Upload all contents from the dist folder"
    echo ""
    echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi 