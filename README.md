## How to Run This App for dummies

### Prerequisites
- Node.js (v18 or higher)
- npm (comes with Node.js)

### Step 1: Install Dependencies 
```bash
npm install
```
This installs all required packages

### Step 2: Start Development Server
```bash
npm run dev
```
The app will start on **http://localhost:5173**

Open your browser and navigate to `http://localhost:5173` to see the site.

### Step 3 (Optional): Build for Production 
```bash
npm run build
```
This creates an optimized production build in the `dist/` folder.

### Step 4 (Optional): Preview Production Build 
```bash
npm run preview
```
Preview the production build locally before deploying.

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Deployment (Rahti CSC)

This project is configured for Rahti with GitHub webhook integration.

When you push to GitHub, the webhook automatically triggers a deployment. 