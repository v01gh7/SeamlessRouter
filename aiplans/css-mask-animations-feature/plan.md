# Plan: CSS Mask-Image Animations Feature

## 1. Goal
Add CSS mask-image based transition animations to SeamlessRouter with 2 demo masks, update documentation, organize build output, and enable all features by default.

## 2. Context
Current project has animation support via AnimationManager but lacks CSS mask-image based transitions. Need to research CSS mask-image animations, implement the feature, and integrate with existing animation system.

## 3. Assumptions
- Existing AnimationManager can be extended
- CSS mask-image is supported in modern browsers
- Users want visual transition effects
- Default configuration should enable all features
- Build process uses Vite/TypeScript

## 4. Constraints
- Must maintain backward compatibility
- Must not break existing animation system
- File size increase should be minimal
- Must work with existing router architecture
- Must follow project structure patterns

## 5. Non-Goals
- Creating complex animation editor
- Supporting legacy browsers without mask-image
- Adding dozens of mask presets
- Creating visual configuration UI
- Breaking existing API

## 6. Proposed Solution
1. Research CSS mask-image animations for transitions
2. Create 2 demo masks (circle reveal and gradient wipe)
3. Extend AnimationManager to support mask animations
4. Create separate build folder for bundled assets
5. Update README with feature documentation
6. Update UMD bundle size in documentation
7. Enable all features by default in config

## 7. Step-by-Step Plan

### Phase 1: Research & Design
1. Research CSS mask-image animation techniques
2. Design mask animation API compatible with existing system
3. Create mask animation interface

### Phase 2: Implementation
4. Create mask animation module in `src/core/Animations/`
5. Implement 2 demo masks:
   - Circle reveal mask
   - Gradient wipe mask
6. Integrate with AnimationManager
7. Add configuration options

### Phase 3: Build & Organization
8. Output UMD router version to project root (not in dist)
9. Keep offline.html and animations.css built into router (not separate)
10. No changes to dist folder structure

### Phase 4: Documentation
11. Update README.md with:
    - New feature description
    - Usage examples
    - Default configuration (all features enabled)
    - Updated UMD size
    - Location of UMD file in project root
12. Update Russian README if needed

### Phase 5: Testing & Validation
13. Test animations work with existing pages
14. Verify UMD file output to root
15. Test fallback to standard CSS animations when mask not supported
16. Test console logging for unsupported browsers

## 8. Dependencies Analysis
- **AnimationManager** → MaskAnimationModule (extends)
- **Router** → AnimationManager (uses)
- **Build config** → Output structure (affects)
- **Documentation** → All changes (references)

**Ordering Constraints:**
1. Research must come before implementation
2. Module implementation before integration
3. Build config before testing bundle
4. Documentation after all changes

**Shared Interfaces:**
- Animation interface in AnimationManager
- Configuration interface in config.ts

**Potential Conflicts:**
- Existing animation system might need interface updates
- Build output changes might affect existing deployment

## 9. Risks & Trade-offs
- **Risk**: CSS mask-image not supported in older browsers
  - **Mitigation**: Provide fallback or feature detection
- **Risk**: Increased bundle size
  - **Mitigation**: Keep masks minimal, tree-shakeable
- **Risk**: Breaking existing animations
  - **Mitigation**: Extend, don't replace existing system
- **Trade-off**: Default all features on vs. opt-in
  - **Decision**: Default on for better UX, can be disabled

## 10. Validation Criteria
- [ ] CSS mask animations work on index.html
- [ ] 2 demo masks function correctly
- [ ] UMD file output to project root
- [ ] README updated accurately
- [ ] Default config enables all features
- [ ] Fallback to standard CSS animations when mask not supported
- [ ] Console logging for unsupported browsers
- [ ] No breaking changes to existing functionality

## 11. Rollback / Recovery Plan
- Remove mask animation module
- Revert AnimationManager changes
- Restore original build output location
- Revert README updates
- Keep git commits atomic for easy revert

## 12. Open Questions (Resolved)
1. **What specific CSS mask-image techniques are most performant for transitions?**
   - Use basic mask animations that work well, implement all standard techniques
   
2. **Should masks be defined as CSS classes or dynamically generated?**
   - Use CSS classes for better performance and smaller weight
   
3. **What's the optimal bundle folder structure?**
   - Don't modify `dist/` folder
   - Create separate archive/bundle in project root (not in dist)
   - Output UMD router version directly to root for easy download
   - offline.html and animations.css are already built into router
   
4. **How to handle browser compatibility for mask-image?**
   - Log to console when not supported
   - Fall back to standard CSS animations (not mask-based)
   
5. **Should there be a fallback for unsupported browsers?**
   - Yes, fall back to standard CSS animations when mask not supported