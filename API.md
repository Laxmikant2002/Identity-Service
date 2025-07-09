# API Documentation

## Base URL
- **Production**: `https://fluxkart-identity-service.onrender.com`
- **Development**: `http://localhost:3000`

> **Important**: Use **JSON Body** format for all POST requests, not form-data.

## Endpoints

### POST /api/identify

Consolidates customer identity based on provided email and/or phone number.

#### Request
- **Method**: POST
- **URL**: `/api/identify`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
```

**Requirements:**
- At least one of `email` or `phoneNumber` must be provided
- Email must be a valid email format
- Phone number must contain at least 7 digits

#### Response
- **Status**: 200 OK
- **Content-Type**: `application/json`

```json
{
  "contact": {
    "primaryContactId": "number",
    "emails": ["string", "string", ...],
    "phoneNumbers": ["string", "string", ...],
    "secondaryContactIds": ["number", "number", ...]
  }
}
```

#### Response Fields
- `primaryContactId`: ID of the primary contact record
- `emails`: Array of all emails associated with this identity (primary contact's email first)
- `phoneNumbers`: Array of all phone numbers associated with this identity (primary contact's phone first)
- `secondaryContactIds`: Array of IDs for all secondary contact records

#### Example Requests

**Create new contact:**
```json
{
  "email": "user@example.com",
  "phoneNumber": "1234567890"
}
```

**Link existing contacts:**
```json
{
  "email": "existing@example.com",
  "phoneNumber": "9876543210"
}
```

**Find by email only:**
```json
{
  "email": "user@example.com"
}
```

**Find by phone only:**
```json
{
  "phoneNumber": "1234567890"
}
```

#### Error Responses

**400 Bad Request - Missing data:**
```json
{
  "error": "At least one of email or phoneNumber must be provided"
}
```

**400 Bad Request - Invalid email:**
```json
{
  "error": "Invalid email format"
}
```

**400 Bad Request - Invalid phone:**
```json
{
  "error": "Invalid phone number format"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "Detailed error message"
}
```

### GET /health

Health check endpoint to verify service status.

#### Response
```json
{
  "status": "OK",
  "timestamp": "2023-04-01T12:00:00.000Z"
}
```

## Business Logic

### Contact Linking Rules
1. Contacts are linked if they share either email or phone number
2. The oldest contact becomes the "primary" contact
3. All other related contacts become "secondary" contacts
4. When multiple contact groups are connected, they merge under the oldest primary contact

### Contact Creation Rules
1. If no existing contacts match the request, create a new primary contact
2. If existing contacts match but the exact combination doesn't exist, create a secondary contact
3. If multiple separate contact groups are connected by the request, merge them and optionally create a new secondary contact

### Response Rules
1. Primary contact's email and phone number appear first in their respective arrays
2. All unique emails and phone numbers from the contact group are included
3. Secondary contact IDs are listed in creation order
