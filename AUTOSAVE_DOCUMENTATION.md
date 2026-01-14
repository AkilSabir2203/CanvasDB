# Autosave Feature Documentation

## Overview
The autosave feature automatically saves schema changes to MongoDB whenever any schema data is modified. This ensures that no work is lost and provides a seamless user experience.

## Autosave Triggers

Autosave activates automatically when:
1. **Nodes Added or Removed** - New entities created or deleted from the canvas
2. **Node Position Changes** - Entities dragged/dropped to new positions
3. **Fields Edited** - Entity attributes added, modified, or removed
4. **Constraints Modified** - Field constraints changed (optional, list, etc.)
5. **Relations Added or Removed** - Connections between entities created or deleted
6. **Schema Name or Description Changed** - Metadata updates via Save modal
7. **New Schema Created** - After selecting Blank or Example in Create Schema modal

## How It Works

### 1. Change Detection
- The `useAutosave` hook monitors all node and edge changes in React Flow
- Uses deep serialization to detect meaningful changes (not position-only changes for performance)
- Ignores duplicate saves by comparing current state to last saved state

### 2. Debouncing
- Autosave waits 3 seconds after the last change before saving
- This prevents excessive API calls while user is actively editing
- Configurable via `debounceMs` parameter in `useAutosave` hook

### 3. Smart Conditions
- Only triggers if a schema is currently loaded (`currentSchemaId` is set)
- Skips saving if there are no actual changes
- Prevents concurrent saves (only one autosave request at a time)

### 4. Serialization
- Converts React Flow nodes/edges to MongoDB-storable format via `serializeSchema()`
- Preserves field constraints, types, positions, and relation metadata
- Validates schema structure before saving

## Components & Hooks

### `useAutosave` Hook
Located in: `app/hooks/useAutosave.ts`

```typescript
const { isAutosaving, performAutosave } = useAutosave(nodes, edges, {
  enabled: true,
  debounceMs: 3000,
  onSaving: () => {},
  onSaved: () => {},
  onError: (error) => {},
});
```

**Parameters:**
- `nodes`: Array of React Flow nodes
- `edges`: Array of React Flow edges
- `config.enabled`: Enable/disable autosave (default: true)
- `config.debounceMs`: Delay before saving in milliseconds (default: 3000)
- `config.onSaving`: Callback when save starts
- `config.onSaved`: Callback when save completes
- `config.onError`: Callback on save error

**Returns:**
- `isAutosaving`: Boolean indicating if currently autosaving
- `performAutosave`: Function to manually trigger autosave

### `AutosaveStatus` Component
Located in: `app/components/canvas/AutosaveStatus.tsx`

Displays visual indicator showing:
- **Saving spinner** - During autosave operation
- **Green checkmark + "Saved"** - When autosave completes (2 sec display)
- **Red alert + error message** - On autosave failure

Position: Fixed bottom-right corner (above toolbar)

## API Endpoint

### PATCH `/api/schemas/autosave/[schemaId]`

**Request:**
```json
{
  "nodes": [...],
  "edges": [...]
}
```

**Response:**
```json
{
  "message": "Schema autosaved successfully",
  "schemaId": "...",
  "updatedAt": "2025-01-15T..."
}
```

**What it does:**
1. Verifies user authentication and schema ownership
2. Deletes all existing models/relations for the schema
3. Creates new models with fields from current nodes
4. Creates new relations from current edges
5. Updates schema's `updatedAt` timestamp
6. Tracks `lastModifiedBy` for audit purposes

## Integration Points

### Canvas Component (`app/components/canvas/Index.tsx`)
- Imports `useAutosave` hook and `AutosaveStatus` component
- Calls `useAutosave` with current nodes/edges
- Enables autosave only when `currentSchemaId` is set (after schema load/create)
- Renders `AutosaveStatus` component to show save state

### Store Integration (`useSaveSchemaStore`)
- Tracks `currentSchemaId` - Set when schema is created or loaded
- Tracks `isSaving` - Set during save operations
- Used by autosave hook to determine when to trigger saves

## User Experience

### Timeline
1. User makes changes to canvas (add node, edit field, etc.)
2. Change is reflected immediately on screen (React Flow)
3. 3-second countdown starts (with debouncing)
4. Spinning indicator appears saying "Autosaving..."
5. API call to `/api/schemas/autosave/[schemaId]`
6. "Saved" checkmark appears for 2 seconds when complete
7. Process repeats with next change

### Error Handling
- If autosave fails, error message displays (red alert)
- User can continue working - error doesn't block editing
- Manual save via "Save" button always works
- Browser console logs full error details for debugging

## Configuration

### Debounce Time
Adjust autosave delay (currently 3 seconds):

```typescript
// In Index.tsx
useAutosave(nodes, edges, {
  enabled: !!currentSchemaId,
  debounceMs: 5000, // Change to 5 seconds
});
```

### Disable Autosave
```typescript
useAutosave(nodes, edges, {
  enabled: false,
});
```

### Custom Callbacks
```typescript
useAutosave(nodes, edges, {
  enabled: !!currentSchemaId,
  debounceMs: 3000,
  onSaving: () => console.log('Autosave started'),
  onSaved: () => console.log('Autosave completed'),
  onError: (error) => console.error('Autosave failed:', error),
});
```

## Performance Considerations

1. **Debouncing** - Prevents API spam while user actively edits
2. **Change Detection** - Only saves when meaningful changes occur
3. **Serialization Optimization** - Uses JSON.stringify comparison
4. **Concurrent Save Prevention** - Only one autosave request at a time
5. **Silent Failures** - Autosave errors don't interrupt user workflow

## Testing Autosave

1. **Create Schema**: Click "Create" → Select Blank → Canvas loads
2. **Edit Content**: Add fields, change names, reposition nodes
3. **Watch Indicator**: "Autosaving..." appears after 3 seconds of inactivity
4. **Verify Save**: "Saved" checkmark confirms successful autosave
5. **Load Document**: Click filename button → Select saved schema → Verify changes persisted

## File Structure

```
app/
├── hooks/
│   ├── useAutosave.ts              # Main autosave hook
│   ├── useSaveSchemaStore.ts       # Store with currentSchemaId, isSaving
│   └── useCreateSchemaModal.ts     # Sets currentSchemaId on schema create
│
├── components/canvas/
│   ├── Index.tsx                   # Integrates useAutosave
│   └── AutosaveStatus.tsx          # Visual indicator
│
├── api/schemas/
│   └── autosave/[schemaId]/
│       └── route.ts                # PATCH endpoint
│
└── libs/
    └── schemaSerializer.ts         # serializeSchema() for conversion
```

## Future Enhancements

1. **Autosave Frequency Settings** - User configurable debounce time
2. **Autosave History** - View autosave snapshots
3. **Offline Support** - Save to IndexedDB when offline
4. **Selective Autosave** - Choose what triggers autosave
5. **Autosave Notifications** - Optional toasts for each save
6. **Bandwidth Optimization** - Delta updates instead of full schema
