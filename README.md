# Buzdealz Backend API

Production-ready Express backend for the Buzdealz deal tracking platform with wishlist management and deal alerts.

## Features

- RESTful API endpoints for deals and wishlist management
- Supabase authentication integration
- PostgreSQL database with Drizzle ORM
- Role-based access control (subscriber vs non-subscriber)
- Idempotent operations with unique constraints
- Analytics tracking for wishlist events
- Zod schema validation
- Comprehensive error handling
- Health check endpoint
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
DATABASE_URL=postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-x-region.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your-secret-key
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

3. Generate and run database migrations:
```bash
npm run db:generate
npm run db:migrate
```

4. (Optional) Seed the database with sample deals:
```bash
npm run db:seed
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

### Health Check

Check if the API is running properly.

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "message": "API is working fine! Let's gooooo 🚀",
  "timestamp": "2024-01-15T10:00:00Z",
  "environment": "development"
}
```

---

### Deals Management

#### Get All Deals

Fetch all available deals.

```http
GET /api/deals
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
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
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
]
```

---

### Wishlist Management

#### Get User Wishlist

Fetch all items in the user's wishlist with deal details.

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
        "updatedAt": "2024-01-15T10:00:00Z",
        "bestAvailablePrice": "69.99",
        "status": "active"
      }
    }
  ],
  "count": 1
}
```

**Status Values:**
- `active` - Deal is currently active
- `expired` - Deal has passed its expiration date
- `disabled` - Deal is temporarily disabled

---

#### Add to Wishlist

Add a deal to the user's wishlist with optional alert settings.

```http
POST /api/wishlist
Authorization: Bearer <token>
Content-Type: application/json

{
  "dealId": "uuid",
  "alertEnabled": false
}
```

**Request Body:**
- `dealId` (string, required) - UUID of the deal to add
- `alertEnabled` (boolean, required) - Enable price alerts (subscribers only)

**Success Response (201):**
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

**Already Exists Response (200):**
```json
{
  "success": true,
  "message": "Deal already in wishlist",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "dealId": "uuid",
    "alertEnabled": false,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

**Error Response - Non-subscriber trying to enable alerts (403):**
```json
{
  "error": "Alerts are only available for subscribers",
  "message": "Please upgrade to a subscription to enable deal alerts",
  "code": "SUBSCRIBER_REQUIRED"
}
```

**Error Response - Deal not found (404):**
```json
{
  "error": "Deal not found"
}
```

---

#### Remove from Wishlist

Remove a deal from the user's wishlist.

```http
DELETE /api/wishlist/:dealId
Authorization: Bearer <token>
```

**URL Parameters:**
- `dealId` (string, required) - UUID of the deal to remove

**Success Response (200):**
```json
{
  "success": true,
  "message": "Deal removed from wishlist"
}
```

**Error Response - Item not found (404):**
```json
{
  "error": "Wishlist item not found"
}
```

---

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

### Quick Test Commands

1. Start the server:
```bash
npm run dev
```

2. Test health endpoint:
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "API is working fine! Let's gooooo 🚀",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "environment": "development"
}
```

3. Test deals endpoint (requires authentication):
```bash
TOKEN="your_access_token_from_supabase"
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/deals
```

4. Test wishlist endpoints:
```bash
# Get wishlist
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/wishlist

# Add to wishlist
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dealId":"uuid-here","alertEnabled":false}' \
  http://localhost:3001/api/wishlist

# Remove from wishlist
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/wishlist/uuid-here
```

## Database Management

View database in Drizzle Studio:
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

Seed database with sample data:
```bash
npm run db:seed
```

## Project Structure

```
backend/
├── src/
│   ├── db/
│   │   ├── schema.ts          # Drizzle schema definitions
│   │   ├── index.ts           # Database client
│   │   ├── migrate.ts         # Migration runner
│   │   ├── seed.ts            # Sample data seeder
│   │   └── migrations/        # SQL migrations
│   ├── middleware/
│   │   ├── auth.ts            # Authentication middleware
│   │   └── validate.ts        # Zod validation middleware
│   ├── routes/
│   │   ├── deals.ts           # Deals endpoints
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

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `SUPABASE_URL` | Supabase project URL | Yes | - |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes | - |
| `JWT_SECRET` | Secret for JWT signing | Yes | - |
| `PORT` | Server port | No | 3001 |
| `NODE_ENV` | Environment mode | No | development |
| `FRONTEND_URL` | Frontend URL for CORS | No | http://localhost:5173 |

## Security

- All sensitive routes protected by authentication
- JWT token validation via Supabase
- SQL injection prevention via Drizzle ORM
- Input validation with Zod schemas
- CORS configured for frontend origin
- Environment variables for secrets
- Service role key never exposed to client

## Performance

- Database connection pooling (max: 10 connections)
- Indexes on foreign keys and unique constraints
- Efficient joins for wishlist queries
- Async analytics tracking (non-blocking)
- Query result caching in frontend via React Query

## Available NPM Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start           # Start production server
npm run db:generate # Generate database migrations
npm run db:migrate  # Run database migrations
npm run db:studio   # Open Drizzle Studio
npm run db:seed     # Seed database with sample data
```

## License

MIT
