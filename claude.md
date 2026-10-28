# Blog Platform — Architecture Contract (claude.md)

## 1. Project Overview

This project is a **web-based blog platform** with:

* Public content access (no authentication required)
* Optional user authentication
* Restricted authoring system (only specific users can create posts)

### Core Rules

* Anyone can read published posts
* Users can register and log in
* Only users with `AUTHOR` or `ADMIN` role can create/manage posts
* Only **2 users** will initially have author permissions (seeded)

---

## 2. Architecture Style

* **Type:** Modular Monolith
* **Separation:** Frontend + Backend (independent apps)

### Stack

#### Frontend

* Next.js (App Router)
* Tailwind CSS
* Axios

#### Backend

* Node.js
* Express.js
* PostgreSQL
* JWT (authentication)
* bcrypt (password hashing)

---

## 3. Infrastructure

### Database Containerization

The PostgreSQL database is executed inside a **Docker container**.

### Requirements

* Docker
* Docker Compose

### Purpose

* Isolate database environment
* Ensure consistency across development machines
* Simplify setup and onboarding
* Avoid local PostgreSQL installation issues

### Docker Strategy

* Use official PostgreSQL image
* Persist data using Docker volumes
* Expose default PostgreSQL port (`5432`)
* Configure credentials via environment variables

### Example docker-compose.yml

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16
    container_name: blog_postgres
    restart: always
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin
      POSTGRES_DB: blog_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Backend Connection

The backend must connect using environment variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin
DB_NAME=blog_db
```

### Notes

* The backend must NOT hardcode database credentials
* All configuration must come from `.env`
* Docker container must be running before starting backend

---

## 4. Backend Architecture

### Layered Pattern

```
Route -> Controller -> Service -> Repository -> Database
```

### Responsibilities

* **Route:** defines endpoint
* **Controller:** handles request/response
* **Service:** business logic
* **Repository:** database queries
* **Database:** persistence

---

## 5. Backend Folder Structure

```
backend/
  src/
    modules/
      auth/
      users/
      posts/
      roles/

    middleware/
      auth.middleware.js
      role.middleware.js
      error.middleware.js

    config/
      db.js
      env.js

    utils/
      slug.js
      jwt.js
      hash.js

    database/
      migrations/
      seeds/

    app.js
    server.js
```

---

## 6. Frontend Architecture

### Structure

```
frontend/
  src/
    app/
      login/
      posts/
      dashboard/

    components/
    services/
    hooks/
    lib/
    types/
```

---

## 7. Core Modules

### auth

* login
* register
* JWT generation
* password validation

### users

* profile management
* account creation

### posts

* CRUD operations
* publish/unpublish
* public fetching

### roles

* role validation
* permission checks

---

## 8. Roles and Authorization

### Roles

```
USER
AUTHOR
ADMIN
```

### Permissions

| Action         | USER | AUTHOR | ADMIN |
| -------------- | ---- | ------ | ----- |
| Read posts     | ✔️   | ✔️     | ✔️    |
| Login/Register | ✔️   | ✔️     | ✔️    |
| Create posts   | ❌    | ✔️     | ✔️    |
| Edit own posts | ❌    | ✔️     | ✔️    |
| Edit any post  | ❌    | ❌      | ✔️    |
| Delete posts   | ❌    | ✔️     | ✔️    |

---

## 9. Database Schema

### users

```sql
id UUID PRIMARY KEY
name VARCHAR
email VARCHAR UNIQUE
password_hash TEXT
is_active BOOLEAN
created_at TIMESTAMP
updated_at TIMESTAMP
```

### roles

```sql
id UUID PRIMARY KEY
name VARCHAR UNIQUE
```

### user_roles

```sql
user_id UUID FK
role_id UUID FK
PRIMARY KEY (user_id, role_id)
```

### posts

```sql
id UUID PRIMARY KEY
title VARCHAR
slug VARCHAR UNIQUE
summary TEXT
content TEXT
status VARCHAR
author_id UUID FK
published_at TIMESTAMP
created_at TIMESTAMP
updated_at TIMESTAMP
```

---

## 10. Post Status

```
DRAFT
PUBLISHED
ARCHIVED
```

---

## 11. API Design

### Auth

```
POST /auth/register
POST /auth/login
GET  /auth/me
```

### Public Posts

```
GET /posts
GET /posts/:slug
```

### Protected Posts

```
POST   /dashboard/posts
PUT    /dashboard/posts/:id
DELETE /dashboard/posts/:id
PATCH  /dashboard/posts/:id/publish
PATCH  /dashboard/posts/:id/archive
```

---

## 12. Authentication

* Password hashing: bcrypt
* Token: JWT

### Flow

1. User logs in
2. Backend validates credentials
3. JWT is generated
4. Client sends token in Authorization header

```
Authorization: Bearer <token>
```

---

## 13. Middleware

### auth.middleware

* validates JWT
* injects user into request

### role.middleware

* checks if user has required role

---

## 14. Business Rules

### Public Access

* Only `PUBLISHED` posts are visible

### Author Rules

* Authors can only edit their own posts

### Admin Rules

* Admin can edit/delete any post

---

## 15. Slug Strategy

* Generated from title
* Must be unique
* Used in public URLs

Example:

```
/posts/how-to-learn-nodejs
```

---

## 16. Security Rules

* Hash passwords with bcrypt
* Never expose password_hash
* Validate all inputs
* Protect all write routes
* Do not trust frontend for permissions
* Use environment variables for secrets

---

## 17. MVP Scope

### Included

* Public posts listing
* Post detail page
* Login system
* Author dashboard
* Post CRUD
* Publish/unpublish

### Not Included

* Comments
* Likes
* File upload
* Categories/tags (optional later)

---

## 18. Seed Strategy

* Create 2 users manually
* Assign them `AUTHOR`
* All others default to `USER`

---

## 19. Development Order

1. Database schema
2. Auth module
3. Role system
4. Posts module
5. Public endpoints
6. Dashboard
7. Frontend integration

---

## 20. Coding Rules

### DO

* Keep controllers thin
* Put logic in services
* Use validation (Zod)
* Use async/await
* Separate concerns

### DO NOT

* Put SQL in controllers
* Mix business logic with routes
* Trust frontend authorization

---

## 21. Future Improvements

* Refresh tokens (HttpOnly cookies)
* Rich text editor
* Comments system
* Tagging system
* Image uploads (S3 or similar)
* SEO improvements (metadata, sitemap)

---

## 22. Final Notes

This document is the **single source of truth** for:

* architecture
* business rules
* system design
* implementation constraints

Any generated code MUST follow this contract.

---

## 23. Implementation Log

### Implementation details

* Built a real backend under `backend/src` with modular layers for `auth`, `users`, `posts`, and `roles`
* Implemented real PostgreSQL repositories using `pg`
* Implemented real business services for registration, login, current user retrieval, profile retrieval, post CRUD, publishing, archiving, slug uniqueness, and RBAC enforcement
* Implemented real middleware for JWT authentication, role checks, and centralized error handling
* Implemented request validation with Zod
* Implemented utility modules for environment loading, database access, password hashing, JWT handling, slug generation, and error construction
* Implemented Express app/server wiring plus route modules for `/auth`, `/users`, `/posts`, and `/dashboard/posts`
* Added a SQL migration file and a seed script that creates the `USER`, `AUTHOR`, and `ADMIN` roles plus two author users
* Added `.env.example` with database, JWT, seed, and app configuration

### Test compliance

* The existing Vitest suite passes completely
* Verified result: `10` test files passed and `57` tests passed

### Decisions made

* Kept all service/controller/middleware modules builder-based so the tests can inject mocked dependencies without requiring a real database or environment during import
* Added `/users/me` as the concrete users-module profile route because `claude.md` defines profile management but does not provide a dedicated users API path
* Implemented inactive-user login blocking using the `is_active` field, even though it was not explicitly asserted by the generated tests, because the schema includes that state and it is consistent with the authentication model
* Masked all internal server failures as a generic `500` response in the error middleware because the tests require internal error details not to leak

### Adjustments

* The tests implied lazy dependency resolution, so configuration and database initialization were implemented lazily instead of at module import time
* The roles module was implemented primarily as a permission service because `claude.md` defines role validation and permission checks, but no standalone roles HTTP API
* Repositories were implemented with direct SQL and no ORM, matching the architecture and the implementation requirements

### Improvements

* Add dedicated migration orchestration for multiple migration files and rollback support
* Add refresh tokens and token revocation
* Add integration tests against a disposable PostgreSQL container
* Add structured request logging and security middleware such as rate limiting and Helmet
* Add richer author/admin workflows, audit trails, and pagination/filtering for posts
