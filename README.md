Real-Time Inventory Management Dashboard
A full-stack, real-time inventory management web application built with Node.js, Express, Socket.io, and MongoDB. It features live stock tracking, instant multi-client synchronization via WebSockets, automated activity logs, and a dynamic USD/INR currency conversion toggle.
---
Features
Real-Time Multi-Client Sync: Powered by Socket.io WebSockets—stock updates, item additions, and deletions reflect instantaneously across all open browser tabs without page reloads.
Live Activity Logs: Automatically records and broadcasts an audit trail (`CREATED`, `STOCK_ADJUSTED`, `UPDATED`, `DELETED`) with timestamps and operator attribution.
Dynamic Currency Toggle (USD / INR): Switch seamlessly between US Dollars (`$`) and Indian Rupees (`₹`) across KPI valuations, unit prices, and line totals.
KPI Metrics & Low-Stock Alerts: Real-time calculation of total SKUs, total stock units, overall inventory valuation, and low-stock threshold highlights.
JWT & Role-Based Auth Ready: Includes `/api/auth/register` and `/api/auth/login` endpoints backed by `bcryptjs` and JSON Web Tokens.
---
Project Structure
```text
realtime-inventory-dashboard/
├── middleware/
│   └── authMiddleware.js      # JWT verification middleware
├── models/
│   ├── ActivityLog.js         # Mongoose schema for live audit logs
│   ├── Item.js                # Mongoose schema for inventory products
│   └── User.js                # Mongoose schema for operators/admins
├── public/
│   ├── css/
│   │   └── styles.css         # Responsive dashboard styling
│   ├── js/
│   │   └── app.js             # Socket.io client & DOM state management
│   └── index.html             # Main dashboard UI
├── routes/
│   ├── auth.js                # User registration & login routes
│   ├── inventory.js           # CRUD routes + Socket.io event emitters
│   └── logs.js                # Activity log retrieval route
├── .env.example               # Environment variable template
├── .gitignore                 # Git ignore rules
├── package.json               # Project dependencies and scripts
├── README.md                  # Project documentation
└── server.js                  # Express + Socket.io + MongoDB entry point
```
---
Prerequisites
Node.js (v18+ recommended)
MongoDB (local instance running on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI)
---
Quick Start
Extract the ZIP archive and open a terminal inside the project directory:
```bash
   cd realtime-inventory-dashboard
   ```
Install dependencies:
```bash
   npm install
   ```
Configure environment variables:
Copy `.env.example` to `.env` and adjust values if needed:
```bash
   cp .env.example .env
   ```
(On Windows PowerShell, use `copy .env.example .env`)
Start the server:
```bash
   npm start
   ```
For development with auto-reload:
```bash
   npm run dev
   ```
Open the dashboard:
Navigate to http://localhost:5000 in two or more browser tabs to test real-time WebSocket synchronization.
---
API Endpoints
Method	Endpoint	Description
`GET`	`/api/inventory`	Fetch all inventory items
`POST`	`/api/inventory`	Add a new inventory item (broadcasts `CREATED`)
`PUT`	`/api/inventory/:id`	Update stock quantity or item details (broadcasts `STOCK_ADJUSTED` / `UPDATED`)
`DELETE`	`/api/inventory/:id`	Remove an item (broadcasts `DELETED`)
`GET`	`/api/logs`	Retrieve the latest 50 activity logs
`GET`	`/api/config`	Fetch currency exchange rate configuration
`POST`	`/api/auth/register`	Register a new operator/admin account
`POST`	`/api/auth/login`	Authenticate and receive a JWT
