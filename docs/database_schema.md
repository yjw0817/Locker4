# Locker4 Database Schema Documentation

## Overview
The database has been restructured to support a comprehensive parent-child locker hierarchy system with dual numbering for different view modes.

## Table Name Changes
- **Old**: `lockr_room` → **New**: `lockrs`
- **Old**: `lockr_room_hist` → **New**: `lockrs_hist`

## Main Table: `lockrs`

### Table Structure
```sql
-- Main locker table (renamed from lockr_room to lockrs)
CREATE TABLE lockrs (
  LOCKR_CD INT PRIMARY KEY AUTO_INCREMENT,
  COMP_CD VARCHAR(20),
  BCOFF_CD VARCHAR(20),
  LOCKR_KND VARCHAR(8),
  LOCKR_TYPE_CD VARCHAR(20),
  X INT,
  Y INT,
  LOCKR_LABEL VARCHAR(10),      -- Floor view number (e.g., "A-01")
  ROTATION INT DEFAULT 0,
  DOOR_DIRECTION VARCHAR(20),
  FRONT_VIEW_X INT,
  FRONT_VIEW_Y INT,
  GROUP_NUM INT,
  LOCKR_GENDR_SET VARCHAR(8),
  LOCKR_NO INT(14),             -- Front view number (e.g., 101, 102)
  PARENT_LOCKR_CD INT,          -- NULL = parent locker, value = child locker
  TIER_LEVEL INT DEFAULT 0,     -- 0 = parent, 1+ = child tier level
  BUY_EVENT_SNO VARCHAR(20),
  MEM_SNO VARCHAR(20),
  MEM_NM VARCHAR(20),
  LOCKR_USE_S_DATE VARCHAR(10),
  LOCKR_USE_E_DATE VARCHAR(10),
  LOCKR_STAT VARCHAR(2) DEFAULT '00',
  MEMO VARCHAR(500),
  UPDATE_BY VARCHAR(45),
  UPDATE_DT DATETIME,
  
  -- Foreign key constraint
  CONSTRAINT fk_parent_locker 
    FOREIGN KEY (PARENT_LOCKR_CD) 
    REFERENCES lockrs(LOCKR_CD) 
    ON DELETE RESTRICT,
    
  -- Indexes
  INDEX idx_comp_bcoff (COMP_CD, BCOFF_CD),
  INDEX idx_parent (PARENT_LOCKR_CD),
  INDEX idx_lockr_stat (LOCKR_STAT),
  INDEX idx_lockr_label (LOCKR_LABEL),
  INDEX idx_lockr_no (LOCKR_NO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Field Descriptions

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| LOCKR_CD | INT | Primary key, auto-increment | 1, 2, 3... |
| COMP_CD | VARCHAR(20) | Company code | "COMP001" |
| BCOFF_CD | VARCHAR(20) | Branch office code | "BR001" |
| LOCKR_KND | VARCHAR(8) | Locker zone/kind | "zone-1" |
| LOCKR_TYPE_CD | VARCHAR(20) | Locker type code | "TYPE01" |
| X | INT | X coordinate in floor view | 100 |
| Y | INT | Y coordinate in floor view | 200 |
| LOCKR_LABEL | VARCHAR(10) | Floor view number | "A-01", "B-02" |
| ROTATION | INT | Rotation angle in degrees | 0, 90, 180, 270 |
| DOOR_DIRECTION | VARCHAR(20) | Door opening direction | "LEFT", "RIGHT" |
| FRONT_VIEW_X | INT | X coordinate in front view | 50 |
| FRONT_VIEW_Y | INT | Y coordinate in front view | 100 |
| GROUP_NUM | INT | Group number for front view | 1, 2, 3... |
| LOCKR_GENDR_SET | VARCHAR(8) | Gender setting | "M", "F", "UNISEX" |
| LOCKR_NO | INT | Front view number | 101, 102, 103... |
| PARENT_LOCKR_CD | INT | Reference to parent locker | NULL or parent ID |
| TIER_LEVEL | INT | Hierarchy tier level | 0, 1, 2... |
| BUY_EVENT_SNO | VARCHAR(20) | Purchase event serial number | "EVT001" |
| MEM_SNO | VARCHAR(20) | Member serial number | "MEM001" |
| MEM_NM | VARCHAR(20) | Member name | "John Doe" |
| LOCKR_USE_S_DATE | VARCHAR(10) | Usage start date | "2024-01-01" |
| LOCKR_USE_E_DATE | VARCHAR(10) | Usage end date | "2024-12-31" |
| LOCKR_STAT | VARCHAR(2) | Locker status code | "00", "01"... |
| MEMO | VARCHAR(500) | Additional notes | Free text |
| UPDATE_BY | VARCHAR(45) | Last updated by | "admin" |
| UPDATE_DT | DATETIME | Last update timestamp | 2024-01-01 00:00:00 |

### Status Codes (LOCKR_STAT)

| Code | Status | Description |
|------|--------|-------------|
| 00 | Available | Locker is available for assignment |
| 01 | Occupied | Locker is currently occupied |
| 02 | Reserved | Locker is reserved |
| 03 | Maintenance | Under maintenance |
| 04 | Disabled | Temporarily disabled |
| 05 | Expired | Assignment has expired |

## History Table: `lockrs_hist`

```sql
-- History table for tracking changes
CREATE TABLE lockrs_hist (
  LOCKR_HIST_ID INT PRIMARY KEY AUTO_INCREMENT,
  LOCKR_CD INT,
  COMP_CD VARCHAR(20),
  BCOFF_CD VARCHAR(20),
  LOCKR_KND VARCHAR(8),
  LOCKR_TYPE_CD VARCHAR(20),
  X INT,
  Y INT,
  LOCKR_LABEL VARCHAR(10),
  ROTATION INT DEFAULT 0,
  DOOR_DIRECTION VARCHAR(20),
  FRONT_VIEW_X INT,
  FRONT_VIEW_Y INT,
  GROUP_NUM INT,
  LOCKR_GENDR_SET VARCHAR(8),
  LOCKR_NO INT(14),
  PARENT_LOCKR_CD INT,
  TIER_LEVEL INT DEFAULT 0,
  BUY_EVENT_SNO VARCHAR(20),
  MEM_SNO VARCHAR(20),
  MEM_NM VARCHAR(20),
  LOCKR_USE_S_DATE VARCHAR(10),
  LOCKR_USE_E_DATE VARCHAR(10),
  LOCKR_STAT VARCHAR(2),
  MEMO VARCHAR(500),
  UPDATE_BY VARCHAR(45),
  UPDATE_DT DATETIME,
  HIST_ACTION VARCHAR(10),      -- 'INSERT', 'UPDATE', 'DELETE'
  HIST_TIMESTAMP DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_lockr_cd (LOCKR_CD),
  INDEX idx_hist_timestamp (HIST_TIMESTAMP)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Key Concepts

### 1. Parent-Child Hierarchy
- **Parent Lockers**: Original lockers from floor view (PARENT_LOCKR_CD = NULL)
- **Child Lockers**: Dynamically created in front view via "Add Tiers" (TIER_LEVEL > 0)
- **Tier Levels**: 
  - 0 = Parent locker
  - 1 = First tier child
  - 2 = Second tier child
  - etc.

### 2. Dual Numbering System
- **LOCKR_LABEL**: Used for floor placement and zone management (e.g., "A-01", "B-02")
- **LOCKR_NO**: Used for front view assignment and member allocation (e.g., 101, 102, 103)

### 3. View Modes
- **Floor View**: Uses X, Y coordinates and LOCKR_LABEL
- **Front View**: Uses FRONT_VIEW_X, FRONT_VIEW_Y coordinates and LOCKR_NO

## Sample Queries

### Get All Parent Lockers
```sql
SELECT * FROM lockrs 
WHERE PARENT_LOCKR_CD IS NULL 
  AND COMP_CD = 'COMP001' 
  AND BCOFF_CD = 'BR001';
```

### Get Children of a Parent Locker
```sql
SELECT * FROM lockrs 
WHERE PARENT_LOCKR_CD = 123
ORDER BY TIER_LEVEL, LOCKR_NO;
```

### Get Available Lockers
```sql
SELECT * FROM lockrs 
WHERE LOCKR_STAT = '00' 
  AND COMP_CD = 'COMP001';
```

### Add Tiers to Parent Locker
```sql
-- Example: Add 3 tiers to parent locker with LOCKR_CD = 100
INSERT INTO lockrs (
  COMP_CD, BCOFF_CD, LOCKR_KND, LOCKR_TYPE_CD,
  PARENT_LOCKR_CD, TIER_LEVEL, LOCKR_NO, LOCKR_STAT,
  FRONT_VIEW_X, FRONT_VIEW_Y
) 
SELECT 
  COMP_CD, BCOFF_CD, LOCKR_KND, LOCKR_TYPE_CD,
  100, tier_num, (LOCKR_NO * 10) + tier_num, '00',
  FRONT_VIEW_X, FRONT_VIEW_Y + (tier_num * 40)
FROM lockrs 
CROSS JOIN (SELECT 1 as tier_num UNION SELECT 2 UNION SELECT 3) tiers
WHERE LOCKR_CD = 100;
```

## Migration Notes

### From Old Schema (lockr_room) to New Schema (lockrs)
1. Rename table: `RENAME TABLE lockr_room TO lockrs;`
2. Add new columns if not exist:
   ```sql
   ALTER TABLE lockrs 
   ADD COLUMN IF NOT EXISTS LOCKR_LABEL VARCHAR(10),
   ADD COLUMN IF NOT EXISTS LOCKR_NO INT(14),
   ADD COLUMN IF NOT EXISTS PARENT_LOCKR_CD INT,
   ADD COLUMN IF NOT EXISTS TIER_LEVEL INT DEFAULT 0;
   ```
3. Update existing data:
   ```sql
   UPDATE lockrs SET 
     LOCKR_LABEL = number,  -- Copy existing number to LOCKR_LABEL
     TIER_LEVEL = 0         -- Mark all existing as parent lockers
   WHERE LOCKR_LABEL IS NULL;
   ```

## Best Practices

### 1. Parent Locker Deletion
Always check for children before deleting a parent locker:
```sql
-- Check for children
SELECT COUNT(*) FROM lockrs WHERE PARENT_LOCKR_CD = ?;
-- If count > 0, either delete children first or prevent deletion
```

### 2. History Tracking
Insert into history table on every change:
```sql
INSERT INTO lockrs_hist 
SELECT NULL, l.*, 'UPDATE', NOW() 
FROM lockrs l 
WHERE LOCKR_CD = ?;
```

### 3. Unique Constraints
Ensure unique combinations:
- (COMP_CD, BCOFF_CD, LOCKR_LABEL) for floor view uniqueness
- (COMP_CD, BCOFF_CD, LOCKR_NO) for front view uniqueness

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lockrs` | Get all lockers |
| GET | `/api/lockrs/:id` | Get specific locker |
| POST | `/api/lockrs` | Create new locker |
| PUT | `/api/lockrs/:id` | Update locker |
| DELETE | `/api/lockrs/:id` | Delete locker |
| POST | `/api/lockrs/:id/tiers` | Add tiers to parent |
| GET | `/api/lockrs/:id/children` | Get child lockers |

## Security Considerations

1. Always validate COMP_CD and BCOFF_CD from session/token
2. Check user permissions before allowing updates
3. Log all changes to history table
4. Prevent SQL injection by using parameterized queries
5. Validate tier level limits (e.g., max 3 tiers)

## Performance Optimization

1. Use indexes on frequently queried fields
2. Partition table by COMP_CD if data grows large
3. Archive old history records periodically
4. Use connection pooling for database connections
5. Cache parent-child relationships in application layer