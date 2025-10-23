# Poll Everywhere Notifier - Troubleshooting Guide

## 🔧 Common Issues and Solutions

### ❌ "Extension context invalidated" Error

**What it means:** This error occurs when the extension is reloaded or updated while the content script is still running on a page.

**How to fix:**
1. **Refresh the Poll Everywhere page** - This is the easiest solution
2. **Reload the extension** - Go to `chrome://extensions/` and click the refresh button on your extension
3. **Restart Chrome** - If the above doesn't work

**Why it happens:** Chrome extensions can be updated/reloaded while pages are still open, causing the content script to lose connection with the extension.

### ❌ "Could not establish connection. Receiving end does not exist"

**What it means:** The popup is trying to communicate with the content script, but the content script isn't loaded or has been disconnected.

**How to fix:**
1. **Refresh the Poll Everywhere page** - This reloads the content script
2. **Check if you're on the right page** - Make sure you're on a `pollev.com` URL
3. **Reload the extension** - Go to `chrome://extensions/` and refresh the extension

### ⚠️ Extension Shows "Not on Poll Everywhere page"

**What it means:** The extension can't detect that you're on a Poll Everywhere page.

**How to fix:**
1. **Make sure you're on the right URL** - Should be `https://pollev.com/...`
2. **Refresh the page** - This reloads the content script
3. **Check the popup** - Click the extension icon to see the status

### 🔄 Too Much Console Spam

**What it means:** The extension is logging too frequently, making it hard to see other messages.

**Solution:** The extension now logs much less frequently (every 30 seconds). This is normal behavior.

### 📭 "No questions found on this page"

**What it means:** The extension is running but can't find any poll questions on the current page.

**Possible reasons:**
1. **No active questions** - The poll might not have any questions posted yet
2. **Page not fully loaded** - Wait a moment for the page to load completely
3. **Different page type** - You might be on a results page or settings page instead of an active poll

**How to fix:**
1. **Wait for questions** - Make sure your professor has posted questions
2. **Refresh the page** - Sometimes the page needs to be refreshed
3. **Check the page type** - Make sure you're on an active poll page, not results

## 🚀 Quick Fixes

### If the extension stops working:
1. **Refresh the Poll Everywhere page** (most common fix)
2. **Reload the extension** in `chrome://extensions/`
3. **Restart Chrome** (if nothing else works)

### If notifications aren't working:
1. **Check browser notification permissions** - Make sure Chrome can show notifications
2. **Test with "Test Notification"** button in the popup
3. **Check if you're on a Poll Everywhere page**

### If the popup shows wrong status:
1. **Click the refresh button** in the popup
2. **Refresh the Poll Everywhere page**
3. **Check the browser console** for error messages

## 🔍 Debugging Tips

### Check the Browser Console:
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for messages starting with 🔔 (extension logs)
4. Look for error messages in red

### Test the Extension:
1. Click "Test Notification" in the popup
2. Click "Force Check Now" to manually trigger a scan
3. Check if the extension icon shows a badge number

### Verify You're on the Right Page:
- URL should contain `pollev.com`
- Page should show an active poll (not results or settings)
- You should see poll questions or a waiting screen

## 📞 Still Having Issues?

If none of the above solutions work:

1. **Clear extension data:**
   - Click "Clear All Data" in the popup
   - Refresh the Poll Everywhere page

2. **Reinstall the extension:**
   - Remove the extension from `chrome://extensions/`
   - Reload it from your folder

3. **Check for conflicts:**
   - Disable other extensions temporarily
   - Test in an incognito window

The extension is designed to be robust and handle most common issues automatically, but sometimes a simple page refresh is all that's needed!
