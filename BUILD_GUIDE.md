# MyBalance - Build & Deployment Guide

## Current Setup (Development Mode)

Right now you have **2 servers running**:
1. **API Server** (Port 3001) - Scrapes Metaplanet stock price
2. **Expo Server** (Port 8081) - Serves the React Native app

### Do you need to keep servers running?

**For Development (testing on browser/phone via Expo Go):** YES
- Both servers must be running on your Mac
- Your phone connects to your Mac's local network to load the app

**For Production (standalone app on phone):** NO
- You need to build a standalone app
- The API server for Metaplanet would need to be hosted somewhere (cloud server)
- OR you could switch to a different data source for Metaplanet

## Options for First Release

### Option 1: Use Expo Go App (Easiest - Development Only)
**Pros:**
- No build process needed
- Install "Expo Go" app from App Store
- Scan QR code from your Mac's terminal
- Updates instantly when you change code

**Cons:**
- Servers must stay running on your Mac
- Only works on same WiFi network
- Not a "real" standalone app

**Steps:**
1. Keep both servers running on Mac
2. Install "Expo Go" from App Store on your iPhone
3. Run `npx expo start` on Mac
4. Scan QR code with iPhone camera
5. App opens in Expo Go

### Option 2: Build Standalone App with EAS (Production Ready)
**Pros:**
- Real standalone app you can install
- Works without Mac servers (after deploying API)
- Can distribute to others or publish to App Store

**Cons:**
- Requires Expo account (free)
- Build process takes 15-30 minutes
- Metaplanet API needs to be hosted on cloud server

**Steps:**
1. Create free Expo account
2. Install EAS CLI: `npm install -g eas-cli`
3. Login: `eas login`
4. Configure: `eas build:configure`
5. Build iOS app: `eas build --platform ios`
6. Install .ipa file on phone via TestFlight or direct install

## Recommended Approach for First Release

**Quick Test (Today):**
Use Expo Go - you can test on your phone in 2 minutes!

**Production Release (Later):**
1. Deploy Metaplanet API to free cloud service (Render, Railway, or Vercel)
2. Update API URL in app code
3. Build with EAS
4. Install on phone permanently

## Cloud Hosting Options for Metaplanet API (Free Tier)

1. **Render.com** - Free tier, easy Node.js deployment
2. **Railway.app** - Free $5/month credit
3. **Fly.io** - Free tier available
4. **Vercel** - Free for hobby projects (serverless functions)

Would you like me to:
1. Help you test with Expo Go right now?
2. Set up the app for production build?
3. Help deploy the Metaplanet API to a cloud service?
