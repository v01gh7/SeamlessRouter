# Plan: Remove Mask Animations from Codebase

## 1. Goal
Completely remove all mask animation related code from the project, including:
- MaskAnimationManager class
- Mask animation types from configuration
- Mask animation CSS styles
- Mask animation references in AdvancedRouter
- Mask animation imports and exports

## 2. Context
The project currently has mask animation functionality implemented as part of the advanced features. The user has determined this feature is not needed and wants it completely removed from the codebase.

## 3. Assumptions
- Mask animations are not being used in production
- Removing them won't break existing functionality
- The AnimationManager base class should remain
- Standard CSS animations should continue to work
- Configuration should be updated to remove mask types

## 4. Constraints
- Must maintain backward compatibility for non-mask animations
- Must not break the AnimationManager base class
- Must update all references to mask animations
- Must clean up all related CSS
- Must update configuration types

## 5. Non-Goals
- Removing the entire animation system
- Changing the AnimationManager base class structure
- Removing standard CSS animations (fade, slide, etc.)
- Changing the router's core functionality
- Modifying unrelated features

## 6. Proposed Solution
1. Delete MaskAnimationManager.ts file
2. Remove mask animation types from config.ts
3. Remove mask animation CSS from animations.css
4. Update AdvancedRouter.ts to use AnimationManager instead of MaskAnimationManager
5. Remove mask animation imports and references
6. Update any related documentation if needed

## 7. Step-by-Step Plan

### Phase 1: File Analysis & Dependencies
1. Identify all files that reference mask animations
2. Analyze dependencies between mask animation code and other modules
3. Create backup of files to be modified

### Phase 2: Core File Removal
4. Delete `src/core/Animations/MaskAnimationManager.ts`
5. Update `src/core/Animations/index.ts` exports
6. Remove mask animation types from `src/core/config.ts`

### Phase 3: CSS Cleanup
7. Remove mask animation CSS from `animations.css`
8. Remove mask animation CSS from `public/animations.css`

### Phase 4: AdvancedRouter Updates
9. Update `src/core/AdvancedRouter.ts` to use AnimationManager instead of MaskAnimationManager
10. Remove mask animation related methods and properties
11. Update animation type handling

### Phase 5: Configuration Updates
12. Update default configuration to remove mask animation types
13. Update AnimationType type definition

### Phase 6: Build & Testing
14. Build project to ensure no compilation errors
15. Test basic navigation to ensure animations still work
16. Verify no runtime errors related to removed code

## 8. Dependencies Analysis
- **MaskAnimationManager** → AnimationManager (extends)
- **AdvancedRouter** → MaskAnimationManager (uses)
- **config.ts** → AnimationType (includes mask types)
- **animations.css** → Contains mask animation CSS

**Ordering Constraints:**
1. Must remove MaskAnimationManager before updating AdvancedRouter
2. Must update config.ts before building
3. Must update CSS files to remove unused styles

**Shared Interfaces:**
- AnimationType in config.ts needs to be updated
- AdvancedRouter's animation manager type needs to change

**Potential Conflicts:**
- AdvancedRouter may have methods specific to mask animations
- Configuration may have references to mask animation types
- Build may fail if imports are not properly updated

## 9. Risks & Trade-offs
- **Risk**: Breaking existing animation functionality
  - **Mitigation**: Keep AnimationManager base class intact, only remove mask-specific code
- **Risk**: TypeScript compilation errors
  - **Mitigation**: Update all type references and imports
- **Risk**: Runtime errors if references remain
  - **Mitigation**: Thorough search for all mask animation references
- **Trade-off**: Complete removal vs. keeping disabled
  - **Decision**: Complete removal as requested

## 10. Validation Criteria
- [ ] MaskAnimationManager.ts file deleted
- [ ] No compilation errors in TypeScript
- [ ] No runtime errors in browser console
- [ ] Standard animations (fade, slide, etc.) still work
- [ ] Configuration no longer includes mask animation types
- [ ] CSS files no longer contain mask animation styles
- [ ] AdvancedRouter uses AnimationManager instead of MaskAnimationManager
- [ ] All mask animation imports removed
- [ ] Project builds successfully

## 11. Rollback / Recovery Plan
- Restore deleted files from git history
- Revert configuration changes
- Revert CSS changes
- Revert AdvancedRouter changes
- All changes will be committed separately for easy rollback

## 12. Open Questions
1. Are there any other files that might reference mask animations that we haven't identified?
2. Should we also remove any test files related to mask animations?
3. Are there any documentation files that mention mask animations that need updating?
4. Should we clean up the `aiplans/css-mask-animations-feature` folder since it's now obsolete?