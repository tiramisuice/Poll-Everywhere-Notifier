# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Poll Everywhere Notifier is a Chrome/Edge browser extension that monitors Poll Everywhere pages and sends real-time notifications when professors post new questions. The extension uses Manifest V3 architecture with a background service worker, content scripts, and a popup UI.

## Architecture

### Core Components

1. **manifest.json**
   - Manifest V3 configuration
   - Defines permissions: notifications, storage, alarms
   - Configures host permissions for `pollev.com` domains
   - Specifies content script injection and background service worker

2. **content.js** (Content Script)
   - Injected into all Poll Everywhere pages
   - Primary responsibility: detect new questions on the page
   - Detection methods:
     - **MutationObserver**: Real-time DOM change monitoring
     - **Periodic polling**: Checks every 5 seconds (configurable via `CHECK_INTERVAL`)
   - Question extraction via multiple CSS selectors (Poll Everywhere's HTML structure varies)
   - Generates question IDs using simple hash function to track uniqueness
   - Communicates with background script via `chrome.runtime.sendMessage()`

3. **background.js** (Service Worker)
   - Persistent background process (as persistent as MV3 allows)
   - Receives question updates from content script
   - Maintains `knownQuestions` array in `chrome.storage.local`
   - Compares incoming questions against known questions to detect new ones
   - Triggers browser notifications for new questions
   - Auto-cleanup: Alarm runs hourly to remove questions >24 hours old

4. **popup.html + popup.js** (Extension Popup)
   - User interface accessible via extension icon
   - Displays monitoring status (active/inactive based on current tab)
   - Shows statistics: question count, last check timestamp
   - Provides controls: test notification, clear tracked questions
   - Auto-refreshes status every 5 seconds

### Data Flow

```
Poll Everywhere Page → content.js (detects questions)
                          ↓
                    chrome.runtime.sendMessage()
                          ↓
                    background.js (checks if new)
                          ↓
                    chrome.notifications.create()
                          ↓
                    User receives notification
```

### Storage Schema

```javascript
chrome.storage.local = {
  knownQuestions: [
    {
      id: "q_12345",           // Hash of question text
      text: "Question text...", // First 200 chars
      timestamp: "ISO date",
      url: "page URL"
    }
  ],
  lastCheck: "ISO date",
  isMonitoring: boolean
}
```

## Development Commands

### Load Extension for Testing

1. Navigate to `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the project directory

### Reload Extension After Changes

- Click the reload icon on the extension card in `chrome://extensions/`
- Or use Ctrl+R on the extensions page

### Debug Content Script

- Open Developer Tools (F12) on any Poll Everywhere page
- Console messages prefixed with "Poll Everywhere Notifier"

### Debug Background Service Worker

- Go to `chrome://extensions/`
- Find extension → Click "Details"
- Click "Inspect views: service worker"

### Debug Popup

- Right-click extension icon → Inspect popup

## Common Development Tasks

### Modify Question Detection Selectors

If Poll Everywhere changes their HTML structure, update `content.js` lines 13-21:

```javascript
const questionSelectors = [
  '[data-test-id="poll-question"]',
  '.poll-question',
  // Add new selectors here
];
```

### Change Check Interval

Edit `content.js` line 7:

```javascript
const CHECK_INTERVAL = 5000; // milliseconds
```

### Customize Notifications

Modify `background.js` function `showNotification()` (lines 47-54):

```javascript
chrome.notifications.create({
  type: 'basic',
  iconUrl: 'icons/icon128.png',
  title: 'New Poll Everywhere Question!',
  message: questionData.text || 'Your professor posted a new question',
  priority: 2,
  requireInteraction: true  // Change to false for auto-dismiss
});
```

### Adjust Cleanup Interval

Edit `background.js` line 65:

```javascript
chrome.alarms.create('cleanupOldQuestions', { periodInMinutes: 60 });
```

## Key Implementation Details

### Question ID Generation

Uses a simple hash function (`hashCode()` in `content.js`) to generate unique IDs from question text. This is NOT cryptographically secure but sufficient for tracking duplicate questions.

### Why Multiple Detection Methods?

- **MutationObserver**: Catches real-time changes (fastest)
- **Periodic checks**: Backup in case observer misses changes or hasn't initialized
- **Visibility change listener**: Rechecks when user returns to tab

### Manifest V3 Service Worker Limitations

Background service workers can be terminated by the browser. The extension handles this by:
- Storing all state in `chrome.storage.local`
- Using `chrome.alarms` for periodic tasks (survives worker termination)
- Re-initializing on `chrome.runtime.onInstalled`

### Icon Files Required

The extension needs three icon sizes in the `icons/` directory:
- `icon16.png` (16×16px) - Extension menu
- `icon48.png` (48×48px) - Extension management page
- `icon128.png` (128×128px) - Chrome Web Store, notifications

These must be created manually (see `icons/README.txt`).

## Testing Strategy

1. **Manual Testing**:
   - Load extension in developer mode
   - Navigate to a Poll Everywhere page
   - Use "Test Notification" in popup to verify notification permissions
   - Monitor console for detection messages

2. **Question Detection Testing**:
   - Create a Poll Everywhere test poll
   - Post a new question while extension is running
   - Verify notification appears
   - Check popup shows updated question count

3. **Edge Cases to Test**:
   - Multiple questions posted simultaneously
   - Page refresh with existing questions
   - Tab switching (visibility change)
   - Browser restart (storage persistence)

## Troubleshooting Common Issues

### Notifications not appearing

- Check browser notification settings (OS level + browser level)
- Verify extension has notification permission in `chrome://extensions/`
- Test with popup's "Test Notification" button first

### Questions not detected

- Poll Everywhere updated their HTML → update selectors in `content.js`
- Content script failed to inject → check console for errors
- MutationObserver not initialized → check `observerActive` flag

### Service worker inactive

- Normal in MV3 - worker may terminate when idle
- Check `chrome://extensions/` → "Inspect views: service worker"
- If "Inspect" link missing, worker is dormant (will wake on events)

## Browser Compatibility

- Chrome: Full support (Manifest V3)
- Edge: Full support (Manifest V3)
- Brave: Should work (based on Chromium)
- Firefox: Requires Manifest V2 conversion (not currently supported)

## Security & Privacy

- Extension only monitors pages explicitly visited by user
- No external API calls or data transmission
- All data stored locally in browser
- No analytics or tracking
- Minimal permissions requested
