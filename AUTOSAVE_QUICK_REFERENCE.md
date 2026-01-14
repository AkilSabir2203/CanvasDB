# Autosave Quick Reference Guide

## What Was Implemented

### 1. Two-Step Schema Creation
- User selects template (Blank or Example)
- User enters schema name and description
- Schema immediately saved to MongoDB
- Canvas populated with template data
- Autosave automatically enabled

### 2. Automatic Save on Changes
- Any canvas change triggers autosave
- 3-second wait (debounce) to avoid spam
- Visual indicator shows save status
- Silent failures don't interrupt workflow

### 3. Visual Feedback
- 🔄 "Autosaving..." - Save in progress
- ✅ "Saved" - Save completed (2 sec)
- ❌ Error message - If save fails

## Quick Test

```
1. Click "Create" → Select "Blank" or "Example"
2. Enter schema name: "My First Schema"
3. Click "Create & Save"
4. Canvas loads with template (or blank)
5. Make a change (add field, move node)
6. Watch bottom-right for "Autosaving..." then "Saved"
7. Click filename → Open saved schema → Verify changes persisted
```

## Key Files

| File | Purpose |
|------|---------|
| `CreateSchemaModal.tsx` | Two-step creation with naming |
| `useAutosave.ts` | Autosave logic |
| `AutosaveStatus.tsx` | Visual save indicator |
| `autosave/[schemaId]/route.ts` | Save API endpoint |

## Configuration

**Debounce Time (how long to wait before saving):**
```typescript
// In Index.tsx
useAutosave(nodes, edges, {
  debounceMs: 3000, // 3 seconds
});
```

**Enable/Disable:**
```typescript
useAutosave(nodes, edges, {
  enabled: !!currentSchemaId, // Only when schema loaded
});
```

## What Triggers Autosave

✅ Add/remove nodes (entities)
✅ Move nodes (drag/drop)
✅ Edit fields (name, type, constraints)
✅ Add/remove relations (edges)
✅ Create new schema (immediately after naming)

## Status Indicators

- **Bottom-right of canvas** - Autosave status
- **Green checkmark** - Schema saved ✅
- **Spinning icon** - Saving in progress 🔄
- **Red error** - Save failed ❌

## Database Behavior

- Initial save: `/api/schemas/save` (POST)
- Subsequent saves: `/api/schemas/autosave/[schemaId]` (PATCH)
- Updates: `name`, `description`, `nodes`, `edges`, `updatedAt`
- Verifies: User authentication, schema ownership

## User Experience

**Before (Manual Save Only)**
```
Create → Canvas → Edit → Click Save Button → Save Modal
```

**After (Auto-save)**
```
Create → Name Schema → Save → Canvas → Edit → Auto-saved!
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Autosave not triggering | Check if schema is loaded (look at `currentSchemaId` in DevTools) |
| Changes not showing | Reload page and open schema again from filename button |
| "Autosaving..." stuck | Check network tab for failed request |
| Schema name required | Validation prevents empty names in creation modal |

## API Endpoints

### Create Schema (Initial Save)
```
POST /api/schemas/save
{
  "schemaName": "...",
  "description": "...",
  "nodes": [...],
  "edges": [...]
}
```

### Autosave (Update)
```
PATCH /api/schemas/autosave/[schemaId]
{
  "nodes": [...],
  "edges": [...]
}
```

### Load Schema
```
GET /api/schemas/[schemaId]
```

### List Schemas
```
GET /api/schemas/list
```

## Development Notes

- Autosave uses Zustand store: `useSaveSchemaStore`
- Components receive `currentSchemaId` from store
- Debounce prevents excessive API calls
- Change detection via JSON serialization
- All saves include ownership verification

## Next Steps

1. Test the complete workflow
2. Verify MongoDB saves schema data
3. Test error scenarios
4. Check performance with large schemas
5. Monitor API call frequency

---

**Ready to Test!** 🚀
