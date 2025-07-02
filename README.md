# FluxKart Identity Service

A comprehensive web service for consolidating customer identities across multiple purchases on FluxKart.com. This service intelligently links customer contacts based on shared email addresses and phone numbers, solving the challenge of identifying when different contact information belongs to the same person.

## 🎯 Problem Statement

When customers like Dr. Emmett Brown make multiple purchases using different email addresses and phone numbers, FluxKart needs to:
- Link these separate contacts to the same identity
- Maintain a primary contact record (oldest contact)
- Track all associated email addresses and phone numbers
- Provide a unified view of customer identity

## 🚀 Features

- **Identity Reconciliation**: Links contacts based on shared email or phone numbers
- **Primary Contact Management**: Designates oldest contact as primary
- **Contact Merging**: Intelligently merges separate identity groups when new information connects them
- **RESTful API**: Single `/identify` endpoint for all identity operations
- **MySQL Integration**: Robust database storage with TypeORM
- **Data Validation**: Comprehensive input validation for email and phone formats
- **Soft Deletes**: Support for soft deletion of contacts

## 🏗️ Technical Stack

- **Backend**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MySQL with TypeORM ORM
- **Validation**: Custom middleware with format validation
- **Environment**: dotenv for configuration management

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL server (v5.7 or higher)
- npm or yarn package manager

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
cd fluxkart-identity-service
npm install
```

### 2. Database Setup

Create a MySQL database:
```sql
CREATE DATABASE fluxkart_identity;
```

### 3. Environment Configuration

Update the `.env` file with your database credentials:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DB_NAME=fluxkart_identity

# Application Configuration
NODE_ENV=development
PORT=3000
```

### 4. Start the Service

#### Development Mode (with auto-reload)
```bash
npm run dev
```

#### Production Mode
```bash
npm run build
npm start
```

## 📡 API Documentation

### POST `/api/identify`

Consolidates customer identity based on provided email and/or phone number.

#### Request Format
```json
{
  "email": "emmett@doc.com",
  "phoneNumber": "123456"
}
```

**Note**: At least one of `email` or `phoneNumber` must be provided.

#### Response Format
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["emmett@doc.com", "brown@hill-valley.edu"],
    "phoneNumbers": ["123456", "17504205555"],
    "secondaryContactIds": [23, 27]
  }
}
```

#### Response Fields
- `primaryContactId`: ID of the primary (oldest) contact
- `emails`: Array of all unique emails, with primary contact's email first
- `phoneNumbers`: Array of all unique phone numbers, with primary contact's phone first
- `secondaryContactIds`: Array of all secondary contact IDs linked to the primary

### Health Check Endpoint

#### GET `/health`
```json
{
  "status": "OK",
  "timestamp": "2025-07-02T10:30:00.000Z"
}
```

## 🧠 Identity Logic

The service handles three main scenarios:

1. **New Customer**: Creates a new primary contact for completely new email/phone combinations
2. **Existing Customer**: Creates secondary contacts linked to existing primary when new information is provided
3. **Identity Merging**: Merges separate identity groups when connections are discovered, maintaining the oldest contact as primary

## 📊 Database Schema

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

## 💻 Usage Example

```bash
curl -X POST http://localhost:3000/api/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "phoneNumber": "1234567890"}'
```

## 🔧 Project Structure

```
fluxkart-identity-service/
├── src/
│   ├── entities/
│   │   └── Contact.ts          # TypeORM Contact entity
│   ├── controllers/
│   │   └── identityController.ts
│   ├── services/
│   │   └── identityService.ts  # Core business logic
│   ├── routes/
│   │   └── identityRoutes.ts   # API routes
│   ├── middleware/
│   │   └── validation.ts       # Input validation
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   ├── data-source.ts         # Database configuration
│   └── app.ts                 # Main application
├── .env                       # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🚦 Error Handling

The service includes comprehensive error handling:

- **400 Bad Request**: Invalid input format or missing required fields
- **500 Internal Server Error**: Database or server errors
- **404 Not Found**: Invalid API endpoints

## 🔒 Validation Rules

### Email Validation
- Must be a valid email format (`user@domain.com`)
- Basic regex pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

### Phone Number Validation
- Allows digits, spaces, hyphens, parentheses, and plus signs
- Minimum 7 digits after removing non-numeric characters
- Pattern: `/^[\+]?[\d\s\-\(\)]+$/`

##  License

ISC License - see LICENSE file for details
