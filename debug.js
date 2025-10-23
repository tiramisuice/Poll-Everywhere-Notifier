// Debug script for Poll Everywhere Notifier
// Run this in the browser console on a Poll Everywhere page to test selectors

console.log('🔧 Poll Everywhere Notifier Debug Tool');
console.log('=====================================');

// Test all the selectors used in the extension
function testSelectors() {
  console.log('\n🔍 Testing selectors...\n');
  
  const selectors = [
    // Main content selectors
    'main[id="main-content"]',
    '[class*="bg-participate"]',
    '[class*="participate"]',
    '[data-participate]',
    '.poll-card',
    '[role="main"]',
    
    // Specific question selectors
    '[class*="Question"]',
    '[data-cy*="question"]',
    '[data-testid*="question"]',
    '.poll-question-text',
    '.question-content',
    '[class*="poll-title"]',
    
    // Generic content selectors
    'h1', 'h2', 'h3',
    '[class*="live"]',
    '[class*="active"]',
    '[class*="current"]'
  ];
  
  selectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`✅ ${selector}: ${elements.length} elements found`);
        elements.forEach((el, i) => {
          const text = el.textContent.trim();
          if (text && text.length > 10 && text.length < 200) {
            console.log(`   ${i + 1}. "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`);
          }
        });
      } else {
        console.log(`❌ ${selector}: No elements found`);
      }
    } catch (e) {
      console.log(`⚠️  ${selector}: Invalid selector`);
    }
  });
}

// Analyze page structure
function analyzePage() {
  console.log('\n📊 Page Analysis\n');
  
  console.log('URL:', window.location.href);
  console.log('Title:', document.title);
  console.log('Total elements:', document.querySelectorAll('*').length);
  
  // Look for Poll Everywhere specific elements
  const peElements = document.querySelectorAll('[class*="poll"], [class*="Poll"], [data-cy], [data-testid]');
  console.log('Poll Everywhere elements:', peElements.length);
  
  if (peElements.length > 0) {
    console.log('Sample PE elements:');
    Array.from(peElements).slice(0, 5).forEach((el, i) => {
      console.log(`  ${i + 1}. ${el.tagName} - classes: ${el.className} - text: "${el.textContent.trim().substring(0, 50)}..."`);
    });
  }
  
  // Check for dynamic content
  const scripts = document.querySelectorAll('script[src*="polleverywhere"]');
  console.log('Poll Everywhere scripts:', scripts.length);
}

// Monitor for changes
function monitorChanges() {
  console.log('\n👀 Starting change monitor (30 seconds)...\n');
  
  let changeCount = 0;
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length > 0) {
        changeCount++;
        console.log(`Change ${changeCount}: ${mutation.addedNodes.length} nodes added to ${mutation.target.tagName}`);
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  setTimeout(() => {
    observer.disconnect();
    console.log(`\n📊 Monitoring complete: ${changeCount} changes detected`);
  }, 30000);
}

// Test question extraction (similar to extension logic)
function testQuestionExtraction() {
  console.log('\n🎯 Testing Question Extraction\n');
  
  const questions = [];
  const seenTexts = new Set();
  
  // Main content areas
  const mainSelectors = [
    'main[id="main-content"]',
    '[class*="bg-participate"]',
    '[class*="participate"]'
  ];
  
  mainSelectors.forEach(selector => {
    const containers = document.querySelectorAll(selector);
    containers.forEach(container => {
      const questionElements = container.querySelectorAll('h1, h2, h3, [class*="question"], [class*="title"]');
      
      questionElements.forEach(element => {
        const text = element.textContent.trim();
        
        if (text && 
            text.length > 10 && 
            text.length < 500 && 
            !text.toLowerCase().includes('poll everywhere') &&
            !seenTexts.has(text)) {
          
          seenTexts.add(text);
          questions.push({
            text: text,
            selector: selector,
            element: element.tagName,
            classes: element.className
          });
        }
      });
    });
  });
  
  console.log(`Found ${questions.length} potential questions:`);
  questions.forEach((q, i) => {
    console.log(`${i + 1}. "${q.text.substring(0, 80)}${q.text.length > 80 ? '...' : ''}"`);
    console.log(`   Element: ${q.element}, Selector: ${q.selector}`);
  });
}

// Run all tests
function runAllTests() {
  testSelectors();
  analyzePage();
  testQuestionExtraction();
  monitorChanges();
}

// Export functions to global scope
window.debugPE = {
  testSelectors,
  analyzePage,
  monitorChanges,
  testQuestionExtraction,
  runAllTests
};

console.log('\n🚀 Debug tools loaded!');
console.log('Available commands:');
console.log('  debugPE.testSelectors() - Test all CSS selectors');
console.log('  debugPE.analyzePage() - Analyze page structure');
console.log('  debugPE.testQuestionExtraction() - Test question detection');
console.log('  debugPE.monitorChanges() - Monitor DOM changes for 30s');
console.log('  debugPE.runAllTests() - Run all tests');
console.log('\nTo get started, run: debugPE.runAllTests()');
