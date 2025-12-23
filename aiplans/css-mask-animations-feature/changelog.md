# Changelog: CSS Mask-Image Animations Feature

## Implemented Changes

### New Features ✅
- ✅ CSS mask-image based transition animations
- ✅ 2 demo masks: circle reveal and gradient wipe
- ✅ Extended AnimationManager with mask support (MaskAnimationManager)
- ✅ Default all features enabled configuration
- ✅ Browser compatibility detection and console logging
- ✅ Automatic fallback to standard CSS animations

### Build Changes ✅
- ✅ UMD version output to project root: `SeamlessRouter.umd.min.js`
- ✅ New build scripts: `build:umd` and `build:all`
- ✅ File size: ~44KB minified (~12KB gzipped)
- ✅ offline.html and animations.css remain built into router

### Documentation Updates ✅
- ✅ README updated with mask animation documentation
- ✅ Usage examples for mask-circle and mask-gradient
- ✅ Default configuration details (all features enabled)
- ✅ UMD file location and size information
- ✅ Browser compatibility information

### Code Changes ✅
- ✅ New `MaskAnimationManager.ts` module
- ✅ Updated `AnimationManager.ts` with protected properties
- ✅ Updated `config.ts` with new animation types
- ✅ Updated `animations.css` with mask animation styles
- ✅ Updated `AdvancedRouter.ts` to use MaskAnimationManager
- ✅ Updated `vite.config.ts` with build options
- ✅ Created `build-umd.js` build script
- ✅ Updated `package.json` with new build scripts

### Technical Details
- **Mask Types**: `mask-circle` (radial gradient), `mask-gradient` (linear gradient)
- **Browser Support**: Automatic detection with console warnings
- **Fallback**: Automatically uses standard animations if mask not supported
- **Performance**: CSS classes for better performance and smaller weight
- **Accessibility**: Respects `prefers-reduced-motion`