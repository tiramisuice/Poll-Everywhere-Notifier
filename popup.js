// Popup script for Poll Everywhere Notifier

document.addEventListener('DOMContentLoaded', async () => {
  await updateStatus();
  await loadQuestionHistory();
  await checkNotificationPermission();

  // Set up event listeners
  document.getElementById('testNotification').addEventListener('click', testNotification);
  document.getElementById('clearData').addEventListener('click', clearData);
  document.getElementById('refreshStatus').addEventListener('click', updateStatus);
  
  // Add notification permission button if it exists
  const enableNotificationsBtn = document.getElementById('enableNotifications');
  if (enableNotificationsBtn) {
    enableNotificationsBtn.addEventListener('click', enableNotifications);
  }
  
  // Add notification status check button if it exists
  const checkStatusBtn = document.getElementById('checkNotificationStatus');
  if (checkStatusBtn) {
    checkStatusBtn.addEventListener('click', checkNotificationStatus);
  }
});

// Update the status display
async function updateStatus() {
  try {
    const { knownQuestions, lastCheck, notificationCount } = await chrome.storage.local.get([
      'knownQuestions',
      'lastCheck',
      'notificationCount'
    ]);

    const statusDiv = document.getElementById('status');
    const statusText = document.getElementById('statusText');
    const questionCount = document.getElementById('questionCount');
    const notificationCountElement = document.getElementById('notificationCount');
    const lastCheckElement = document.getElementById('lastCheck');

    // Update question count
    questionCount.textContent = knownQuestions ? knownQuestions.length : 0;
    
    // Update notification count
    notificationCountElement.textContent = notificationCount || 0;

    // Update last check time
    if (lastCheck) {
      const checkTime = new Date(lastCheck);
      const now = new Date();
      const diffMinutes = Math.floor((now - checkTime) / 60000);

      if (diffMinutes < 1) {
        lastCheckElement.textContent = 'Just now';
      } else if (diffMinutes < 60) {
        lastCheckElement.textContent = `${diffMinutes}m ago`;
      } else {
        const diffHours = Math.floor(diffMinutes / 60);
        lastCheckElement.textContent = `${diffHours}h ago`;
      }
    } else {
      lastCheckElement.textContent = 'Never';
    }

    // Check if we're on a Poll Everywhere page
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];

    if (currentTab && currentTab.url && currentTab.url.includes('pollev.com')) {
      statusDiv.className = 'status active';
      statusText.textContent = '✓ Monitoring Active';
      
      // Try to inject content script if needed
      try {
        await chrome.tabs.sendMessage(currentTab.id, { type: 'PING' });
      } catch (error) {
        // Content script not loaded or extension context invalidated
        if (error.message.includes('Receiving end does not exist') || 
            error.message.includes('Extension context invalidated')) {
          statusDiv.className = 'status warning';
          statusText.textContent = '⚠ Refresh page to activate monitoring';
        } else {
          console.warn('PING error:', error);
        }
      }
    } else {
      statusDiv.className = 'status inactive';
      statusText.textContent = '⚠ Not on Poll Everywhere page';
    }

  } catch (error) {
    console.error('Error updating status:', error);
    document.getElementById('statusText').textContent = '❌ Error loading status';
  }
}

// Load and display question history
async function loadQuestionHistory() {
  try {
    const { knownQuestions } = await chrome.storage.local.get(['knownQuestions']);
    const historyDiv = document.getElementById('questionHistory');
    
    if (!knownQuestions || knownQuestions.length === 0) {
      historyDiv.innerHTML = '<div class="no-questions">No questions detected yet</div>';
      return;
    }

    // Sort questions by timestamp (newest first)
    const sortedQuestions = knownQuestions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5); // Show only last 5 questions

    historyDiv.innerHTML = sortedQuestions.map(question => {
      const time = new Date(question.timestamp).toLocaleTimeString();
      const shortText = question.text.length > 80 
        ? question.text.substring(0, 77) + '...'
        : question.text;
      
      return `
        <div class="question-item">
          <div class="question-text">${shortText}</div>
          <div class="question-time">${time}</div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading question history:', error);
    document.getElementById('questionHistory').innerHTML = '<div class="error">Error loading history</div>';
  }
}

// Check notification permission and update UI
async function checkNotificationPermission() {
  try {
    const hasPermission = await new Promise((resolve) => {
      chrome.notifications.getPermissionLevel((level) => {
        resolve(level === 'granted');
      });
    });

    const permissionDiv = document.getElementById('notificationPermission');
    const enableBtn = document.getElementById('enableNotifications');
    
    if (permissionDiv) {
      if (hasPermission) {
        permissionDiv.className = 'permission granted';
        permissionDiv.innerHTML = '✅ Notifications enabled';
        if (enableBtn) enableBtn.style.display = 'none';
      } else {
        permissionDiv.className = 'permission denied';
        permissionDiv.innerHTML = '⚠️ Notifications disabled';
        if (enableBtn) enableBtn.style.display = 'block';
      }
    }

    // Return the permission status for other functions to use
    return hasPermission;
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return false;
  }
}

// Check if notifications are enabled (public function)
async function areNotificationsEnabled() {
  try {
    const hasPermission = await new Promise((resolve) => {
      chrome.notifications.getPermissionLevel((level) => {
        resolve(level === 'granted');
      });
    });
    return hasPermission;
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return false;
  }
}

// Check notification status and show detailed info
async function checkNotificationStatus() {
  const button = document.getElementById('checkNotificationStatus');
  const originalText = button.textContent;
  
  button.textContent = 'Checking...';
  button.disabled = true;

  try {
    const hasPermission = await areNotificationsEnabled();
    
    if (hasPermission) {
      button.textContent = '✅ Enabled';
      button.style.backgroundColor = '#28a745';
      
      // Show a test notification to confirm it works
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '🔔 Notification Status Check',
        message: 'Notifications are working correctly!',
        priority: 1
      });
    } else {
      button.textContent = '❌ Disabled';
      button.style.backgroundColor = '#dc3545';
    }
    
    // Update the permission display
    await checkNotificationPermission();
    
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
      button.style.backgroundColor = ''; // Reset to default
    }, 3000);
    
  } catch (error) {
    console.error('Error checking notification status:', error);
    button.textContent = '❌ Error';
    button.style.backgroundColor = '#dc3545';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
      button.style.backgroundColor = '';
    }, 3000);
  }
}

// Enable notifications
async function enableNotifications() {
  const button = document.getElementById('enableNotifications');
  const originalText = button.textContent;
  
  button.textContent = 'Requesting...';
  button.disabled = true;

  try {
    // Try to create a notification to trigger permission request
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Poll Everywhere Notifier',
      message: 'Please allow notifications to receive alerts for new questions.',
      priority: 1
    });
    
    button.textContent = '✓ Permission requested!';
    setTimeout(async () => {
      await checkNotificationPermission();
      button.textContent = originalText;
      button.disabled = false;
    }, 2000);
    
  } catch (error) {
    console.error('Enable notifications error:', error);
    button.textContent = '❌ Failed';
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 2000);
  }
}

// Test notification
async function testNotification() {
  const button = document.getElementById('testNotification');
  const originalText = button.textContent;
  
  button.textContent = 'Sending...';
  button.disabled = true;

  try {
    // Check permission first
    const hasPermission = await new Promise((resolve) => {
      chrome.notifications.getPermissionLevel((level) => {
        resolve(level === 'granted');
      });
    });

    if (!hasPermission) {
      button.textContent = '❌ Notifications disabled';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
      return;
    }

    await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '🧪 Test Notification',
      message: 'This is how you\'ll be notified when a new question is posted!',
      priority: 2,
      requireInteraction: false // Changed for better macOS compatibility
    });
    
    button.textContent = '✓ Sent!';
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 2000);
    
  } catch (error) {
    console.error('Test notification error:', error);
    button.textContent = '❌ Failed';
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 2000);
  }
}

// Clear tracked questions
async function clearData() {
  if (confirm('Are you sure you want to clear all tracked questions? This will reset the extension.')) {
    try {
      await chrome.storage.local.set({
        knownQuestions: [],
        lastCheck: null,
        notificationCount: 0
      });

      await updateStatus();
      await loadQuestionHistory();

      // Clear badge
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        chrome.action.setBadgeText({ text: '', tabId: tabs[0].id });
      }

      alert('All tracked questions have been cleared!');
      
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Error clearing data. Please try again.');
    }
  }
}

// Force check for questions on current tab
async function forceCheck() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    
    if (currentTab && currentTab.url && currentTab.url.includes('pollev.com')) {
      try {
        await chrome.tabs.sendMessage(currentTab.id, { type: 'FORCE_CHECK' });
        
        setTimeout(async () => {
          await updateStatus();
          await loadQuestionHistory();
        }, 1000);
        
      } catch (error) {
        if (error.message.includes('Receiving end does not exist') || 
            error.message.includes('Extension context invalidated')) {
          alert('Extension needs to be refreshed. Please refresh the Poll Everywhere page.');
        } else {
          throw error;
        }
      }
    } else {
      alert('Please navigate to a Poll Everywhere page first.');
    }
  } catch (error) {
    console.error('Error forcing check:', error);
    alert('Error: Make sure you\'re on a Poll Everywhere page and refresh if needed.');
  }
}

// Add force check button listener
document.addEventListener('DOMContentLoaded', () => {
  const forceCheckBtn = document.getElementById('forceCheck');
  if (forceCheckBtn) {
    forceCheckBtn.addEventListener('click', forceCheck);
  }
});

// Refresh status and history every 10 seconds
setInterval(async () => {
  await updateStatus();
  await loadQuestionHistory();
}, 10000);