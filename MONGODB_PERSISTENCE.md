# MongoDB Persistence Implementation - Complete Guide

## Overview
This implementation adds full MongoDB persistence for database schemas using Prisma ORM. Schemas can be saved, loaded, and managed with complete serialization/deserialization support.

## Database Models

### 1. **DatabaseSchema**
Main schema document that stores:
- `id`: Unique MongoDB ObjectId
- `name`: Schema name  
- `description`: Optional description
- `userId`: Reference to owner
- `createdAt`, `updatedAt`: Timestamps
- `lastModifiedBy`: Email of last modifier
- Relations to `SchemaModel` and `SchemaRelation`

### 2. **SchemaModel**
Represents a Prisma model (Entity):
- `id`: Unique ObjectId
- `schemaId`: Reference to parent schema
- `nodeId`: React Flow node ID
- `name`: Model name
- `position`: { x, y } coordinates
- `fields`: Array of SchemaField documents
- Relations to parent and child models

### 3. **SchemaField**
Represents a field in a model:
- `id`: Unique ObjectId
- `modelId`: Reference to parent model
- `name`: Field name
- `type`: Data type (String, Int, Boolean, DateTime, etc.)
- `isOptional`: Optional flag
- `isList`: Array type flag
- `constraints`: Array of field constraints
- `defaultValue`: Default value if any

### 4. **SchemaRelation**
Represents relationships between models:
- `id`: Unique ObjectId
- `schemaId`: Reference to parent schema
- `edgeId`: React Flow edge ID
- `sourceModelId`: Reference to source model
- `targetModelId`: Reference to target model
- `relationType`: "1-1", "1-m", "m-1", "m-n"

## API Routes

### Save Schema
**POST** `/api/schemas/save`

Request:
```json
{
  "schemaName": "My Schema",
  "description": "Optional description",
  "nodes": [...],  // React Flow nodes
  "edges": [...]   // React Flow edges
}
```

Response:
```json
{
  "message": "Schema saved successfully",
  "schemaId": "..."
}
```

### Load Schema
**GET** `/api/schemas/[schemaId]`

Response:
```json
{
  "schema": {
    "id": "...",
    "name": "...",
    "description": "...",
    "createdAt": "...",
    "updatedAt": "...",
    "nodes": [...],  // React Flow nodes
    "edges": [...]   // React Flow edges
  }
}
```

### List User Schemas
**GET** `/api/schemas/list`

Response:
```json
{
  "schemas": [
    {
      "id": "...",
      "name": "...",
      "description": "...",
      "createdAt": "...",
      "updatedAt": "...",
      "lastModifiedBy": "...",
      "_count": {
        "models": 2,
        "relations": 1
      }
    }
  ]
}
```

### Delete Schema
**DELETE** `/api/schemas/delete/[schemaId]`

Response:
```json
{
  "message": "Schema deleted successfully"
}
```

### Update Schema Metadata
**PATCH** `/api/schemas/delete/[schemaId]`

Request:
```json
{
  "name": "New Name",
  "description": "New Description"
}
```

## Serialization/Deserialization

### serializeSchema(nodes, edges)
Converts React Flow nodes and edges to MongoDB-storable format:
- Extracts node data into model documents
- Maps edge relations with proper references
- Builds field constraints from attributes

### deserializeSchema(data)
Converts MongoDB data back to React Flow format:
- Creates nodes from models with preserved positions
- Creates edges from relations
- Reconstructs field constraints

## Zustand Store: useSaveSchemaStore

### State
- `isLoading`: Boolean
- `isSaving`: Boolean
- `schemas`: Array of saved schemas
- `currentSchemaId`: Currently loaded schema ID

### Methods
- `saveSchema(schemaName, description, nodes, edges)`: Save current canvas
- `loadSchema(schemaId)`: Load a saved schema
- `loadSchemas()`: Fetch user's schemas
- `deleteSchema(schemaId)`: Delete a schema
- `updateSchemaMetadata(schemaId, name, description)`: Update name/description
- `setCurrentSchemaId(schemaId)`: Update current schema

## UI Components

### SaveSchemaModal
Modal with two tabs:
- **Save Tab**: Input schema name and description
- **Load Tab**: Browse and select saved schemas

Features:
- Tab switching
- Auth gating (requires login)
- Toast notifications
- Loading states
- Empty state handling

### Integration Points
- Added to `Index.tsx` (canvas page)
- Toolbar button triggers modal
- Auto-loads schemas when opening Load tab

## Usage Example

```typescript
// Save schema
const schemaId = await useSaveSchemaStore.getState().saveSchema(
  "My Database",
  "User management system",
  nodes,
  edges
);

// Load schema
const data = await useSaveSchemaStore.getState().loadSchema(schemaId);
setNodes(data.nodes);
setEdges(data.edges);

// List schemas
await useSaveSchemaStore.getState().loadSchemas();
const schemas = useSaveSchemaStore.getState().schemas;
```

## Security
- All operations require authenticated user session
- Schema ownership verified before load/update/delete
- User's email stored with modifications for audit trail
- Cascading deletes prevent orphaned data

## Performance
- Indexed queries on userId, schemaId, nodeId
- Unique constraints prevent duplicate nodes per schema
- Efficient relation lookups with proper references
- Lazy loading via React hooks

## Future Enhancements
- Schema versioning/history
- Collaborative editing
- Export to Prisma schema format
- Template schemas
- Schema sharing with other users
- Diff/comparison between versions
