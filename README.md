# FluxKart Identity Service

A web service for consolidating customer identities based on email and phone number.

## 🚀 **Live Deployment**

**Production API Endpoint**: `https://fluxkart-identity-service.onrender.com`

**API Endpoints:**
- **Identity Service**: `POST https://fluxkart-identity-service.onrender.com/api/identify`
- **Health Check**: `GET https://fluxkart-identity-service.onrender.com/health`

> **Note**: Please use **JSON Body** format (not form-data) for all API requests.

### Quick Test

```bash
# Test the live API endpoint
curl -X POST https://fluxkart-identity-service.onrender.com/api/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","phoneNumber":"1234567890"}'
```

## Problem Statement

When customers make multiple purchases using different email addresses and phone numbers, FluxKart needs to:
- Link these separate contacts to the same identity
- Maintain a primary contact record (oldest contact)
- Track all associated email addresses and phone numbers
- Provide a unified view of customer identity

## Features

- Identity Reconciliation: Links contacts based on shared email or phone numbers
- Primary Contact Management: Designates oldest contact as primary
- Contact Merging: Merges separate identity groups when new information connects them
- RESTful API: Single `/identify` endpoint for all identity operations
- Database Integration: Robust database storage with TypeORM
- Data Validation: Input validation for email and phone formats

## Technical Stack

- Backend: Node.js with TypeScript
- Framework: Express.js
- Database: MySQL/SQLite with TypeORM
- Validation: Custom middleware with format validation
- Environment: dotenv for configuration management

## Prerequisites

- Node.js (v14 or higher)
- MySQL server (v5.7 or higher) or SQLite for development
- npm package manager

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Copy environment configuration:
```bash
cp .env.example .env
```

4. For development (uses SQLite):
```bash
npm run dev
```

5. For production (requires MySQL configuration in .env):
```bash
npm run build
npm start
```

## Configuration

1. Copy the environment template:
```bash
cp .env.example .env
```

2. For development, the default settings work with SQLite (no additional configuration needed).

3. For production with MySQL, update `.env` with your database credentials:

```env
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DB_NAME=fluxkart_identity
PORT=3000
```

Create the MySQL database:
```sql
CREATE DATABASE fluxkart_identity;
```

## Docker Deployment

For containerized deployment:

```bash
# Build and start with Docker Compose (includes MySQL)
docker-compose up -d

# Or build Docker image manually
docker build -t fluxkart-identity-service .
docker run -p 3000:3000 -e NODE_ENV=development fluxkart-identity-service
```

## Usage

### Development
```bash
npm run dev          # Build and start once
npm run dev:watch    # Build in watch mode
```

### Production
```bash
npm run build
npm start
```

### Available Scripts
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start the production server
- `npm run dev` - Build and start for development
- `npm run dev:watch` - Build in watch mode
- `npm run clean` - Remove build artifacts

## API Documentation

### POST `/api/identify`

Consolidates customer identity based on provided email and/or phone number.

#### Request Format
```json
{
  "email": "user@example.com",
  "phoneNumber": "1234567890"
}
```

Note: At least one of `email` or `phoneNumber` must be provided.

#### Response Format
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["user@example.com", "user2@example.com"],
    "phoneNumbers": ["1234567890", "9876543210"],
    "secondaryContactIds": [2, 3]
  }
}
```

#### Response Fields
- `primaryContactId`: ID of the primary (oldest) contact
- `emails`: Array of all unique emails, with primary contact's email first
- `phoneNumbers`: Array of all unique phone numbers, with primary contact's phone first
- `secondaryContactIds`: Array of all secondary contact IDs linked to the primary

### GET `/health`

Health check endpoint.

```json
{
  "status": "OK",
  "timestamp": "2025-07-02T10:30:00.000Z"
}
```

## Identity Logic

The service handles three main scenarios:

1. **New Customer**: Creates a new primary contact for completely new email/phone combinations
2. **Existing Customer**: Creates secondary contacts linked to existing primary when new information is provided
3. **Identity Merging**: Merges separate identity groups when connections are discovered, maintaining the oldest contact as primary

## Database Schema

### Contact Table
```sql
CREATE TABLE contact (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phoneNumber VARCHAR(255) NULL,
    email VARCHAR(255) NULL,
    linkedId INT NULL,
    linkPrecedence ENUM('primary', 'secondary') DEFAULT 'primary',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME NULL,
    INDEX idx_email (email),
    INDEX idx_phoneNumber (phoneNumber),
    FOREIGN KEY (linkedId) REFERENCES contact(id)
);
```

## Project Structure

```
src/
├── entities/Contact.ts          # Contact entity
├── controllers/identityController.ts
├── services/identityService.ts  # Core business logic
├── routes/identityRoutes.ts
├── middleware/validation.ts
├── types/index.ts
├── data-source.ts              # Database config
└── app.ts                      # Main application
```

## Error Handling

- **400 Bad Request**: Invalid input format or missing required fields
- **500 Internal Server Error**: Database or server errors
- **404 Not Found**: Invalid API endpoints

## Validation Rules

### Email Validation
- Must be a valid email format
- Pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

### Phone Number Validation
- Allows digits, spaces, hyphens, parentheses, and plus signs
- Minimum 7 digits after removing non-numeric characters
- Pattern: `/^[\+]?[\d\s\-\(\)]+$/`

## License

ISC License
