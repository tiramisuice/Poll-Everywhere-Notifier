# 🔄 How to Reset the Extension (Fix All Errors)

## 🚨 If you're seeing "Extension context invalidated" errors:

### **Step 1: Complete Reset**
1. **Go to Chrome Extensions:** `chrome://extensions/`
2. **Find your extension** and click the **"Remove"** button
3. **Click "Load unpacked"** again and select your extension folder
4. **Refresh the Poll Everywhere page** (F5 or Ctrl+R)

### **Step 2: Clear Extension Data**
1. **Open the extension popup** (click the icon)
2. **Click "Clear All Data"** button
3. **Confirm** when prompted
4. **Refresh the Poll Everywhere page** again

### **Step 3: Test**
1. **Click "Test Notification"** in the popup
2. **Check the popup status** - should show "✓ Monitoring Active"
3. **Look at browser console** (F12) - should see extension logs without errors

## 🔧 Alternative Quick Fix:

If you don't want to remove the extension:

1. **Go to `chrome://extensions/`**
2. **Click the refresh button** on your extension
3. **Refresh ALL Poll Everywhere tabs** you have open
4. **Test the extension** again

## ✅ What Should Happen After Reset:

- ✅ No more "Extension context invalidated" errors
- ✅ Popup shows "✓ Monitoring Active" 
- ✅ Console shows extension logs without errors
- ✅ Test notification works
- ✅ Extension detects questions properly

## 🚨 If Errors Persist:

1. **Restart Chrome completely**
2. **Try in an incognito window**
3. **Check if other extensions are interfering**
4. **Make sure you're on a real Poll Everywhere page** (not a results page)

The "Extension context invalidated" error is very common and happens when the extension is reloaded while pages are still open. A complete reset usually fixes it permanently.
