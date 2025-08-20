# Database Integration for Locker System

## ✅ Implementation Complete

The database integration has been successfully implemented with the following features:

### 1. **API Service Layer** (`frontend/src/services/lockerApi.ts`)
- Converts between database schema format and application format
- Handles all CRUD operations (Create, Read, Update, Delete)
- Maps database status codes to application status
- Provides batch operations for efficiency
- Includes connection testing

### 2. **Enhanced Store** (`frontend/src/stores/lockerStore.ts`)
- Added database integration flags:
  - `isOnlineMode`: Toggle between local and database mode
  - `isSyncing`: Shows when data is being synchronized
  - `lastSyncTime`: Tracks last successful sync
  - `connectionStatus`: Shows connection state (connected/disconnected/error)
- Modified actions to support database operations:
  - `addLocker()`: Creates locally, then saves to database if online
  - `updateLocker()`: Updates locally, then syncs to database
  - `deleteLocker()`: Deletes locally, then removes from database
- New database methods:
  - `toggleOnlineMode()`: Switches between offline and online modes
  - `loadLockersFromDatabase()`: Fetches all lockers from database
  - `syncToDatabase()`: Batch saves all lockers to database

### 3. **UI Controls** (`frontend/src/pages/LockerPlacementFigma.vue`)
- Database connection toggle checkbox
- Real-time status indicators:
  - 🔄 Syncing indicator
  - ✅ Connected/synced status
  - ❌ Error status
- Manual sync button for explicit synchronization
- Shows last sync time

## 🎯 Key Features

### Graceful Degradation
- Application works fully offline if database is unavailable
- Database errors don't break the application
- Automatic fallback to local storage

### Immediate UI Updates
- UI responds instantly to user actions
- Database synchronization happens in the background
- No waiting for server responses during normal operations

### Backward Compatibility
- All existing functionality preserved
- Animations continue to work
- Local test data initialization still available

## 📋 Testing Checklist

### Offline Mode (Default)
- [x] Application loads without database
- [x] Can add, update, delete lockers locally
- [x] Animations work correctly
- [x] Test data initialization works

### Online Mode
- [ ] Toggle database connection
- [ ] Load existing lockers from database
- [ ] Add new locker and verify it saves to database
- [ ] Update locker position and verify sync
- [ ] Delete locker and verify removal from database
- [ ] Manual sync button works

### Error Handling
- [ ] Application continues working when database is down
- [ ] Error messages display appropriately
- [ ] Can switch back to offline mode

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the frontend directory:

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Enable/disable features
VITE_ENABLE_API=true
```

### Database Schema Mapping

| App Field | Database Field | Type | Notes |
|-----------|---------------|------|-------|
| id | LOCKR_CD | number | Auto-increment primary key |
| number | LOCKR_LABEL | string | Floor plan number (A-01) |
| frontViewNumber | LOCKR_NO | number | Front view number (101) |
| x | X | number | X position |
| y | Y | number | Y position |
| status | LOCKR_STAT | string | Status code mapping |
| zoneId | LOCKR_KND | string | Zone identifier |
| typeId | LOCKR_TYPE_CD | string | Locker type code |

### Status Code Mapping

| Database Code | App Status | Description |
|--------------|------------|-------------|
| 00 | available | Available for use |
| 01 | occupied | Currently occupied |
| 02 | occupied | Reserved (treated as occupied) |
| 03 | maintenance | Under maintenance |
| 04 | maintenance | Disabled (treated as maintenance) |
| 05 | expired | Expired |

## 🚀 Usage

### Starting in Offline Mode (Default)
1. Run the application: `npm run dev`
2. Application works with local data only
3. All changes are stored in memory

### Enabling Database Mode
1. Ensure backend API is running
2. Click "데이터베이스 연동" checkbox in the sidebar
3. System will test connection and load data
4. Status indicator shows connection state

### Manual Synchronization
1. Make changes in online mode
2. Click "수동 동기화" button
3. All local changes are pushed to database
4. Last sync time is displayed

## 🛡️ Security Considerations

- No sensitive data is stored locally
- API authentication can be added via tokens
- All database operations go through the API layer
- Input validation on both client and server sides

## 📝 Notes

- Temporary IDs (starting with "temp-") are replaced with database IDs after saving
- Parent-child relationships are maintained during sync
- The system uses optimistic updates for better UX
- Database operations are non-blocking

## 🔄 Future Enhancements

- [ ] Real-time updates via WebSocket
- [ ] Conflict resolution for multi-user scenarios
- [ ] Offline queue for changes made while disconnected
- [ ] Automatic retry with exponential backoff
- [ ] Compression for large datasets
- [ ] Pagination for better performance