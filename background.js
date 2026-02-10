// YouTube Focus - Background Service Worker v3.1
// Added: Master on/off toggle, icon state management, enhanced monitoring

'use strict';

// Extension state tracking
const state = {
  isHealthy: true,
  lastError: null,
  errorCount: 0,
  installTime: null,
  totalToggleChanges: 0,
  extensionEnabled: true // Master toggle state
};

// Initialize on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    state.installTime = Date.now();
    
    // Set up default settings with validation
    const defaultSettings = {
      extensionEnabled: true, // Master toggle
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
      } else {
        updateIcon(true);
      }
    });
    
    // Show welcome notification
    console.log('YouTube Focus v3.1 installed successfully! 🎯');
  } else if (details.reason === 'update') {
    console.log('YouTube Focus updated to v3.1');
    // Ensure extensionEnabled setting exists for existing users
    chrome.storage.sync.get(['extensionEnabled'], (items) => {
      if (items.extensionEnabled === undefined) {
        chrome.storage.sync.set({ extensionEnabled: true }, () => {
          updateIcon(true);
        });
      }
    });
  }
});

// Update extension icon based on state
function updateIcon(enabled) {
  const iconSet = enabled ? {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
  } : {
    "16": "icon16-disabled.png",
    "48": "icon48-disabled.png",
    "128": "icon128-disabled.png"
  };
  
  chrome.action.setIcon({ path: iconSet }).catch(() => {
    // Fallback if custom disabled icons don't exist
    console.log('Using default icons');
  });
  
  // Update badge
  if (enabled) {
    chrome.action.setBadgeText({ text: '' });
  } else {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#999999' });
  }
}

// Monitor storage changes for analytics and icon updates
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    state.totalToggleChanges++;
    
    // Check if master toggle changed
    if (changes.extensionEnabled) {
      state.extensionEnabled = changes.extensionEnabled.newValue;
      updateIcon(state.extensionEnabled);
      
      // Notify all YouTube tabs about state change
      chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'masterToggleChanged',
            enabled: state.extensionEnabled
          }).catch(() => {
            // Tab might not be ready, ignore error
          });
        });
      });
    }
    
    // Validate settings integrity
    chrome.storage.sync.get(null, (items) => {
      if (chrome.runtime.lastError) {
        handleError('Storage validation error', chrome.runtime.lastError);
        return;
      }
      
      // Check for corrupted data
      const validKeys = [
        'extensionEnabled',
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
  chrome.storage.sync.get(['extensionEnabled'], (items) => {
    if (chrome.runtime.lastError) {
      handleError('Health check', chrome.runtime.lastError);
    } else {
      // Update icon to match current state
      if (items.extensionEnabled !== undefined) {
        updateIcon(items.extensionEnabled);
      }
      
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
        totalChanges: state.totalToggleChanges,
        extensionEnabled: state.extensionEnabled
      });
    } else if (request.action === 'resetHealth') {
      state.errorCount = 0;
      state.isHealthy = true;
      state.lastError = null;
      sendResponse({ success: true });
    } else if (request.action === 'updateIcon') {
      updateIcon(request.enabled);
      sendResponse({ success: true });
    }
  } catch (error) {
    handleError('Message handling', error);
    sendResponse({ error: error.message });
  }
  return true; // Keep channel open for async response
});

// Initialize icon on startup
chrome.storage.sync.get(['extensionEnabled'], (items) => {
  const enabled = items.extensionEnabled !== false; // Default to true
  state.extensionEnabled = enabled;
  updateIcon(enabled);
});

// Monitor extension unload
self.addEventListener('unload', () => {
  console.log('YouTube Focus service worker unloading');
});

console.log('YouTube Focus v3.1 background service worker initialized 🎯');
