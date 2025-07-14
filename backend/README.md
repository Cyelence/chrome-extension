# 🚀 Digital Wardrobe Backend

A flagship, production-ready backend for the Digital Wardrobe Chrome Extension, built with enterprise-grade architecture and modern best practices.

## 🏗️ Architecture Overview

This backend is architected as a premium, scalable system using:

- **TypeScript** - Full type safety and modern JavaScript features
- **Node.js + Express** - Fast, reliable web server
- **PostgreSQL + Prisma** - Robust database with modern ORM
- **JWT + Sessions** - Hybrid authentication for security
- **Winston** - Structured logging system
- **Zod** - Runtime type validation
- **Argon2** - Secure password hashing
- **Redis** - Caching and session storage (optional)

## 📋 Prerequisites

- Node.js 18.0.0+
- PostgreSQL 12+
- Redis (optional, for caching)
- npm 8.0.0+

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd digital-wardrobe-backend

# Install dependencies
npm install

# Copy environment configuration
cp environment.example .env

# Generate Prisma client
npm run db:generate
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb digital_wardrobe

# Run database migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### 3. Environment Configuration

Edit `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/digital_wardrobe"

# Security
JWT_SECRET="your-super-secret-jwt-key-minimum-32-chars"
SESSION_SECRET="your-session-secret-minimum-32-chars"

# Server
PORT=3001
NODE_ENV=development
```

### 4. Start Development Server

```bash
# Development with hot reload
npm run dev

# Production build
npm run build
npm start

# Run tests
npm test
```

## 🛠️ Development

### Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration management
│   ├── controllers/    # HTTP request handlers
│   ├── middleware/     # Express middleware
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic layer
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── validation/     # Input validation schemas
├── prisma/             # Database schema and migrations
├── tests/              # Test files
└── logs/               # Application logs
```

### Key Features

- **🔐 Authentication**: JWT + session hybrid with Argon2 password hashing
- **🗃️ Database**: PostgreSQL with Prisma ORM and optimized queries
- **📊 Analytics**: Built-in user analytics and insights
- **🔍 Search**: Full-text search with PostgreSQL
- **📦 Caching**: Redis integration for performance
- **🚨 Monitoring**: Comprehensive logging and error tracking
- **🔒 Security**: Rate limiting, CORS, input validation
- **📱 Real-time**: WebSocket support for live updates
- **🌐 API**: RESTful API with OpenAPI/Swagger documentation

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build production bundle
npm start              # Start production server

# Database
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run database migrations
npm run db:push        # Push schema to database
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Seed database with test data
npm run db:reset       # Reset database

# Testing & Quality
npm test               # Run tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage report
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues
npm run format         # Format code with Prettier
npm run type-check     # Check TypeScript types

# Docker
npm run docker:build   # Build Docker image
npm run docker:run     # Run Docker container
```

## 🔧 API Documentation

### Authentication Endpoints

```http
POST /api/v1/auth/register      # Register new user
POST /api/v1/auth/login         # Login user
POST /api/v1/auth/refresh       # Refresh access token
POST /api/v1/auth/logout        # Logout user
POST /api/v1/auth/reset-password # Request password reset
```

### Item Management

```http
GET    /api/v1/items            # Get user items (filtered, paginated)
POST   /api/v1/items            # Create new item
GET    /api/v1/items/:id        # Get item by ID
PUT    /api/v1/items/:id        # Update item
DELETE /api/v1/items/:id        # Delete item
GET    /api/v1/items/search     # Search items
POST   /api/v1/items/import     # Bulk import items
```

### Collections

```http
GET    /api/v1/collections      # Get user collections
POST   /api/v1/collections      # Create collection
GET    /api/v1/collections/:id  # Get collection
PUT    /api/v1/collections/:id  # Update collection
DELETE /api/v1/collections/:id  # Delete collection
```

### Analytics

```http
GET /api/v1/analytics/stats     # Get user statistics
GET /api/v1/analytics/insights  # Get spending insights
GET /api/v1/analytics/trends    # Get fashion trends
```

## 🚀 Production Deployment

### Docker Deployment

```bash
# Build and run with Docker
docker build -t digital-wardrobe-backend .
docker run -p 3001:3001 digital-wardrobe-backend
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | JWT signing secret (min 32 chars) |
| `SESSION_SECRET` | ✅ | Session secret (min 32 chars) |
| `PORT` | ❌ | Server port (default: 3001) |
| `NODE_ENV` | ❌ | Environment (development/production) |
| `REDIS_URL` | ❌ | Redis connection URL |
| `CORS_ORIGIN` | ❌ | Allowed CORS origins |

### Production Checklist

- [ ] Set strong JWT_SECRET and SESSION_SECRET
- [ ] Configure PostgreSQL with proper credentials
- [ ] Set up Redis for caching (recommended)
- [ ] Configure CORS origins
- [ ] Set up SSL/TLS termination
- [ ] Configure log rotation
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline

## 📊 Performance & Monitoring

### Health Checks

```http
GET /health                     # Basic health check
GET /health/detailed           # Detailed health with dependencies
```

### Metrics

The backend includes comprehensive monitoring:

- **Request Metrics**: Response times, error rates, throughput
- **Database Metrics**: Query performance, connection pool status
- **Authentication Metrics**: Login attempts, token usage
- **Business Metrics**: User engagement, item statistics

### Logging

Structured logging with Winston:

```javascript
import { logger } from '@/utils/logger';

logger.info('User action', { userId, action: 'item_created', itemId });
logger.error('Database error', { error, query });
```

## 🔒 Security Features

- **Authentication**: JWT tokens with refresh mechanism
- **Authorization**: Role-based access control
- **Password Security**: Argon2 hashing with salt
- **Rate Limiting**: Configurable request limits
- **Input Validation**: Comprehensive validation with Zod
- **CORS**: Cross-origin resource sharing configuration
- **Security Headers**: Helmet.js security middleware
- **Session Management**: Secure session handling

## 🧪 Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run linting and tests
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

---

## 🎯 Premium Features

This flagship backend includes enterprise-grade features:

- **Horizontal Scalability**: Stateless design for easy scaling
- **Microservices Ready**: Modular architecture for service extraction
- **Event-Driven**: Built-in event system for real-time updates
- **Multi-tenancy**: Support for multiple organizations
- **Advanced Analytics**: Machine learning ready data structure
- **Integration Ready**: Webhooks, REST APIs, GraphQL support
- **Compliance**: GDPR, CCPA ready with data privacy controls

## 💡 Architecture Decisions

- **Prisma ORM**: Chosen for type safety and excellent developer experience
- **Argon2**: Industry standard for password hashing
- **JWT + Sessions**: Hybrid approach for security and scalability
- **PostgreSQL**: Robust ACID compliance and JSON support
- **Winston**: Structured logging for production observability
- **TypeScript**: Full type safety for enterprise reliability

This backend is designed to handle millions of users while maintaining code quality, security, and performance. It's built with the mindset of a senior engineer creating a flagship product. 