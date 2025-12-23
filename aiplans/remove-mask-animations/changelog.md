# Changelog: Remove Mask Animations

## Planned Changes

### Files to Delete
1. `src/core/Animations/MaskAnimationManager.ts` - Main mask animation implementation

### Files to Modify
1. `src/core/Animations/index.ts` - Remove MaskAnimationManager export
2. `src/core/config.ts` - Remove mask animation types from AnimationType and default config
3. `animations.css` - Remove mask animation CSS styles
4. `public/animations.css` - Remove mask animation CSS styles
5. `src/core/AdvancedRouter.ts` - Replace MaskAnimationManager with AnimationManager, remove mask-specific methods
6. `src/index.ts` - Check for any mask animation imports

### Configuration Changes
- Remove 'mask-circle' and 'mask-gradient' from AnimationType type
- Remove mask animation types from defaultConfig.animations.animationTypes
- Update any configuration validation that references mask animations

### CSS Changes
- Remove `.router-mask-animation` class
- Remove `@keyframes router-mask-circle-in` and `router-mask-circle-out`
- Remove `@keyframes router-mask-gradient-in` and `router-mask-gradient-out`
- Remove `.router-animate-mask-circle` and `.router-animate-mask-gradient` classes
- Remove mask animation related media queries

### Code Changes
- Change AdvancedRouter to instantiate AnimationManager instead of MaskAnimationManager
- Remove mask animation specific methods from AdvancedRouter
- Update animation type validation to exclude mask types
- Remove any mask animation event emissions

## Expected Impact
- Reduced bundle size
- Simplified animation system
- Removal of unused CSS
- Cleaner codebase without unused features