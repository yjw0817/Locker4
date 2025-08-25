# Locker4 Frontend Documentation

## Documentation Structure

### Main Documentation
- **[LOCKER_SYSTEM.md](./LOCKER_SYSTEM.md)** - Complete locker placement system documentation

### Feature Documentation (`features/`)
- **copy-drag-fix.md** - Copy and drag functionality improvements
- **drag-overlap-fix.md** - Drag overlap prevention system
- **drag-selection-ui-fix.md** - Drag selection UI improvements
- **front-view-context-menu.md** - Context menu in front view
- **group-rotation-fix.md** - Group rotation center fix
- **locker-overlap-fix.md** - Locker overlap detection and prevention
- **parent-child-hierarchy-implementation.md** - Parent-child locker relationships
- **rotation-improvements-final.md** - Final rotation system improvements
- **snap-rotation-fix.md** - Snap system with rotation support

### Archive (`archive/`)
Obsolete or superseded documentation moved here for reference.

## Quick Links

### For Developers
1. Start with [LOCKER_SYSTEM.md](./LOCKER_SYSTEM.md) for overall system understanding
2. Check specific feature docs in `features/` for detailed implementations
3. Test scripts are in `/test-scripts/` directory

### Key Features
- **Rotation System**: Cumulative rotation tracking prevents visual glitches
- **Collision Detection**: Real-time overlap prevention during drag
- **Snap System**: Grid and adjacent locker snapping with rotation awareness
- **Group Operations**: Multi-locker selection, rotation, and manipulation

### Testing
Test scripts available in `/test-scripts/`:
- `test-overlap-final.js` - Test overlap detection
- `test-group-rotation-final.js` - Test group rotation
- Run in browser console at http://localhost:5174/

## Maintenance Notes

### Documentation Guidelines
1. Keep LOCKER_SYSTEM.md updated with major changes
2. Create new feature docs in `features/` for significant features
3. Move obsolete docs to `archive/` instead of deleting
4. Test scripts should stay in `/test-scripts/`

### Code-Documentation Sync
- Documentation must match actual code implementation
- If conflict exists, update documentation to match code
- Document actual behavior, not intended behavior

Last Updated: 2024-12-22