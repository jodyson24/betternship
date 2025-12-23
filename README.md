# Betternship Interview Test - Payment Application

A full-stack payment management application with real-time updates using Socket.IO, SQLite database, and React frontend.

## Tech Stack

- **Backend:** Express.js, SQLite3, Socket.IO, CORS
- **Frontend:** React 19, Socket.IO Client
- **Testing:** Jest, Supertest

## Installation

```bash
npm run install-all
```

Installs both backend and frontend dependencies.

## Running

```bash
npm run dev        # Start both backend and frontend (with hot-reload)
npm start          # Start backend server only
npm run server     # Start backend with Nodemon
npm run prod       # Build and run in production
```

- Backend runs on http://localhost:8556
- Frontend runs on http://localhost:3000 (dev mode)

## Testing

### Run All Tests
Execute backend and frontend tests together:

```bash
npm test
```

### Run Backend Tests Only
Test the Express API and database operations:

```bash
npm run test:backend
```

### Run Frontend Tests Only
Test React components:

```bash
npm run test:frontend
```

### Run Tests in Watch Mode
Continuously run tests during development:

```bash
npm run test:watch
```bash
npm test              # Run all tests (backend + frontend)
npm run test:backend  # Backend tests only
npm run test:frontend # Frontend tests only
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/payments` | Get all payments |
| GET | `/payments/:id` | Get payment by ID |
| POST | `/payments` | Create payment |
| PUT | `/payments/:id` | Update payment |
| DELETE | `/payments/:id` | Delete payment |

**Request/Response:**
```json
// POST/PUT Request
{ "amount": 100.50, "currency": "USD" }

// Response
{ "id": 1, "amount": 100.50, "currency": "USD" }
```
**Syncing Payments:**
1. When any CRUD operation completes, `syncPayments()` is triggered
2. All payments are retrieved from SQLite database
3. Data is written to `payments.json` file for backup/export
4. All connected Socket.IO clients receive real-time update via `paymentsUpdated` event

**Database Flow:**
- SQLite serves as the primary data store
- Queries use parameterized statements to prevent SQL injection
- Each operation validates changes and returns appropriate status codes

### 3. Real-Time Updates via Socket.IO

**Server Events:**
- `paymentsUpdated` - Sent to all clients when payments are synced
- `paymentCreated` - Sent when a new payment is created
- `paymentUpdated` - Sent when a payment is modified
- `paymentDeleted` - Sent when a payment is removed

**Client Connection:**
1. When a user connects, Socket.IO receives connection event
2. Server sends initial payments data to the connected client
3. Client maintains real-time sync with server state
4. When user disconnects, Socket.IO logs the disconnection

### 4. Create Payment Process

**Frontend:**
1. User submits form with amount and currency
2. POST request sent to `/payments` endpoint
3. Component state is updated upon success
4. Socket.IO broadcasts new payment to all clients

**Backend:**
1. Request body is parsed and validated
2. Payment is inserted into SQLite database
3. New ID is returned from database
4. `syncPayments()` is called to update JSON file
5. `paymentCreated` event is broadcast to all connected clients
6. Success response with ID is sent to client

### 5. Read Payment Process

**Get All Payments:**
1. Client sends GET request to `/payments`
2. Server queries SQLite for all payment records
3. Results are returned as JSON array
4. Frontend updates UI with payment list

**Get Single Payment:**
1. Client sends GET request to `/payments/:id`
2. Server queries SQLite for payment with specific ID
3. If found, payment data is returned
4. If not found, 404 error is returned

### 6. Update Payment Process

**Frontend:**
1. User edits payment details
2. PUT request sent to `/payments/:id` with new amount and currency
3. Component updates with new data upon success

**Backend:**
1. Request parameters and body are validated
2. Payment is updated in SQLite database
3. Changes counter is checked (0 = not found, 1+ = success)
4. `syncPayments()` is called to update JSON file
5. `paymentUpdated` event is broadcast to all clients
6. Success or error response is sent to client

### 7. Delete Payment Process

**Frontend:**
1. User clicks delete button for a payment
2. DELETE request sent to `/payments/:id`
3. Component removes payment from UI upon success

**Backend:**
1. Request parameters are validated
2. Payment is deleted from SQLite database
3. Changes counter is checked to verify deletion
4. `syncPayments()` is called to update JSON file
5. `paymentDeleted` event is broadcast to all clients
6. Success or error response is sent to client

### 8. Production Deployment Process

**Build Phase:**
1. React frontend is built using `npm run build`
2. Optimized production bundle is created in `client/build/`
3. Static files are minified and bundled

**Runtime Phase:**
1. NODE_ENV is set to 'production'
2. Express serves static files from `client/build/` directory
3. All unmatched routes serve `index.html` for React Router
4. API endpoints remain fully functional
5. Server runs on single port (8556) with both frontend and backend

### 9. Error Handling Process

**Database Errors:**
1. SQL errors are caught and logged
2. Generic 500 error response is sent to client
3. Connection errors prevent server startup

**Request Validation:**
1. Request bodies are parsed by express.json()
2. Missing fields are handled by SQL INSERT/UPDATE statements
3. Invalid IDs return 404 responses
4. How It Works

**Backend Flow:**
1. Express server runs on port 8556
2. SQLite database stores payments
3. Socket.IO broadcasts real-time updates to all clients
4. Payments are synced to `payments.json` after each operation

**Frontend Flow:**
1. React app connects via Socket.IO
2. Displays payments list
3. Submits CRUD requests to API endpoints
4. Receives real-time updates

**Data Persistence:**
- All payments stored in SQLite database
- Automatically synced to `payments.json`
- Real-time updates via Socket.IO events

**Production:**
- Frontend is built and served by Express
- Single server handles both frontend and backend
- All API endpoints remain functional

## Features

- Full CRUD operations (Create, Read, Update, Delete)
- Real-time updates with Socket.IO
- SQLite database persistence
- Production-ready deployment
- Comprehensive testing
- CORS support
- Hot-reload in development
- JSON data export