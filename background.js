// Background service worker for Poll Everywhere Notifier

console.log('🔧 Poll Everywhere Notifier: Background service worker starting...');

// Initialize storage on install
chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.set({
    knownQuestions: [],
    isMonitoring: true,
    lastCheck: null,
    notificationCount: 0
  });
  
  console.log('✅ Poll Everywhere Notifier installed and initialized');
  
  // Show welcome notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Poll Everywhere Notifier Ready!',
    message: 'Navigate to a Poll Everywhere page to start monitoring for new questions.',
    priority: 1
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Received message:', message.type, 'from tab:', sender.tab?.id);

  if (message.type === 'NEW_QUESTION_DETECTED') {
    handleNewQuestion(message.data, sender.tab);
    sendResponse({ success: true });
  } else if (message.type === 'QUESTIONS_UPDATE') {
    updateQuestionsData(message.data);
    sendResponse({ success: true });
  }

  return true; // Keep message channel open for async response
});

// Handle new question detection
async function handleNewQuestion(questionData, tab) {
  console.log('🔍 Processing new question:', questionData.text.substring(0, 50));

  try {
    const { knownQuestions = [], notificationCount = 0 } = await chrome.storage.local.get([
      'knownQuestions', 
      'notificationCount'
    ]);

    // Double-check if this is truly a new question
    const isNew = !knownQuestions.some(q => q.id === questionData.id);

    if (isNew) {
      console.log('✨ Confirmed new question! Showing notification...');

      // Add to known questions
      knownQuestions.push({
        ...questionData,
        tabId: tab?.id,
        tabUrl: tab?.url
      });

      // Update storage
      await chrome.storage.local.set({
        knownQuestions,
        lastCheck: new Date().toISOString(),
        notificationCount: notificationCount + 1
      });

      // Show notification
      await showNotification(questionData, tab);

      // Update badge to show notification count
      if (tab?.id) {
        chrome.action.setBadgeText({
          text: (notificationCount + 1).toString(),
          tabId: tab.id
        });
        chrome.action.setBadgeBackgroundColor({ color: '#ff4444' });
      }

    } else {
      console.log('⏭️ Question already known, skipping notification');
    }

  } catch (error) {
    console.error('❌ Error handling new question:', error);
  }
}

// Update questions data
async function updateQuestionsData(questionsData) {
  try {
    await chrome.storage.local.set({
      lastCheck: new Date().toISOString()
    });
    console.log('📊 Questions data updated');
  } catch (error) {
    console.error('❌ Error updating questions data:', error);
  }
}

// Show browser notification
async function showNotification(questionData, tab) {
  console.log('🔔 Creating notification for:', questionData.text.substring(0, 50));

  const notificationOptions = {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: '🚨 New Poll Everywhere Question!',
    message: questionData.text.length > 100 
      ? questionData.text.substring(0, 97) + '...'
      : questionData.text,
    priority: 2,
    requireInteraction: true,
    buttons: [
      { title: 'Open Poll' },
      { title: 'Dismiss' }
    ]
  };

  return new Promise((resolve) => {
    chrome.notifications.create(notificationOptions, (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error('❌ Notification error:', chrome.runtime.lastError);
        resolve(false);
      } else {
        console.log('✅ Notification created:', notificationId);
        
        // Store notification data for button handling
        chrome.storage.local.set({
          [`notification_${notificationId}`]: {
            questionData,
            tabId: tab?.id,
            tabUrl: tab?.url
          }
        });
        
        resolve(true);
      }
    });
  });
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  console.log('🔘 Notification button clicked:', notificationId, buttonIndex);

  const notificationData = await chrome.storage.local.get([`notification_${notificationId}`]);
  const data = notificationData[`notification_${notificationId}`];

  if (data) {
    if (buttonIndex === 0) { // Open Poll
      if (data.tabId) {
        // Switch to the tab with the poll
        chrome.tabs.update(data.tabId, { active: true });
        chrome.windows.update(data.tabId, { focused: true });
      } else if (data.tabUrl) {
        // Open new tab with the poll
        chrome.tabs.create({ url: data.tabUrl });
      }
    }
    
    // Clean up notification data
    chrome.storage.local.remove([`notification_${notificationId}`]);
  }

  // Clear the notification
  chrome.notifications.clear(notificationId);
});

// Handle notification clicks (clicking the notification itself)
chrome.notifications.onClicked.addListener(async (notificationId) => {
  console.log('🔘 Notification clicked:', notificationId);

  const notificationData = await chrome.storage.local.get([`notification_${notificationId}`]);
  const data = notificationData[`notification_${notificationId}`];

  if (data) {
    if (data.tabId) {
      // Switch to the tab with the poll
      chrome.tabs.update(data.tabId, { active: true });
      chrome.windows.update(data.tabId, { focused: true });
    } else if (data.tabUrl) {
      // Open new tab with the poll
      chrome.tabs.create({ url: data.tabUrl });
    }
    
    // Clean up notification data
    chrome.storage.local.remove([`notification_${notificationId}`]);
  }

  // Clear the notification
  chrome.notifications.clear(notificationId);
});

// Clear badge when tab becomes active
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.action.setBadgeText({ text: '', tabId: activeInfo.tabId });
});

// Periodic cleanup of old questions and notifications
chrome.alarms.create('cleanup', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'cleanup') {
    await cleanupOldData();
  }
});

// Cleanup old questions and notification data
async function cleanupOldData() {
  console.log('🧹 Running cleanup...');
  
  try {
    const storage = await chrome.storage.local.get();
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    // Keep only recent questions
    const recentQuestions = (storage.knownQuestions || []).filter(q => {
      return new Date(q.timestamp).getTime() > oneDayAgo;
    });
    
    // Clean up old notification data
    const keysToRemove = [];
    Object.keys(storage).forEach(key => {
      if (key.startsWith('notification_')) {
        keysToRemove.push(key);
      }
    });
    
    // Update storage
    await chrome.storage.local.set({ knownQuestions: recentQuestions });
    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
    }
    
    console.log(`🧹 Cleanup complete: kept ${recentQuestions.length} recent questions, removed ${keysToRemove.length} old notifications`);
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('🔄 Extension startup - clearing badges');
  chrome.action.setBadgeText({ text: '' });
});

console.log('✅ Background service worker ready');