# Neighborhood Help

This is the team repository for Team 8.  

## Project

Welcome to **Neighborhood Help**, our COMP 495 practicum project!  
This is a MERN stack (MongoDB, Express, React, Node.js) web app where neighbors can ask for and offer help.  

We’ve kept the setup instructions super simple so everyone can get running quickly  

### Project Description  
Neighborhood Help is a community-based web application where neighbors can both ask for and offer help. The platform simplifies everyday assistance tasks like grocery pickup, dog walking, or rides to the doctor. It promotes trust and stronger local connections by providing an organized and safe space for matching requests with volunteers.

## Team

**495 Students**  
Kat Falcone  
Nick Ocheltree  

**394 Students**  
Katie O’Connell  
Jack Gifford  

**294 Students**  
Avery Miller  
April Giljahn  


## Quick Start (Advanced Setup)
**Note:** This shortcut setup is mainly for 495/394 students or anyone already comfortable with Node/MERN.  
It is *not recommended for 294 students or less experienced developers* — please use the detailed instructions below if you’re new to this workflow.  

git clone https://github.com/FranklinUniversityCompSciPracticum/Fall_2025_Team8_Repo.git  
cd Fall_2025_Team8_Repo  

# Backend  
cd backend  
npm install  
copy .env.example .env   # on Windows PowerShell  

# Frontend  
cd ../frontend  
npm install  
copy .env.example .env   # make sure VITE_API_BASE_URL is set  

# run these in separate terminals:  
cd backend  
npm run dev  

cd frontend  
npm run dev  

Backend API → http://localhost:5000  
Frontend → http://localhost:5173  

See below for detailed setup, common fixes, and contributing guidelines.  

## Prerequisites  

Make sure you have these installed:  
- [Git](https://git-scm.com/)  
- [Node.js](https://nodejs.org/) (v18 or higher recommended, npm included)  
- [VS Code](https://code.visualstudio.com/) (recommended editor)  
- [GitHub Desktop](https://desktop.github.com/) (optional, easier for beginners)  

You do **not** need to install MongoDB locally or create an Atlas account — the leads will provide the connection string in the `.env`.  

All project dependencies (Express, React, Axios, Mongoose, etc.) install automatically when you run `npm install`.

## Set Up and Installation

### 1. Clone the repo
cd ~/Documents/dev    # or any folder you keep projects in 
git clone https://github.com/FranklinUniversityCompSciPracticum/Fall_2025_Team8_Repo.git  
cd Fall_2025_Team8_Repo  

### 2. Install dependencies  
Run these separately in backend and frontend  

Backend:  

cd backend  
npm install  
copy .env.example .env   # on Windows PowerShell  
**ask Kat/Nick for the real values to put inside `.env`.**  

Frontend:  

cd ../frontend  
npm install  
copy .env.example .env   # make sure VITE_API_BASE_URL is set  

### 3. Run the app  

Open two terminals (one for backend, one for frontend):  

Backend (Terminal 1):  

cd backend  
npm run dev  

Frontend (Terminal 2):  

cd frontend  
npm run dev  

Now open your browser and you should see the app!  

Backend API → **http://localhost:5000**  

Frontend → **http://localhost:5173**  

### 4. Testing  

Open the frontend URL in your browser.  

Try navigating around — you should see the app load.  

If the backend is running, requests will save to MongoDB.  

### 5. Tips for Newbies  

Always run npm install inside both backend and frontend after pulling code.  

Don’t commit .env → it’s already in .gitignore.  

If something breaks, delete node_modules and run npm install again.  

If the app won’t start, see Common Errors & Fixes below.  

### 6. Common Errors & Fixes  

Q: npm: command not found  
A: Install Node.js from https://nodejs.org  
 and reopen your terminal.  

Q: Port already in use (EADDRINUSE: 5000 or 5173)  
A: Another app is using that port. Close it, or change the port (backend uses PORT in .env).  

Q: Frontend loads but “API not reachable”  
A: Make sure the backend is running, and frontend/.env has VITE_API_BASE_URL=http://localhost:5000.  

Q: “Cannot find module …”  
A: Run npm install inside both /backend and /frontend.  

Q: I changed code but nothing updated  
A: Backend → restart with npm run dev (uses nodemon).  
Frontend → stop and re-run npm run dev.  

### Contributing  

Team Workflow - We’re all working on the same repo, so here’s the safe way to add your code without breaking things:  

1. Make sure you’re up to date.  

git checkout main  
git pull origin main  

2. Create a new branch for your work  
Branch names should describe what you’re doing. Examples:  
    feat/request-form  
    fix/login-bug  
    style/homepage-layout  

git checkout -b feat/your-feature-name  

3. Do your coding.  
    Make changes in your branch. Run the app locally to test (npm run dev in frontend/backend).  

4. Commit your changes  
    Keep commits small and meaningful. Example:  

git add .  
git commit -m "Add request form component"  

5. Push your branch to GitHub  

git push origin feat/your-feature-name  

6. Open a Pull Request (PR)  

    Go to our repo on GitHub  
    You’ll see a button to Compare & Pull Request  
    Add a short description of what you did  

7. Get it merged  

    Once approved by Kat or Nick, we’ll merge it into main and delete your branch. Then everyone pulls the latest code which is why you need to always update your local main branch. 

git checkout main  
git pull origin main  

*** Important: ***  
Never commit directly to main. Always use a branch + PR.  
Don’t commit .env files (they’re ignored in .gitignore anyway).  
Always run npm install again if new dependencies are added.  