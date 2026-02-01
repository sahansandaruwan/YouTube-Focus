// YouTube Focus v3.0 - Advanced Popup Script
// Features: Keyboard shortcuts, health monitoring, settings export/import, enhanced UX

'use strict';

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

// State
let currentSettings = { ...defaultSettings };
let healthCheckInterval = null;

// Update the active count display with animation
function updateEnabledCount() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  const enabledCount = Array.from(checkboxes).filter(cb => cb.checked).length;
  const countElement = document.getElementById('enabledCount');
  
  if (countElement) {
    countElement.textContent = enabledCount;
    countElement.style.transform = 'scale(1.2)';
    setTimeout(() => {
      countElement.style.transform = 'scale(1)';
    }, 200);
  }
}

// Load settings with error handling
function loadSettings() {
  try {
    chrome.storage.sync.get(defaultSettings, (items) => {
      if (chrome.runtime.lastError) {
        console.error('Error loading settings:', chrome.runtime.lastError);
        showToast('⚠️ Error loading settings', 'error');
        return;
      }

      currentSettings = items;
      
      // Set checkbox states
      for (const key in items) {
        const checkbox = document.getElementById(key);
        if (checkbox) {
          checkbox.checked = items[key];
        }
      }
      
      updateEnabledCount();
    });
  } catch (error) {
    console.error('Critical error loading settings:', error);
    showToast('⚠️ Critical error', 'error');
  }
}

// Save setting with validation
function saveSetting(key, value) {
  if (typeof value !== 'boolean') {
    console.error('Invalid setting value:', key, value);
    return;
  }

  const setting = {};
  setting[key] = value;
  
  try {
    chrome.storage.sync.set(setting, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving setting:', chrome.runtime.lastError);
        showToast('⚠️ Error saving', 'error');
      } else {
        currentSettings[key] = value;
      }
    });
  } catch (error) {
    console.error('Critical error saving setting:', error);
    showToast('⚠️ Save failed', 'error');
  }
}

// Setup checkbox event listeners
document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
  checkbox.addEventListener('change', (e) => {
    const settingDiv = e.target.closest('.setting');
    
    // Visual feedback
    settingDiv.style.transform = 'scale(0.98)';
    setTimeout(() => {
      settingDiv.style.transform = 'scale(1)';
    }, 100);
    
    // Save to storage
    saveSetting(checkbox.id, checkbox.checked);
    updateEnabledCount();
  });
});

// Make entire setting div clickable
document.querySelectorAll('.setting').forEach((settingDiv) => {
  settingDiv.addEventListener('click', (e) => {
    // Don't trigger if clicking the toggle itself
    if (e.target.closest('.toggle')) return;
    
    const checkbox = settingDiv.querySelector('input[type="checkbox"]');
    if (checkbox) {
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change'));
    }
  });

  // Keyboard support for accessibility
  settingDiv.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const checkbox = settingDiv.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      }
    }
  });
});

// Reset to defaults
document.getElementById('resetBtn').addEventListener('click', () => {
  const btn = document.getElementById('resetBtn');
  btn.style.transform = 'scale(0.95)';
  
  setTimeout(() => {
    btn.style.transform = 'scale(1)';
    
    try {
      chrome.storage.sync.set(defaultSettings, () => {
        if (chrome.runtime.lastError) {
          showToast('⚠️ Reset failed', 'error');
          return;
        }

        for (const key in defaultSettings) {
          const checkbox = document.getElementById(key);
          if (checkbox) {
            checkbox.checked = defaultSettings[key];
          }
        }
        
        currentSettings = { ...defaultSettings };
        updateEnabledCount();
        showToast('✓ Reset to defaults');
      });
    } catch (error) {
      console.error('Reset error:', error);
      showToast('⚠️ Reset failed', 'error');
    }
  }, 100);
});

// Turn all settings on
document.getElementById('allOnBtn').addEventListener('click', () => {
  const btn = document.getElementById('allOnBtn');
  btn.style.transform = 'scale(0.95)';
  
  setTimeout(() => {
    btn.style.transform = 'scale(1)';
    
    const allOnSettings = {};
    for (const key in defaultSettings) {
      allOnSettings[key] = true;
    }
    
    try {
      chrome.storage.sync.set(allOnSettings, () => {
        if (chrome.runtime.lastError) {
          showToast('⚠️ Operation failed', 'error');
          return;
        }

        for (const key in allOnSettings) {
          const checkbox = document.getElementById(key);
          if (checkbox) {
            checkbox.checked = true;
          }
        }
        
        currentSettings = { ...allOnSettings };
        updateEnabledCount();
        showToast('✓ All features enabled');
      });
    } catch (error) {
      console.error('All On error:', error);
      showToast('⚠️ Operation failed', 'error');
    }
  }, 100);
});

// Export/Import settings
document.getElementById('exportBtn').addEventListener('click', () => {
  const choice = prompt(
    'Choose an option:\n\n' +
    '1. Export Settings (download)\n' +
    '2. Import Settings (paste JSON)\n' +
    '3. Copy to Clipboard\n' +
    '4. Cancel\n\n' +
    'Enter 1, 2, 3, or 4:'
  );
  
  if (choice === '1') {
    exportSettings();
  } else if (choice === '2') {
    importSettings();
  } else if (choice === '3') {
    copyToClipboard();
  }
});

function exportSettings() {
  const dataStr = JSON.stringify(currentSettings, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `youtube-focus-settings-${Date.now()}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
  showToast('✓ Settings exported');
}

function importSettings() {
  const jsonStr = prompt('Paste your settings JSON:');
  
  if (!jsonStr) return;
  
  try {
    const imported = JSON.parse(jsonStr);
    
    const validatedSettings = {};
    for (const key in defaultSettings) {
      if (key in imported && typeof imported[key] === 'boolean') {
        validatedSettings[key] = imported[key];
      } else {
        validatedSettings[key] = defaultSettings[key];
      }
    }
    
    chrome.storage.sync.set(validatedSettings, () => {
      if (chrome.runtime.lastError) {
        showToast('⚠️ Import failed', 'error');
        return;
      }

      for (const key in validatedSettings) {
        const checkbox = document.getElementById(key);
        if (checkbox) {
          checkbox.checked = validatedSettings[key];
        }
      }
      
      currentSettings = validatedSettings;
      updateEnabledCount();
      showToast('✓ Settings imported');
    });
  } catch (error) {
    showToast('⚠️ Invalid JSON', 'error');
  }
}

function copyToClipboard() {
  const dataStr = JSON.stringify(currentSettings, null, 2);
  
  navigator.clipboard.writeText(dataStr).then(() => {
    showToast('✓ Copied to clipboard');
  }).catch(() => {
    showToast('⚠️ Copy failed', 'error');
  });
}

// Enhanced toast notification
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  
  if (type === 'error') {
    toast.style.background = 'rgba(245, 101, 101, 0.95)';
  }
  
  document.body.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 2500);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  const key = parseInt(e.key);
  if (key >= 1 && key <= 8) {
    e.preventDefault();
    const settings = document.querySelectorAll('.setting');
    if (settings[key - 1]) {
      const checkbox = settings[key - 1].querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
        
        const settingDiv = settings[key - 1];
        settingDiv.style.background = '#f0f4ff';
        setTimeout(() => {
          settingDiv.style.background = 'white';
        }, 200);
      }
    }
  }
  
  if (e.altKey && e.key === 'a') {
    e.preventDefault();
    document.getElementById('allOnBtn').click();
  }
  
  if (e.altKey && e.key === 'r') {
    e.preventDefault();
    document.getElementById('resetBtn').click();
  }
  
  if (e.altKey && e.key === 'e') {
    e.preventDefault();
    document.getElementById('exportBtn').click();
  }
});

// Health monitoring
function checkHealth() {
  try {
    chrome.runtime.sendMessage({ action: 'getHealth' }, (response) => {
      if (chrome.runtime.lastError) {
        return;
      }

      const indicator = document.getElementById('healthIndicator');
      if (response && response.healthy !== undefined) {
        if (response.healthy) {
          indicator.classList.remove('unhealthy');
          indicator.title = `Healthy • ${response.errorCount} errors`;
        } else {
          indicator.classList.add('unhealthy');
          indicator.title = `Unhealthy • ${response.errorCount} errors`;
        }
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
  }
}

// Initialize
loadSettings();
checkHealth();

healthCheckInterval = setInterval(checkHealth, 10000);

window.addEventListener('beforeunload', () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
});

setTimeout(() => {
  const firstSetting = document.querySelector('.setting');
  if (firstSetting) firstSetting.focus();
}, 100);
