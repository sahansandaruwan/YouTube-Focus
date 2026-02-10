// YouTube Focus - Advanced Content Script v3.1
// Added: Master on/off toggle, dynamic enable/disable, enhanced state management

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    DEBOUNCE_DELAY: 100,
    OBSERVER_THROTTLE: 300,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    PERFORMANCE_SAMPLE_RATE: 0.1
  };

  // Default settings with validation
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

  // State management
  let settings = { ...defaultSettings };
  let isApplying = false;
  let applyTimeout = null;
  let lastUrl = location.href;
  let retryCount = 0;
  let performanceMetrics = {
    applyCount: 0,
    totalTime: 0,
    errors: 0
  };
  let extensionEnabled = true;

  // Advanced debounced apply with retry logic
  function scheduleApply() {
    if (applyTimeout) {
      clearTimeout(applyTimeout);
    }
    applyTimeout = setTimeout(() => {
      applySettings();
    }, CONFIG.DEBOUNCE_DELAY);
  }

  // Validate settings object
  function validateSettings(settingsObj) {
    const validKeys = Object.keys(defaultSettings);
    const validated = {};
    
    for (const key of validKeys) {
      if (key in settingsObj && typeof settingsObj[key] === 'boolean') {
        validated[key] = settingsObj[key];
      } else {
        validated[key] = defaultSettings[key];
      }
    }
    
    return validated;
  }

  // Remove all extension classes
  function removeAllClasses() {
    const html = document.documentElement;
    if (!html) return;

    const classes = [
      'yf-hide-recommended',
      'yf-hide-comments',
      'yf-hide-sidebar',
      'yf-hide-endscreen',
      'yf-hide-home',
      'yf-hide-shorts',
      'yf-hide-notifications',
      'yf-hide-search-suggestions'
    ];

    classes.forEach(className => {
      html.classList.remove(className);
    });
  }

  // Performance-monitored settings application with error recovery
  function applySettings() {
    if (isApplying) return;
    isApplying = true;

    const startTime = performance.now();
    const shouldMeasure = Math.random() < CONFIG.PERFORMANCE_SAMPLE_RATE;

    try {
      requestAnimationFrame(() => {
        try {
          const html = document.documentElement;
          if (!html) {
            throw new Error('Document element not available');
          }

          // Validate settings before applying
          settings = validateSettings(settings);

          // Check if extension is enabled
          if (!extensionEnabled || !settings.extensionEnabled) {
            // Remove all classes when disabled
            removeAllClasses();
            isApplying = false;
            return;
          }

          // Batch all class changes for optimal performance
          const classes = {
            'yf-hide-recommended': settings.hideRecommendedVideos,
            'yf-hide-comments': settings.hideComments,
            'yf-hide-sidebar': settings.hideSidebar,
            'yf-hide-endscreen': settings.hideEndScreenVideos,
            'yf-hide-home': settings.hideHomeFeed,
            'yf-hide-shorts': settings.hideShorts,
            'yf-hide-notifications': settings.hideNotifications,
            'yf-hide-search-suggestions': settings.hideSearchSuggestions
          };

          // Apply all changes atomically
          for (const [className, shouldAdd] of Object.entries(classes)) {
            html.classList.toggle(className, shouldAdd);
          }

          // Track performance
          if (shouldMeasure) {
            const duration = performance.now() - startTime;
            performanceMetrics.applyCount++;
            performanceMetrics.totalTime += duration;
            
            if (duration > 16) {
              console.warn(`YouTube Focus: Slow apply (${duration.toFixed(2)}ms)`);
            }
          }

          // Reset retry count on success
          retryCount = 0;

        } catch (innerError) {
          handleApplyError(innerError);
        } finally {
          isApplying = false;
        }
      });
    } catch (error) {
      handleApplyError(error);
      isApplying = false;
    }
  }

  // Error recovery system
  function handleApplyError(error) {
    performanceMetrics.errors++;
    console.error('YouTube Focus: Apply error', error);

    if (retryCount < CONFIG.MAX_RETRIES) {
      retryCount++;
      console.log(`YouTube Focus: Retrying (${retryCount}/${CONFIG.MAX_RETRIES})`);
      
      setTimeout(() => {
        isApplying = false;
        applySettings();
      }, CONFIG.RETRY_DELAY * retryCount);
    } else {
      console.error('YouTube Focus: Max retries exceeded');
      retryCount = 0;
    }
  }

  // Secure settings loader with exponential backoff
  function loadSettings(attempt = 1) {
    const maxAttempts = 3;
    const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);

    try {
      chrome.storage.sync.get(defaultSettings, (items) => {
        if (chrome.runtime.lastError) {
          console.error('YouTube Focus: Storage error', chrome.runtime.lastError);
          
          if (attempt < maxAttempts) {
            console.log(`YouTube Focus: Retrying storage load (${attempt}/${maxAttempts})`);
            setTimeout(() => loadSettings(attempt + 1), backoffDelay);
          } else {
            console.error('YouTube Focus: Failed to load settings, using defaults');
            settings = { ...defaultSettings };
            extensionEnabled = true;
            applySettings();
          }
        } else {
          // Validate and sanitize loaded settings
          settings = validateSettings(items);
          extensionEnabled = settings.extensionEnabled !== false;
          applySettings();
          
          console.log('YouTube Focus: Settings loaded successfully', 
                      extensionEnabled ? '(ENABLED)' : '(DISABLED)');
        }
      });
    } catch (error) {
      console.error('YouTube Focus: Critical error loading settings', error);
      settings = { ...defaultSettings };
      extensionEnabled = true;
      applySettings();
    }
  }

  // Secure storage change listener with validation
  try {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        let hasValidChanges = false;
        
        for (const key in changes) {
          if (settings.hasOwnProperty(key) && typeof changes[key].newValue === 'boolean') {
            settings[key] = changes[key].newValue;
            hasValidChanges = true;
            
            // Update master toggle state
            if (key === 'extensionEnabled') {
              extensionEnabled = changes[key].newValue;
              console.log('YouTube Focus: Master toggle changed to', extensionEnabled);
            }
          } else {
            console.warn(`YouTube Focus: Invalid setting change ignored: ${key}`);
          }
        }
        
        if (hasValidChanges) {
          scheduleApply();
        }
      }
    });
  } catch (error) {
    console.error('YouTube Focus: Error setting up storage listener', error);
  }

  // Listen for messages from background script
  try {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'masterToggleChanged') {
        extensionEnabled = request.enabled;
        settings.extensionEnabled = request.enabled;
        scheduleApply();
        sendResponse({ success: true });
      }
      return true;
    });
  } catch (error) {
    console.error('YouTube Focus: Error setting up message listener', error);
  }

  // Advanced observer with intelligent throttling
  let observerTimeout = null;
  let mutationBuffer = [];
  const observer = new MutationObserver((mutations) => {
    // Skip if extension is disabled
    if (!extensionEnabled || !settings.extensionEnabled) {
      return;
    }

    mutationBuffer.push(...mutations);
    
    if (mutationBuffer.length > 100) {
      mutationBuffer = mutationBuffer.slice(-100);
    }

    const hasRelevantChange = mutations.some(mutation => {
      if (mutation.type === 'characterData') return false;
      
      const hasNodes = mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0;
      
      if (hasNodes) {
        const relevantNodes = Array.from(mutation.addedNodes).concat(Array.from(mutation.removedNodes))
          .filter(node => node.nodeType === Node.ELEMENT_NODE);
        return relevantNodes.length > 0;
      }
      
      return false;
    });

    if (hasRelevantChange) {
      if (observerTimeout) {
        clearTimeout(observerTimeout);
      }
      
      const throttleDelay = mutationBuffer.length > 50 ? 500 : CONFIG.OBSERVER_THROTTLE;
      
      observerTimeout = setTimeout(() => {
        scheduleApply();
        mutationBuffer = [];
      }, throttleDelay);
    }
  });

  // Safe observer initialization
  function initializeObserver() {
    try {
      const targetNode = document.documentElement;
      if (!targetNode) {
        console.warn('YouTube Focus: Document element not ready for observation');
        return false;
      }

      observer.observe(targetNode, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
      });

      return true;
    } catch (error) {
      console.error('YouTube Focus: Observer initialization failed', error);
      return false;
    }
  }

  // Advanced initialization with health checks
  function initialize() {
    try {
      // Apply initial settings immediately
      applySettings();
      
      // Load user settings with retry logic
      loadSettings();

      // Initialize observer with retry
      let observerRetries = 0;
      const maxObserverRetries = 3;
      
      function tryInitObserver() {
        const success = initializeObserver();
        
        if (!success && observerRetries < maxObserverRetries) {
          observerRetries++;
          console.log(`YouTube Focus: Retrying observer init (${observerRetries}/${maxObserverRetries})`);
          setTimeout(tryInitObserver, 1000 * observerRetries);
        } else if (success) {
          console.log('YouTube Focus: Observer initialized successfully');
        } else {
          console.error('YouTube Focus: Observer initialization failed after retries');
        }
      }
      
      if (document.documentElement) {
        tryInitObserver();
      } else {
        setTimeout(tryInitObserver, 100);
      }

      console.log('YouTube Focus v3.1: Initialized successfully 🎯');
      
    } catch (error) {
      console.error('YouTube Focus: Critical initialization error', error);
      
      try {
        settings = { ...defaultSettings };
        extensionEnabled = true;
        applySettings();
      } catch (fallbackError) {
        console.error('YouTube Focus: Fallback initialization failed', fallbackError);
      }
    }
  }

  // Smart initialization timing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }

  // Enhanced SPA navigation handler
  let navTimeout = null;
  new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      
      if (navTimeout) clearTimeout(navTimeout);
      navTimeout = setTimeout(() => {
        console.log('YouTube Focus: Page navigation detected');
        scheduleApply();
      }, 200);
    }
  }).observe(document.body || document.documentElement, {
    subtree: true,
    childList: true
  });

  // Comprehensive cleanup
  window.addEventListener('beforeunload', () => {
    try {
      if (observer) observer.disconnect();
      if (applyTimeout) clearTimeout(applyTimeout);
      if (observerTimeout) clearTimeout(observerTimeout);
      if (navTimeout) clearTimeout(navTimeout);
      
      if (performanceMetrics.applyCount > 0) {
        const avgTime = performanceMetrics.totalTime / performanceMetrics.applyCount;
        console.log(`YouTube Focus: Avg apply time: ${avgTime.toFixed(2)}ms, Errors: ${performanceMetrics.errors}`);
      }
    } catch (error) {
      console.error('YouTube Focus: Cleanup error', error);
    }
  }, { once: true });

  // Expose performance metrics
  if (typeof window !== 'undefined') {
    window.__YTFocusMetrics__ = () => performanceMetrics;
    window.__YTFocusEnabled__ = () => extensionEnabled;
  }

})();
