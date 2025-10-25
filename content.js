// Content script for Poll Everywhere pages
// Monitors for new questions and sends notifications

console.log('🔔 Poll Everywhere Notifier: Content script loaded on', window.location.href);

// Configuration
const CHECK_INTERVAL = 10000; // Check every 10 seconds (less spammy)
let knownQuestionIds = new Set();
let isInitialized = false;
let lastLogTime = 0;
let monitoringInterval = null;
let isChecking = false; // Prevent concurrent checks
let lastNotificationTime = 0; // Track when last notification was sent

// Wait for page to be fully loaded
function waitForPageLoad() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', resolve);
    }
  });
}

// Extract questions from Poll Everywhere page
function extractQuestions() {
  const questions = [];
  const seenTexts = new Set();

  // Only log every 30 seconds to reduce spam
  const now = Date.now();
  if (now - lastLogTime > 30000) {
    console.log('🔍 Scanning for Poll Everywhere questions...');
    lastLogTime = now;
  }

  // Strategy 1: Look for main content areas that contain questions
  const mainContentSelectors = [
    'main[id="main-content"]',
    '[class*="bg-participate"]',
    '[class*="participate"]',
    '[data-participate]',
    '.poll-card',
    '[role="main"]'
  ];

  mainContentSelectors.forEach(selector => {
    try {
      const containers = document.querySelectorAll(selector);
      if (now - lastLogTime > 30000) {
        console.log(`  Checking ${containers.length} containers with selector: ${selector}`);
      }
      
      containers.forEach(container => {
        // Look for question text within these containers
        const questionElements = container.querySelectorAll('h1, h2, h3, [class*="question"], [class*="title"]');
        
        questionElements.forEach(element => {
          const text = element.textContent.trim();
          
          // Filter for actual questions (reasonable length, not navigation text)
          if (text && 
              text.length > 10 && 
              text.length < 500 && 
              !text.toLowerCase().includes('poll everywhere') &&
              !text.toLowerCase().includes('navigation') &&
              !text.toLowerCase().includes('menu') &&
              !text.toLowerCase().includes('response saved') &&
              !text.toLowerCase().includes('response recorded') &&
              !text.toLowerCase().includes('you chose') &&
              !text.toLowerCase().includes('dismiss') &&
              !text.toLowerCase().includes('open poll') &&
              !text.toLowerCase().includes('poll everywhere notifier') &&
              !text.toLowerCase().includes('join presentation') &&
              !text.toLowerCase().includes('presenter\'s username') &&
              !text.toLowerCase().includes('recent presentations') &&
              !text.toLowerCase().includes('enter your response') &&
              !text.toLowerCase().includes('loading') &&
              !text.toLowerCase().includes('please wait') &&
              !seenTexts.has(text)) {
            
            seenTexts.add(text);
            const questionId = generateQuestionId(text, window.location.href);
            
            questions.push({
              id: questionId,
              text: text,
              timestamp: new Date().toISOString(),
              url: window.location.href,
              selector: selector,
              element: element.tagName
            });
            
            console.log(`  ✓ Found potential question: "${text.substring(0, 60)}..."`);
          }
        });
      });
    } catch (e) {
      console.warn(`Selector error for ${selector}:`, e);
    }
  });

  // Strategy 2: Look for specific Poll Everywhere question patterns
  // Based on the page structure visible in your screenshots
  const specificSelectors = [
    '[class*="Question"]',
    '[data-cy*="question"]',
    '[data-testid*="question"]',
    '.poll-question-text',
    '.question-content',
    '[class*="poll-title"]'
  ];

  specificSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0 && now - lastLogTime > 30000) {
        console.log(`  Found ${elements.length} elements with selector: ${selector}`);
      }
      
      elements.forEach(element => {
        const text = element.textContent.trim();
        
        if (text && 
            text.length > 5 && 
            text.length < 1000 && 
            !text.toLowerCase().includes('response saved') &&
            !text.toLowerCase().includes('response recorded') &&
            !text.toLowerCase().includes('you chose') &&
            !text.toLowerCase().includes('dismiss') &&
            !text.toLowerCase().includes('open poll') &&
            !text.toLowerCase().includes('poll everywhere notifier') &&
            !text.toLowerCase().includes('join presentation') &&
            !text.toLowerCase().includes('presenter\'s username') &&
            !text.toLowerCase().includes('recent presentations') &&
            !text.toLowerCase().includes('enter your response') &&
            !text.toLowerCase().includes('loading') &&
            !text.toLowerCase().includes('please wait') &&
            !seenTexts.has(text)) {
          seenTexts.add(text);
          const questionId = generateQuestionId(text, window.location.href);
          
          questions.push({
            id: questionId,
            text: text,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            selector: selector,
            element: element.tagName
          });
          
          console.log(`  ✓ Found specific question: "${text.substring(0, 60)}..."`);
        }
      });
    } catch (e) {
      console.warn(`Selector error for ${selector}:`, e);
    }
  });

  // Strategy 3: Look for actual poll question content
  // Check for elements that contain real poll questions (not navigation)
  const questionContainers = document.querySelectorAll('[class*="question"], [class*="poll"], [class*="response"], [class*="statement"]');
  questionContainers.forEach(element => {
    const text = element.textContent.trim();
    
    // Filter out navigation and UI elements
    if (text && 
        text.length > 20 && 
        text.length < 500 && 
        !seenTexts.has(text) &&
        !text.toLowerCase().includes('skip to') &&
        !text.toLowerCase().includes('navigation') &&
        !text.toLowerCase().includes('menu') &&
        !text.toLowerCase().includes('response saved') &&
        !text.toLowerCase().includes('response recorded') &&
        !text.toLowerCase().includes('you chose') &&
        !text.toLowerCase().includes('dismiss') &&
        !text.toLowerCase().includes('open poll') &&
        !text.toLowerCase().includes('poll everywhere notifier') &&
        !text.toLowerCase().includes('join presentation') &&
        !text.toLowerCase().includes('presenter\'s username') &&
        !text.toLowerCase().includes('recent presentations') &&
        !text.toLowerCase().includes('enter your response') &&
        !text.toLowerCase().includes('loading') &&
        !text.toLowerCase().includes('please wait') &&
        !text.toLowerCase().includes('recorded') &&
        !text.toLowerCase().includes('participate') &&
        // Look for actual question-like content
        (text.includes('?') || 
         text.toLowerCase().includes('which') ||
         text.toLowerCase().includes('what') ||
         text.toLowerCase().includes('how') ||
         text.toLowerCase().includes('when') ||
         text.toLowerCase().includes('where') ||
         text.toLowerCase().includes('why') ||
         text.toLowerCase().includes('statements about') ||
         text.toLowerCase().includes('read the following'))) {
      
      seenTexts.add(text);
      const questionId = generateQuestionId(text, window.location.href);
      
      questions.push({
        id: questionId,
        text: text,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        selector: 'question-container',
        element: element.tagName
      });
      
      console.log(`  ✓ Found poll question: "${text.substring(0, 60)}..."`);
    }
  });

  if (now - lastLogTime > 30000) {
    console.log(`📊 Total questions extracted: ${questions.length}`);
  }
  return questions;
}

// Generate consistent question ID
function generateQuestionId(text, url) {
  // Create a hash based on question text and URL path
  const urlPath = new URL(url).pathname;
  const combined = text.toLowerCase().replace(/\s+/g, ' ').trim() + '|' + urlPath;
  
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return 'pe_' + Math.abs(hash).toString(36);
}

// Check if extension context is still valid
function isExtensionContextValid() {
  try {
    return chrome.runtime && chrome.runtime.id;
  } catch (e) {
    return false;
  }
}

// Check if notifications are enabled
async function areNotificationsEnabled() {
  try {
    if (!isExtensionContextValid()) {
      return false;
    }
    
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

// Stop monitoring when extension context is invalidated
function stopMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
  console.log('🛑 Monitoring stopped due to extension context invalidation');
}

// Check for new questions
async function checkForNewQuestions() {
  // Prevent concurrent checks
  if (isChecking) {
    console.log('⏳ Check already in progress, skipping...');
    return;
  }

  // Check if extension context is still valid
  if (!isExtensionContextValid()) {
    console.log('🔄 Extension context invalidated, stopping monitoring');
    stopMonitoring();
    return;
  }

  isChecking = true;

  try {
    const currentQuestions = extractQuestions();
    
    if (!isInitialized) {
      // First run - load known questions from storage
      try {
        const result = await chrome.storage.local.get(['knownQuestions']);
        if (result.knownQuestions) {
          result.knownQuestions.forEach(q => knownQuestionIds.add(q.id));
          console.log(`📚 Loaded ${knownQuestionIds.size} known questions from storage`);
        }
        isInitialized = true;
      } catch (error) {
        console.warn('⚠️ Could not load storage, starting fresh:', error);
        isInitialized = true;
      }
    }

    // Find new questions
    const newQuestions = currentQuestions.filter(q => !knownQuestionIds.has(q.id));
    
    if (newQuestions.length > 0) {
      console.log('🎯 NEW QUESTION(S) DETECTED!', newQuestions.length);
      
      // Rate limiting: Don't send notifications too frequently
      const now = Date.now();
      const timeSinceLastNotification = now - lastNotificationTime;
      const minTimeBetweenNotifications = 5000; // 5 seconds minimum between notifications
      
      if (timeSinceLastNotification < minTimeBetweenNotifications) {
        console.log(`⏰ Rate limiting: ${minTimeBetweenNotifications - timeSinceLastNotification}ms until next notification allowed`);
        // Still add to known questions to prevent spam, but don't notify
        newQuestions.forEach(question => {
          knownQuestionIds.add(question.id);
        });
      } else {
        // Check if notifications are enabled before sending
        const notificationsEnabled = await areNotificationsEnabled();
        
        if (!notificationsEnabled) {
          console.log('🔕 Notifications disabled, adding questions to known list without notifying');
          // Still add to known questions to prevent spam, but don't notify
          newQuestions.forEach(question => {
            knownQuestionIds.add(question.id);
          });
        } else {
          // Send each new question to background script
          for (const question of newQuestions) {
            console.log('📤 Sending notification for:', question.text.substring(0, 50));
            
            try {
              if (isExtensionContextValid()) {
                await chrome.runtime.sendMessage({
                  type: 'NEW_QUESTION_DETECTED',
                  data: question
                });
                
                // Add to known questions
                knownQuestionIds.add(question.id);
                lastNotificationTime = now;
                console.log('✅ Question processed successfully');
              } else {
                console.log('⚠️ Extension context invalid, skipping message send');
              }
            } catch (error) {
              if (error.message.includes('Extension context invalidated')) {
                console.log('🔄 Extension context invalidated, stopping monitoring');
                stopMonitoring();
                return;
              }
              console.error('❌ Failed to send message:', error);
            }
          }
        }
      }
    } else if (currentQuestions.length > 0) {
      if (Date.now() - lastLogTime > 30000) {
        console.log(`⏭️ No new questions (${currentQuestions.length} total found)`);
      }
    } else {
      if (Date.now() - lastLogTime > 30000) {
        console.log('📭 No questions found on this page');
      }
    }

    // Update storage with current questions
    if (currentQuestions.length > 0 && isExtensionContextValid()) {
      try {
        await chrome.storage.local.set({
          knownQuestions: Array.from(knownQuestionIds).map(id => {
            const question = currentQuestions.find(q => q.id === id);
            return question || { id, text: 'Unknown', timestamp: new Date().toISOString() };
          }),
          lastCheck: new Date().toISOString()
        });
      } catch (error) {
        if (error.message.includes('Extension context invalidated')) {
          console.log('🔄 Extension context invalidated, stopping monitoring');
          stopMonitoring();
          return;
        }
        console.warn('⚠️ Could not update storage:', error);
      }
    }

  } catch (error) {
    if (error.message.includes('Extension context invalidated')) {
      console.log('🔄 Extension context invalidated, stopping monitoring');
      stopMonitoring();
      return;
    }
    console.error('❌ Error in checkForNewQuestions:', error);
  } finally {
    isChecking = false;
  }
}

// Set up mutation observer for dynamic content
function setupMutationObserver() {
  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    
    mutations.forEach(mutation => {
      // Check if new nodes were added
      if (mutation.addedNodes.length > 0) {
        // Look for significant content changes
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node;
            // Check if the added element might contain questions
            if (element.textContent && element.textContent.length > 20) {
              shouldCheck = true;
            }
          }
        });
      }
    });
    
    if (shouldCheck) {
      console.log('🔄 DOM changed, checking for new questions...');
      // Longer debounce to prevent spam from rapid DOM changes
      setTimeout(() => {
        // Only check if enough time has passed since last notification
        const now = Date.now();
        const timeSinceLastNotification = now - lastNotificationTime;
        const minTimeBetweenChecks = 3000; // 3 seconds minimum between DOM-triggered checks
        
        if (timeSinceLastNotification > minTimeBetweenChecks) {
          checkForNewQuestions();
        } else {
          console.log('⏰ Skipping DOM-triggered check - too soon since last notification');
        }
      }, 2000); // Longer debounce
    }
  });

  // Observe the main content area
  const mainContent = document.querySelector('main, body');
  if (mainContent) {
    observer.observe(mainContent, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
    console.log('👀 Mutation observer active');
  }
}

// Initialize the extension
async function initialize() {
  console.log('🚀 Poll Everywhere Notifier: Initializing...');
  
  // Check if extension context is valid before starting
  if (!isExtensionContextValid()) {
    console.log('❌ Extension context invalid, cannot initialize');
    return;
  }
  
  // Wait for page to be fully loaded
  await waitForPageLoad();
  
  // Initial delay to let dynamic content load
  setTimeout(async () => {
    // Check context again before starting monitoring
    if (!isExtensionContextValid()) {
      console.log('❌ Extension context invalid during initialization, aborting');
      return;
    }
    
    console.log('⏰ Running initial check...');
    await checkForNewQuestions();
    
    // Set up periodic checks
    monitoringInterval = setInterval(() => {
      if (!isExtensionContextValid()) {
        console.log('🔄 Extension context invalidated, stopping monitoring interval');
        clearInterval(monitoringInterval);
        return;
      }
      checkForNewQuestions();
    }, CHECK_INTERVAL);
    
    // Set up mutation observer
    setupMutationObserver();
    
    console.log('✅ Initialization complete');
  }, 3000);
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && isInitialized) {
    console.log('👀 Page became visible, checking for questions...');
    // Don't check immediately when switching to tab to prevent spam notifications
    // Only check if enough time has passed since last notification
    const now = Date.now();
    const timeSinceLastNotification = now - lastNotificationTime;
    const minTimeBetweenChecks = 10000; // 10 seconds minimum between checks when switching tabs
    
    if (timeSinceLastNotification > minTimeBetweenChecks) {
      setTimeout(checkForNewQuestions, 2000); // Longer delay when switching tabs
    } else {
      console.log('⏰ Skipping check on tab switch - too soon since last notification');
    }
  }
});

// Handle URL changes (for single-page apps)
let lastUrl = window.location.href;
setInterval(() => {
  if (window.location.href !== lastUrl) {
    console.log('🔄 URL changed, resetting and checking...');
    lastUrl = window.location.href;
    // Don't clear known questions on URL change, just check for new ones
    setTimeout(checkForNewQuestions, 2000);
  }
}, 2000);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    console.log('📨 Content script received message:', message.type);
    
    if (message.type === 'PING') {
      console.log('🏓 Responding to PING');
      sendResponse({ status: 'active', url: window.location.href });
      return true;
    } else if (message.type === 'FORCE_CHECK') {
      console.log('🔄 Force check requested');
      checkForNewQuestions();
      sendResponse({ success: true });
      return true;
    }
  } catch (error) {
    console.error('❌ Error handling message:', error);
    sendResponse({ error: error.message });
    return true;
  }
});

// Start the extension only if context is valid
if (isExtensionContextValid()) {
  initialize();
} else {
  console.log('❌ Extension context invalid, cannot start monitoring');
}