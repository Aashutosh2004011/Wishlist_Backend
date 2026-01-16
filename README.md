# Buzdealz Backend API

Production-ready Express backend for the Buzdealz Wishlist feature with deal alerts.

## Features

- RESTful API endpoints for wishlist management
- Supabase authentication integration
- PostgreSQL database with Drizzle ORM
- Role-based access control (subscriber vs non-subscriber)
- Idempotent operations with unique constraints
- Analytics tracking for wishlist events
- Zod schema validation
- Comprehensive error handling
- Edge case handling for expired/disabled deals

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle ORM
- **Authentication**: Supabase Auth
- **Validation**: Zod
- **Language**: TypeScript

## Prerequisites

- Node.js 20 or higher
- PostgreSQL database (Supabase configured)
- Supabase account with Auth enabled

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
DATABASE_URL=postgresql://postgres.zneqrrrswthwvjcgpwix:[YOUR-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://zneqrrrswthwvjcgpwix.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your-secret-key
PORT=3001
NODE_ENV=development
```

3. Generate and run database migrations:
```bash
npm run db:generate
npm run db:migrate
```

## Development

Start the development server with hot reload:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## Production Build

Build the TypeScript code:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## API Endpoints

### Wishlist Management

#### Get User Wishlist
```http
GET /api/wishlist
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "dealId": "uuid",
      "alertEnabled": false,
      "createdAt": "2024-01-15T10:00:00Z",
      "deal": {
        "id": "uuid",
        "title": "Product Name",
        "description": "Product description",
        "originalPrice": "99.99",
        "currentPrice": "69.99",
        "discountPercentage": 30,
        "imageUrl": "https://...",
        "merchantName": "Store Name",
        "merchantUrl": "https://...",
        "category": "Electronics",
        "isActive": true,
        "isExpired": false,
        "expiresAt": "2024-02-01T00:00:00Z",
        "bestAvailablePrice": "69.99",
        "status": "active"
      }
    }
  ],
  "count": 1
}
```

#### Add to Wishlist
```http
POST /api/wishlist
Authorization: Bearer <token>
Content-Type: application/json

{
  "dealId": "uuid",
  "alertEnabled": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Deal added to wishlist",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "dealId": "uuid",
    "alertEnabled": false,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

**Error (Non-subscriber trying to enable alerts):**
```json
{
  "error": "Alerts are only available for subscribers",
  "message": "Please upgrade to a subscription to enable deal alerts",
  "code": "SUBSCRIBER_REQUIRED"
}
```

#### Remove from Wishlist
```http
DELETE /api/wishlist/:dealId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Deal removed from wishlist"
}
```

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

## Database Schema

### Users Table
```typescript
{
  id: uuid (PK)
  email: string (unique)
  name: string
  isSubscriber: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Deals Table
```typescript
{
  id: uuid (PK)
  title: string
  description: string
  originalPrice: decimal(10,2)
  currentPrice: decimal(10,2)
  discountPercentage: integer
  imageUrl: string (nullable)
  merchantName: string
  merchantUrl: string
  category: string
  isActive: boolean
  isExpired: boolean
  expiresAt: timestamp (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Wishlist Table
```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> users.id)
  dealId: uuid (FK -> deals.id)
  alertEnabled: boolean
  createdAt: timestamp
  UNIQUE INDEX: (userId, dealId)
}
```

### Wishlist Analytics Table
```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> users.id)
  dealId: uuid (FK -> deals.id)
  action: string ('add' | 'remove' | 'alert_enabled' | 'alert_disabled')
  metadata: json (nullable)
  createdAt: timestamp
}
```

## Authentication

The API uses Supabase Auth with JWT tokens. All protected endpoints require:

```http
Authorization: Bearer <supabase_access_token>
```

The middleware automatically:
- Validates the token with Supabase
- Creates user record if first login
- Attaches user object to `req.user`
- Checks subscriber status for alert features

## Key Features

### Idempotency
- Unique constraint on `(userId, dealId)` prevents duplicate wishlist entries
- Returns existing entry with 200 status if already wishlisted

### Role-Based Access Control
- Non-subscribers can add items to wishlist
- Only subscribers can enable alerts
- Graceful degradation with clear error messages

### Analytics Tracking
- All wishlist actions are tracked asynchronously
- Non-blocking analytics (failures logged but don't affect user experience)
- Events: `add`, `remove`, `alert_enabled`, `alert_disabled`

### Edge Case Handling
- Expired deals marked with `isExpired: true`
- Disabled deals marked with `isActive: false`
- Status field computed: `'active' | 'expired' | 'disabled'`
- Best available price tracking

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error type",
  "message": "Detailed message"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Resource created
- `400` - Validation error
- `401` - Authentication required
- `403` - Insufficient permissions
- `404` - Resource not found
- `409` - Conflict (duplicate)
- `500` - Internal server error

## Testing

Manual testing steps:

1. Start the server:
```bash
npm run dev
```

2. Test health endpoint:
```bash
curl http://localhost:3001/health
```

3. Test wishlist endpoints with authentication:
```bash
# Get token from Supabase Auth
TOKEN="your_access_token"

# Get wishlist
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/wishlist

# Add to wishlist
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dealId":"uuid","alertEnabled":false}' \
  http://localhost:3001/api/wishlist

# Remove from wishlist
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/wishlist/uuid
```

## Database Management

View migrations:
```bash
npm run db:studio
```

Generate new migration:
```bash
npm run db:generate
```

Apply migrations:
```bash
npm run db:migrate
```

## Project Structure

```
backend/
├── src/
│   ├── db/
│   │   ├── schema.ts          # Drizzle schema definitions
│   │   ├── index.ts           # Database client
│   │   ├── migrate.ts         # Migration runner
│   │   └── migrations/        # SQL migrations
│   ├── middleware/
│   │   ├── auth.ts            # Authentication middleware
│   │   └── validate.ts        # Zod validation middleware
│   ├── routes/
│   │   └── wishlist.ts        # Wishlist endpoints
│   ├── services/
│   │   └── analytics.ts       # Analytics tracking service
│   ├── validators/
│   │   └── wishlist.ts        # Zod schemas
│   ├── types/
│   │   └── express.d.ts       # Express type extensions
│   └── index.ts               # Express app setup
├── package.json
├── tsconfig.json
├── drizzle.config.ts
└── README.md
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `PORT` | Server port | No (default: 3001) |
| `NODE_ENV` | Environment mode | No (default: development) |

## Security

- All sensitive routes protected by authentication
- JWT token validation via Supabase
- SQL injection prevention via Drizzle ORM
- Input validation with Zod schemas
- CORS configured for frontend origin
- Environment variables for secrets

## Performance

- Database connection pooling (max: 10 connections)
- Indexes on foreign keys and unique constraints
- Efficient joins for wishlist queries
- Async analytics tracking (non-blocking)
- Query result caching in frontend via React Query

## License

MIT
