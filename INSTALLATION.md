# Poll Everywhere Notifier - Installation Guide

## 🚀 Quick Setup

### 1. Load the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top right)
3. Click **"Load unpacked"**
4. Select your extension folder (`pollEveryWhere Bot`)

### 2. Test the Extension
1. Navigate to a Poll Everywhere page (like `https://pollev.com/your-poll-code`)
2. Click the extension icon in your browser toolbar
3. The popup should show:
   - ✅ **"Monitoring Active"** (green status)
   - Question count and last check time
   - Recent questions history

### 3. Verify It's Working
1. Click **"Test Notification"** to verify notifications work
2. Check the browser console (F12) for extension logs
3. The extension will automatically detect new questions

## 🔧 Troubleshooting

### Extension Shows "Not on Poll Everywhere page"
- **Solution**: Refresh the Poll Everywhere page after installing the extension
- **Check**: Make sure you're on a `pollev.com` URL

### No Questions Being Detected
1. Open browser console (F12)
2. Look for extension logs starting with 🔔
3. If you see "No questions found", the page might not have active questions yet

### Notifications Not Working
1. Check if browser notifications are enabled for Chrome
2. Click "Test Notification" in the popup
3. Make sure the extension has notification permissions

### Too Much Console Spam
- The extension now logs less frequently (every 30 seconds)
- You can ignore the repeated scanning messages - this is normal

## 🎯 How It Works

The extension:
1. **Monitors** Poll Everywhere pages for new content
2. **Detects** actual poll questions (not navigation elements)
3. **Sends** notifications when new questions appear
4. **Tracks** questions to avoid duplicate notifications

## 📱 Features

- ✅ Real-time question detection
- ✅ Browser notifications with click-to-open
- ✅ Question history tracking
- ✅ Badge counter on extension icon
- ✅ Auto-cleanup of old questions

## 🆘 Need Help?

If you're still having issues:
1. Check the browser console for error messages
2. Try refreshing the Poll Everywhere page
3. Make sure you're on an active poll page (not just the homepage)
4. Test with the "Force Check Now" button in the popup

The extension is designed to work with Poll Everywhere's dynamic content loading, so it should detect questions as they appear in real-time!
