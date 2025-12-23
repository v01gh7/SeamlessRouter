# ⚡ SeamlessRouter

[![TypeScript](https://img.shields.io/badge/typescript-%233178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Zero Config](https://img.shields.io/badge/zero_config-2E8B57.svg?style=for-the-badge&logo=simpleanalytics&logoColor=white)](#)
[![Lightweight](https://img.shields.io/badge/lightweight-FF6B35.svg?style=for-the-badge&logo=linuxcontainers&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge)](./LICENSE)

> **📝 Update Note**: CSS mask animations (`mask-circle` and `mask-gradient`) have been removed to simplify the codebase and reduce bundle size. The router now includes 7 standard animation types that work reliably across all browsers.

---

### 🧩 What is this router?

**SeamlessRouter** is an ultra-lightweight router for AJAX navigation that makes transitions between pages smooth without full page reloads.

🌐 **Works with regular HTML files and CMS** (MODX, WordPress, Bitrix, and others)  
⚡ **The easiest way to speed up your site** — just 1 file, 0 configuration  
🧹 **Automatically cleans up junk** — timers, event listeners, and old scripts  
🔌 **No dependencies** — pure TypeScript/JavaScript  
🎯 **Full control** — special attributes for managing script behavior

**Key feature**: the router works on any page, even if you access it directly via a link (for example, directly to `/blog/`).

---

### 📦 Installation and Usage

#### Quick Start (UMD Version)
Download the ready-to-use UMD version from the project root:
```html
<script data-keep data-skip src="SeamlessRouter.umd.min.js"></script>
```

**File size**: ~38.8KB (minified) | ~11KB gzipped

#### Development Build
```bash
# Install dependencies (development only)
pnpm install

# Build all versions
pnpm build:all
# or just UMD version
pnpm build:umd
# or standard build (ES + UMD in dist/)
pnpm build
```

After building, you can use either:
- **UMD version from root**: `SeamlessRouter.umd.min.js` (for direct download)
- **ES/UMD versions from dist/**: `dist/SeamlessRouter.es.js` or `dist/SeamlessRouter.umd.js`

Include on your site **with the required attributes**:
```html
<!-- For UMD version from root -->
<script data-keep data-skip src="SeamlessRouter.umd.min.js"></script>

<!-- For ES version from dist -->
<script type="module" data-keep data-skip src="dist/SeamlessRouter.es.js"></script>
```

**Connection attributes**:
- `data-keep` — prevents the script from being removed during navigation
- `data-skip` — prevents the script from being re-executed when new pages load

**That's it!** The router initializes automatically and starts working. No settings, `init()` calls, or configuration needed.

#### Default Configuration (All Features Enabled)
By default, all advanced features are enabled with optimal settings:
- **Prefetching**: Enabled with intelligent prediction
- **Caching**: 30MB LRU cache with important pages always cached
- **Animations**: 7 standard animation types (fade, slide, collapse, diagonal)
- **Offline Mode**: Service Worker with network-first strategy

The router automatically detects browser capabilities and provides appropriate fallbacks.

---

### 🚀 How it works

1. **Intercepts clicks** on links (`<a href="...">`) and buttons with `data-router-link`
2. **Loads a new page** via `fetch()` without reloading
3. **Updates only the changed parts**: title, meta tags, content
4. **Automatically cleans up** scripts, timers, and listeners from the previous page
5. **If something goes wrong** — automatic fallback to a regular page reload

---

### ⚙️ Controlling scripts with data attributes

The router provides special attributes for full control over script behavior:

```html
<!-- data-keep: script is NOT removed when navigating to a new page -->
<script data-keep src="shared-library.js"></script>

<!-- data-skip: script is NOT executed when loading new pages -->
<script data-skip src="analytics.js"></script>

<!-- data-reload: script executes EVERY TIME, even if already cached -->
<script data-reload src="dynamic-widget.js"></script>

<!-- Combinations: do not remove AND do not execute -->
<script data-keep data-skip src="seamless-router.js"></script>
```

---

### 🛡️ **IMPORTANT REQUIREMENT FOR SCRIPTS**

For complete isolation and to prevent conflicts, **all your scripts must be wrapped in an IIFE** (Immediately Invoked Function Expression):

```javascript
// ✅ CORRECT — script in IIFE format
(function() {
    'use strict';
    // All your page code here
    let slider = new Slider();
    window.myConfig = { /* ... */ }; // Even window.xxx is safe
})();

// ❌ INCORRECT — global variables
var slider = new Slider(); // Will cause conflicts between pages!
```

#### Why is this important?
- **Isolation**: variables from one page don't conflict with another
- **Security**: no memory leaks
- **Simplicity**: no need to worry about unique variable names
- **Compatibility**: if scripts are in IIFEs, the router works perfectly

**The router does NOT require** wrapping scripts in IIFEs automatically — that's the developer's responsibility.

---

### 🧠 Project Structure

```
SeamlessRouter/
├── src/
│   ├── core/
│   │   ├── Router/          # Navigation logic
│   │   ├── Sandbox/         # Sandbox for isolating scripts
│   │   └── utils/           # Helper functions
│   └── index.ts             # Entry point
├── dist/
│   └── seamless-router.js   # Ready-to-use file
├── examples/                # Usage examples
└── README.md
```

---

### 🎯 Advantages over alternatives

| Feature | SeamlessRouter | Other Routers |
|------------|----------------|----------------|
| Size | **~5KB** (after build) | 50-200KB |
| Dependencies | **0** | React/Vue/Angular |
| Configuration | **Not required** | JSON, objects, settings |
| Compatibility | **Any HTML/CMS** | SPA only |
| Initialization | **Automatic** | Manual `init()` call |
| Requirements | **IIFE only** | Architecture, build, framework |

---

### 📖 Usage example

1. **Add the router** to all site pages with the correct attributes:

```html
<html>
<head>
    <title>My Site</title>
</head>
<body>
    <nav>
        <a href="/">Home</a>
        <a href="/blog/">Blog</a>
        <a href="/about/">About Us</a>
    </nav>
    
    <!-- Shared libraries needed on all pages -->
    <script data-keep src="shared-library.js"></script>
    
    <!-- The router itself - do not remove and do not re-run -->
    <script data-keep data-skip src="seamless-router.js"></script>
    
    <script>
    // All page scripts in an IIFE
    (function() {
        'use strict';
        console.log('This page works with SeamlessRouter!');
        
        // This code doesn't conflict with code on other pages
        let pageData = { title: 'Home' };
        window.pageData = pageData; // Can write to window
    })();
    </script>
</body>
</html>
```

2. **Create the page `/blog/index.html`**:

```html
<!-- Widget that needs to be updated every time -->
<script data-reload src="comments-widget.js"></script>

<script>
// Blog also in an IIFE
(function() {
    'use strict';
    console.log('Blog loaded!');
    
    // Can use the same variable names
    let pageData = { title: 'Blog' }; // Doesn't conflict with home page
    window.pageData = pageData;
})();
</script>
```

3. **Enjoy** fast transitions without reloading!

---

### 🚀 Advanced Features (Implemented!)

The router now includes four powerful advanced features:

#### 1. **Page Prefetching** ⚡
- **Hover prefetch**: Loads pages when user hovers over links
- **Touch prefetch**: Works on mobile devices with touch events
- **Intelligent prediction**: Learns user navigation patterns
- **Smart cancellation**: Cancels prefetch if user moves away

```javascript
// Enable/disable prefetching
router.getPrefetchManager().setEnabled(true);

// Get prefetch statistics
const stats = router.getIntelligentPrefetchStats();
console.log('Prefetch stats:', stats);
```

#### 2. **Intelligent Caching** 🧠
- **LRU strategy**: Automatically removes least recently used pages
- **Size limits**: Configurable cache size (default: 30MB)
- **Important pages**: Always keeps critical pages cached
- **Update checking**: Checks for page updates via `last-modified`

```javascript
// Manage cache
const cacheManager = router.getCacheManager();
cacheManager.set('/page', htmlContent, headers);
const cached = cacheManager.get('/page');

// Get cache statistics
const stats = cacheManager.getStats();
console.log('Cache stats:', stats);
```

#### 3. **Offline Mode** 📶
- **Service Worker**: Caches pages for offline access
- **Network-first strategy**: Tries network, falls back to cache
- **Offline indicator**: Shows when device is offline
- **Custom offline page**: Beautiful fallback UI

```javascript
// Check offline support
if (router.isOfflineModeSupported()) {
  // Enable offline mode
  router.setOfflineModeEnabled(true);
  
  // Get Service Worker stats
  const stats = await router.getServiceWorkerCacheStats();
  console.log('Service Worker stats:', stats);
}
```

#### 4. **Advanced Animations** 🎬
- **7 animation types**: fade, slide-left/right/up/down, collapse, diagonal
- **Direction-aware**: Different animations for forward/back navigation
- **Accessibility**: Respects `prefers-reduced-motion`
- **Browser compatibility**: Works in all modern browsers
- **Customizable**: Set default animation type and duration

```javascript
// Control animations
router.setAnimationsEnabled(true);
router.setDefaultAnimationType('slide-left');

// Navigate with specific animation
router.navigateWithAnimation('/page', 'fade');

// Navigate without animation
router.navigateWithoutAnimation('/page');

// Get available animation types
const availableTypes = router.getAvailableAnimationTypes();
console.log('Available animations:', availableTypes);
```

#### Configuration Example:
```javascript
// Custom configuration
const router = new AdvancedRouter({
  prefetch: {
    enabled: true,
    hoverDelay: 300,
    mobilePrefetchLimit: 3
  },
  cache: {
    enabled: true,
    maxSizeMB: 50,
    alwaysCache: ['/', '/about', '/contacts']
  },
  animations: {
    enabled: true,
    defaultDuration: 400,
    respectReducedMotion: true
  },
  offline: {
    enabled: true,
    showOfflineIndicator: true
  }
});
```

### 🧪 Testing Integration

A test script is included to verify all features work correctly:

1. Open browser console on any page
2. Run `runIntegrationTests()` to test all features
3. Or test individual components:
   - `testInitialization()` - Check all managers
   - `testCache()` - Test cache functionality
   - `testPrefetch()` - Test prefetch system
   - `testAnimations()` - Test animation system
   - `testServiceWorker()` - Test offline mode

---

### 🤝 Contributing

PRs, improvements, and ideas are welcome!  
Before a PR, make sure the project is built and tested.

---

### 🪪 License

The project is distributed under the [MIT](./LICENSE) license.  
Created with ❤️ for speed and smooth navigation.