# KnowNet API Documentation

The KnowNet API provides a RESTful interface for managing your knowledge network. This API enables you to create web-based interfaces and integrate KnowNet with other applications.

## Getting Started

### Running the API Server

```bash
# Development mode (with hot reload)
npm run api:dev

# Production mode (requires build)
npm run api:build

# Or build and run separately
npm run build
npm run api
```

The API server runs on `http://localhost:3000` by default. You can change the port by setting the `PORT` environment variable.

### Configuration

Copy `.env.example` to `.env` and configure as needed:

```bash
cp .env.example .env
```

## API Endpoints

### Base URL

```
http://localhost:3000/api/v1
```

### Statement Management

#### Get All Statements
```
GET /api/v1/statements
```

Response:
```json
{
  "total": 42,
  "statements": [
    {
      "id": "uuid",
      "type": "axiom",
      "content": "Knowledge is power",
      "confidence": 0.9,
      "tags": ["philosophy"],
      "derivedFrom": [],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Get Single Statement
```
GET /api/v1/statements/:id
```

Returns statement with parent and dependent relationships.

#### Create Statement
```
POST /api/v1/statements
```

Body:
```json
{
  "type": "axiom",
  "content": "New belief",
  "confidence": 0.8,
  "tags": ["tag1", "tag2"],
  "derivedFrom": []
}
```

#### Update Statement
```
PUT /api/v1/statements/:id
```

Body (partial updates allowed):
```json
{
  "content": "Updated content",
  "confidence": 0.9,
  "tags": ["new-tag"]
}
```

#### Delete Statement
```
DELETE /api/v1/statements/:id
```

Note: Cannot delete statements with dependents.

#### Get Derivation Chain
```
GET /api/v1/statements/:id/chain
```

#### Get Statement Dependents
```
GET /api/v1/statements/:id/dependents
```

### Query & Search

#### Advanced Search
```
POST /api/v1/query/search
```

Body:
```json
{
  "type": "theory",
  "tags": ["philosophy", "science"],
  "content": "search text",
  "confidence": {
    "min": 0.5,
    "max": 1.0
  }
}
```

#### Get Statistics
```
GET /api/v1/query/stats
```

#### Get Orphaned Statements
```
GET /api/v1/query/orphans
```

#### Get Most Derived Statements
```
GET /api/v1/query/most-derived?limit=10
```

#### Get Deepest Statements
```
GET /api/v1/query/deepest?limit=10
```

#### Check Contradictions
```
GET /api/v1/query/contradictions
```

#### Find Path Between Statements
```
GET /api/v1/query/path/:fromId/:toId
```

#### Get Related Statements
```
GET /api/v1/query/related/:id?maxDistance=2
```

#### Get Tag Analytics
```
GET /api/v1/query/tags/analytics
```

### Graph Visualization

#### Get Graph Data
```
GET /api/v1/graph/data?includeOrphans=true&maxLabelLength=50
```

Returns nodes and edges for visualization libraries.

#### Get Graph Statistics
```
GET /api/v1/graph/stats
```

#### Export to DOT Format
```
GET /api/v1/graph/export/dot?title=My%20Graph&rankdir=TB&includeOrphans=true
```

Downloads a Graphviz DOT file.

#### Get Subgraph Around Node
```
GET /api/v1/graph/subgraph/:id?depth=2
```

Returns nodes and edges within specified depth from a central node.

#### Get Node Details
```
GET /api/v1/graph/node/:id
```

### AI Operations

#### Generate Theory
```
POST /api/v1/ai/generate-theory
```

Body:
```json
{
  "sourceStatementIds": ["id1", "id2"]
}
```

#### Check for Duplicates
```
POST /api/v1/ai/check-duplicates
```

Body:
```json
{
  "content": "Statement to check"
}
```

#### Get Knowledge Context
```
POST /api/v1/ai/knowledge-context
```

Body:
```json
{
  "query": "Search query",
  "tags": ["optional", "tags"]
}
```

#### Get Review Suggestions
```
GET /api/v1/ai/review-suggestions
```

#### Generate Multiple Theories (Batch)
```
POST /api/v1/ai/generate-theories-batch
```

Body:
```json
{
  "count": 3,
  "sourceStatementIds": ["id1", "id2"]
}
```

#### Analyze Statement Relationships
```
POST /api/v1/ai/analyze-relationships
```

Body:
```json
{
  "statementId": "uuid"
}
```

## Error Handling

All errors follow this format:

```json
{
  "error": {
    "message": "Error description",
    "statusCode": 404,
    "details": {},
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## CORS

The API supports CORS for web browser access. Configure allowed origins in the `.env` file.

## Frontend Integration Example

```javascript
// Fetch all statements
const response = await fetch('http://localhost:3000/api/v1/statements');
const data = await response.json();

// Create a new statement
const newStatement = await fetch('http://localhost:3000/api/v1/statements', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'axiom',
    content: 'New knowledge',
    confidence: 0.8,
    tags: ['important']
  })
});

// Get graph data for visualization
const graphData = await fetch('http://localhost:3000/api/v1/graph/data');
const { nodes, edges } = await graphData.json();
```

## Next Steps

With this API, you can now build:
- React/Vue/Angular frontends with interactive graph visualizations
- Mobile apps that sync with your knowledge base
- Integrations with other tools and services
- Collaborative knowledge management systems

Popular graph visualization libraries for the frontend:
- **vis.js** - Easy to use, good for medium-sized graphs
- **D3.js** - Highly customizable, great for complex visualizations
- **Cytoscape.js** - Powerful graph analysis features
- **React Flow** - Modern React-based graph library
- **Sigma.js** - High-performance for large graphs