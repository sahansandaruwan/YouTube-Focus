# YouTube Focus - Changelog

## Version 3.1 - Master Toggle Update (NEW!)

### 🔥 Master On/Off Toggle
- **Global Extension Control** - Single toggle to enable/disable all features
- **Visual Status Indicators** - Clear "Active" vs "Inactive" status display
- **Dynamic Icon Updates** - Extension icon changes based on state
- **Badge System** - Shows "OFF" badge when extension is disabled
- **State Persistence** - All settings preserved when toggling on/off
- **Smooth Transitions** - UI smoothly adapts to state changes

### ⌨️ Enhanced Keyboard Shortcuts
- **Space** - Toggle extension on/off (new!)
- **Alt+A** - Enable all features
- **Alt+R** - Reset to defaults
- **Alt+E** - Export/import settings
- **1-8** - Toggle individual features

### 🎨 UI/UX Improvements
- **Prominent Master Toggle** - Large, easy-to-use switch at top of popup
- **Status Badge** - Color-coded active/inactive indicators
- **State-Aware Styling** - Interface adapts colors based on extension state
- **Improved Visual Feedback** - Enhanced animations and transitions
- **Settings Dimming** - Individual settings dim when extension disabled
- **Better Icons** - Updated emoji icons for status display

### 🔧 Technical Enhancements
- **Improved State Management** - Centralized extension state tracking
- **Background Service Updates** - Icon management and state synchronization
- **Content Script Enhancements** - Dynamic enable/disable without reload
- **Message Passing** - Real-time communication between components
- **Error Recovery** - Better handling of state transitions

### 📊 New Features
- **Master Toggle API** - Background script manages global state
- **State Synchronization** - All tabs update when master toggle changes
- **Settings Preservation** - Individual settings retained during toggle
- **Visual State Feedback** - Multiple UI elements reflect extension state
- **Keyboard Accessibility** - Full keyboard control of master toggle

## Version 3.0 - Advanced Security & UX Update

### 🛡️ Advanced Security Features
- **Content Security Policy (CSP)** - Strict script execution controls
- **Input Validation** - All settings validated before storage
- **Type Checking** - Ensures boolean-only values in settings
- **Error Boundaries** - Graceful degradation on failures
- **Sanitized Storage** - Protection against corrupted data

### ⚡ Enhanced Performance
- **Retry Logic** - Automatic recovery from transient errors (max 3 retries)
- **Exponential Backoff** - Smart retry delays (1s → 2s → 4s)
- **Performance Monitoring** - Tracks apply times and errors
- **Adaptive Throttling** - Adjusts based on page activity (300ms-500ms)
- **Intelligent Mutation Detection** - Filters trivial DOM changes
- **Mutation Buffer** - Analyzes patterns (keeps last 100)

### 🎯 Advanced Error Handling
- **Multi-Layer Try-Catch** - Comprehensive error coverage
- **Health Monitoring System** - Background service worker tracks health
- **Error Recovery** - Automatic fallback to defaults
- **Detailed Logging** - Context-aware error messages
- **Health Indicator** - Visual status in popup (green = healthy)

### ✨ UX Improvements
- **Keyboard Shortcuts**:
  - Press `1-8` to toggle individual features
  - `Alt+A` to enable all features
  - `Alt+R` to reset to defaults
  - `Alt+E` for export/import menu
- **Settings Export/Import** - Backup and restore your configuration
- **Toast Notifications** - Non-intrusive feedback messages
- **Visual Keyboard Hints** - Numbers shown on hover
- **Focus Management** - Full keyboard navigation support
- **Accessibility** - ARIA labels and tab support
- **Health Status** - Real-time extension health indicator

### 🔧 Technical Improvements
- **Background Service Worker** - Monitors extension health
- **Settings Validation** - Prevents invalid configurations
- **Atomic Updates** - All changes applied together
- **Memory Cleanup** - Proper resource deallocation
- **Performance Metrics** - Exposed via `window.__YTFocusMetrics__()`
- **Smart Initialization** - Multiple retry attempts with backoff

### 📊 Monitoring & Debugging
- **Health API** - Query extension status via messages
- **Performance Tracking** - Average apply time logging
- **Error Counting** - Automatic health degradation after 10 errors
- **Uptime Tracking** - Monitor how long extension has been running
- **Change Analytics** - Track total setting modifications

### 🎨 UI Polish
- **Pulsing Health Indicator** - Animated status dot
- **Version Display** - Shows v3.0 in header
- **Enhanced Tooltips** - Keyboard shortcut hints
- **Better Button States** - Focus rings for accessibility
- **Smooth Animations** - requestAnimationFrame-based
- **Error Toast Styling** - Red background for errors

## Version 2.0 - Performance & UI Update
- Initial performance optimizations
- Modern UI design
- Smooth transitions
- Settings sync

## Version 1.0 - Initial Release
- Core blocking features
- Basic popup interface
- Chrome sync storage

---

## Upgrade Notes

### Upgrading from v3.0 to v3.1
- Master toggle feature automatically added
- All existing settings preserved
- New `extensionEnabled` setting added (defaults to `true`)
- Extension icon may update to show state
- No manual configuration needed

### Upgrading from v2.0 to v3.0
- Settings format unchanged, all preferences preserved
- Health monitoring runs automatically in background
- Performance improvements are automatic
- Keyboard shortcuts work immediately

### Upgrading from v1.0 to v2.0
- Settings automatically migrated
- UI completely redesigned
- All features remain functional
