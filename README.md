# Lend A Hand

A full-stack community assistance platform designed to connect neighbors who need help with people nearby who are willing to provide it.

Originally developed as a Franklin University Computer Science practicum project by a six-person Agile team.

---

## Overview

Lend A Hand provides a structured way for community members to request and offer everyday assistance, including tasks such as:

- Grocery pickup
- Transportation
- Pet care
- Household assistance
- Other neighborhood requests

The application combines user authentication, role-based access control, request workflows, notifications, administrative tools, and location-based filtering in a full-stack web application.

---

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose

### Authentication & Security

- JSON Web Tokens (JWT)
- Role-Based Access Control (RBAC)
- Protected routes
- Input validation

### Development & Deployment

- Git / GitHub
- REST APIs
- Docker
- Agile development workflow

---

## Core Features

### Community Requests

Users can create and manage requests for assistance within their community.

Requests include structured information that allows volunteers to understand what help is needed and where it is needed.

### Location-Based Discovery

Lend A Hand supports geographic filtering to help users find relevant requests based on location and distance.

### Authentication & Access Control

The application includes authenticated user sessions and protected functionality based on user roles.

### Request Workflow

Requests move through defined states as they are created, accepted, completed, or otherwise updated.

### Notifications

Users receive application feedback as request activity and status change.

### Administrative Tools

Administrative functionality supports application oversight and management.

### Feedback & Support

The platform includes user feedback, ratings, support resources, and informational pages.

---

## Architecture

```text
React / Vite Frontend
        |
        | REST API / JSON
        v
Node.js + Express Backend
        |
        | Mongoose
        v
MongoDB
```

The frontend and backend are maintained as separate applications within the same repository.

---

## Project Structure

```text
Lend-A-Hand/
|
|-- backend/          Express API, database models, authentication
|
|-- frontend/         React / Vite client application
|
|-- .gitignore
|-- package.json
`-- README.md
```

---

## Running Locally

### Prerequisites

- Node.js
- npm
- MongoDB connection

Clone the repository:

```bash
git clone https://github.com/KLFalcone/Lend-A-Hand.git
cd Lend-A-Hand
```

### Backend

```bash
cd backend
npm install
```

Create a local `.env` file using the provided example configuration and supply the required environment variables.

Then run:

```bash
npm run dev
```

The backend runs locally on:

```text
http://localhost:5000
```

### Frontend

From the project root:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs locally on:

```text
http://localhost:5173
```

---

## Security

Environment variables and credentials are intentionally excluded from source control.

Sensitive configuration such as database credentials and authentication secrets should be supplied through local environment variables and should never be committed to the repository.

---

## Development Process

Lend A Hand was developed by a six-person team using an Agile workflow.

Development included:

- Feature branches
- Pull requests
- Code reviews
- Git-based collaboration
- Incremental feature development
- Frontend/backend integration
- Testing and debugging across shared application workflows

The repository preserves the original team commit history.

---

## My Role

I served as **Team Lead** while also contributing directly to development across the application.

My work included areas such as:

- REST API development
- JWT authentication and role-based access control
- Protected application routes
- Request lifecycle workflows
- Notifications and administrative functionality
- Geographic request filtering
- Frontend/backend integration
- Team coordination and GitHub workflow management

---

## Original Team

Lend A Hand was developed collaboratively as a Franklin University practicum project.

### COMP 495

- Kat Falcone
- Nick Ocheltree

### COMP 394

- Katie O'Connell
- Jack Gifford

### COMP 294

- Avery Miller
- April Giljahn

All contributors retain credit for their work. This repository preserves the project's original Git history while making the completed project available through my personal portfolio.

---

## Project Goal

Lend A Hand was built around a simple idea:

**Make it easier for people in the same community to find, organize, and provide help when someone needs it.**