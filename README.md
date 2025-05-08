# Sales Hierarchy RBAC System

A Role-Based Access Control (RBAC) system to manage sales hierarchy, built with Node.js, Express.js, MySQL, and Prisma ORM.

## Features

- **Dynamic Role Creation**: Admin can create any number of user roles dynamically (e.g., ZSM → RSM → SM → etc.)
- **Hierarchical User Mapping**: Users can be mapped in a parent-child relationship
- **Lead Management**: Assign leads to Sales Managers and track their status
- **Hierarchical Visibility**: When an SM takes action on a lead, that action/status is visible to their parent roles recursively

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Environment Variables**: dotenv

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/profile` - Get current user profile

### Roles

- `GET /api/roles` - Get all roles
- `GET /api/roles/:id` - Get role by ID
- `POST /api/roles` - Create a new role (Admin only)
- `PUT /api/roles/:id` - Update a role (Admin only)
- `DELETE /api/roles/:id` - Delete a role (Admin only)

### Users

- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user (Admin only)
- `GET /api/users/:id/hierarchy` - Get user hierarchy (all users under this user)

### Leads

- `GET /api/leads` - Get all leads (filtered by user role and hierarchy)
- `GET /api/leads/:id` - Get lead by ID
- `POST /api/leads` - Create a new lead
- `PUT /api/leads/:id` - Update a lead
- `PATCH /api/leads/:id/status` - Update lead status
- `DELETE /api/leads/:id` - Delete a lead (Admin only)
- `GET /api/leads/:id/status-logs` - Get lead status logs

## Database Schema

The database schema is defined using Prisma and includes the following models:

- **Role**: Defines user roles in the system
- **User**: Stores user information and hierarchical relationships
- **Lead**: Represents sales leads
- **LeadStatusLog**: Tracks changes to lead status

## Setup and Installation

1. Clone the repository:

   ```
   git clone https://github.com/ashokBhambare/salesRepo.git
   cd salesRepo
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:

   ```
   NODE_ENV=development
   PORT=3000
   DATABASE_URL="mysql://username:password@localhost:3306/sales_hierarchy"
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=1d
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
   JWT_REFRESH_EXPIRES_IN=7d
   ```

4. Set up the database:

   ```
   npx prisma migrate dev
   ```

5. Seed the database with initial data:

   ```
   npm run prisma:seed
   ```

6. Start the server:
   ```
   npm run dev
   ```

## Development

- **Start development server**: `npm run dev`
- **Generate Prisma client**: `npm run prisma:generate`
- **Run database migrations**: `npm run prisma:migrate`
- **Seed the database**: `npm run prisma:seed`

## Sample Users (from seed data)

- **Admin**: admin@example.com / admin123
- **ZSM**: zsm@example.com / password123
- **RSM**: rsm1@example.com, rsm2@example.com / password123
- **SM**: sm1@example.com, sm2@example.com, sm3@example.com / password123

## License

ISC

External commit
