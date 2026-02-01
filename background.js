// YouTube Focus - Background Service Worker
// Advanced error monitoring, health checks, and performance tracking

'use strict';

// Extension state tracking
const state = {
  isHealthy: true,
  lastError: null,
  errorCount: 0,
  installTime: null,
  totalToggleChanges: 0
};

// Initialize on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    state.installTime = Date.now();
    
    // Set up default settings with validation
    const defaultSettings = {
      hideRecommendedVideos: true,
      hideComments: true,
      hideSidebar: true,
      hideEndScreenVideos: true,
      hideHomeFeed: true,
      hideShorts: true,
      hideNotifications: true,
      hideSearchSuggestions: false
    };
    
    chrome.storage.sync.set(defaultSettings, () => {
      if (chrome.runtime.lastError) {
        console.error('YouTube Focus: Installation error', chrome.runtime.lastError);
      }
    });
    
    // Show welcome notification (non-intrusive)
    console.log('YouTube Focus installed successfully! 🎯');
  } else if (details.reason === 'update') {
    console.log('YouTube Focus updated to v3.0');
  }
});

// Monitor storage changes for analytics
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    state.totalToggleChanges++;
    
    // Validate settings integrity
    chrome.storage.sync.get(null, (items) => {
      if (chrome.runtime.lastError) {
        handleError('Storage validation error', chrome.runtime.lastError);
        return;
      }
      
      // Check for corrupted data
      const validKeys = [
        'hideRecommendedVideos',
        'hideComments', 
        'hideSidebar',
        'hideEndScreenVideos',
        'hideHomeFeed',
        'hideShorts',
        'hideNotifications',
        'hideSearchSuggestions'
      ];
      
      for (const key in items) {
        if (!validKeys.includes(key)) {
          console.warn(`YouTube Focus: Unknown setting detected: ${key}`);
        }
        if (typeof items[key] !== 'boolean') {
          console.warn(`YouTube Focus: Invalid type for ${key}: ${typeof items[key]}`);
        }
      }
    });
  }
});

// Error handling system
function handleError(context, error) {
  state.errorCount++;
  state.lastError = {
    context,
    error: error.message || error.toString(),
    timestamp: Date.now()
  };
  
  console.error(`YouTube Focus Error [${context}]:`, error);
  
  // If too many errors, mark as unhealthy
  if (state.errorCount > 10) {
    state.isHealthy = false;
    console.warn('YouTube Focus: Extension health degraded');
  }
}

// Periodic health check
setInterval(() => {
  chrome.storage.sync.get(null, (items) => {
    if (chrome.runtime.lastError) {
      handleError('Health check', chrome.runtime.lastError);
    } else {
      // Reset error count if storage is working
      if (state.errorCount > 0) {
        state.errorCount = Math.max(0, state.errorCount - 1);
      }
      
      // Restore health if errors cleared
      if (state.errorCount === 0) {
        state.isHealthy = true;
      }
    }
  });
}, 60000); // Check every minute

// Message handling for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === 'getHealth') {
      sendResponse({
        healthy: state.isHealthy,
        errorCount: state.errorCount,
        lastError: state.lastError,
        uptime: state.installTime ? Date.now() - state.installTime : 0,
        totalChanges: state.totalToggleChanges
      });
    } else if (request.action === 'resetHealth') {
      state.errorCount = 0;
      state.isHealthy = true;
      state.lastError = null;
      sendResponse({ success: true });
    }
  } catch (error) {
    handleError('Message handling', error);
    sendResponse({ error: error.message });
  }
  return true; // Keep channel open for async response
});

// Monitor extension unload
self.addEventListener('unload', () => {
  console.log('YouTube Focus service worker unloading');
});

console.log('YouTube Focus v3.0 background service worker initialized 🎯');
