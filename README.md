# Lend A Hand

A full-stack community assistance platform designed to connect neighbors who need help with people nearby who are willing to provide it.

Originally developed as a Franklin University Computer Science practicum project by a six-person Agile team.

---

## Overview

Lend A Hand was built to make it easier for people within a community to request help, discover nearby opportunities to assist others, and manage those interactions in one place.

The platform supports everyday needs such as:

- Grocery pickup
- Transportation
- Pet care
- Household assistance
- Other neighborhood requests

Rather than relying on scattered messages or informal coordination, Lend A Hand provides a structured request workflow with authentication, location-based discovery, notifications, feedback, and administrative tools.

The application uses a React frontend, Express/Node.js backend, and MongoDB database connected through REST APIs.

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

Users can create and manage requests for assistance while providing the information volunteers need to understand what help is needed.

Requests are organized through defined states so both the requester and volunteer can follow the request from creation through completion.

### Location-Based Discovery

Geographic filtering helps users find relevant requests based on location and distance, making the platform more useful for assistance that depends on being nearby.

### Authentication & Access Control

JWT authentication and role-based access control protect user accounts and restrict functionality based on the user's role.

Protected routes ensure that authenticated functionality is only available to authorized users.

### Request Workflows

The application manages request activity through structured workflows for creating, joining, updating, and completing assistance requests.

This provides a consistent way to track what stage a request is in and who is involved.

### Notifications

Notifications provide feedback when activity occurs around a user's requests and help keep participants informed as request status changes.

### Administrative Tools

Administrative functionality provides additional oversight for managing users, requests, and platform activity.

### Feedback & Support

Users can provide ratings and feedback after interactions, while dedicated support, privacy, and informational pages provide additional platform resources.

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

The React client handles the user interface and communicates with the Express backend through REST endpoints. The backend manages authentication, application logic, request workflows, and database access through Mongoose.

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

Authentication and authorization are handled using JWT-based authentication, protected routes, and role-based access control.

---

## Development Process

Lend A Hand was developed collaboratively using an Agile workflow with:

- Feature branches
- Pull requests
- Code reviews
- Git-based collaboration
- Incremental feature development
- Frontend/backend integration
- Testing and debugging across shared application workflows

The repository preserves the project's original development history.

---

## Project Goal

Lend A Hand was built around a simple idea:

**Make it easier for people in the same community to find, organize, and provide help when someone needs it.**
