# FCTMS Frontend - React Application

## Overview
This is the frontend application for the **FCTMS (FPT Capstone Topic Management System)**. It is a modern, responsive web interface built with **React 19** and **TypeScript**, powered by **Vite** for a fast development experience.

The application uses **PrimeReact** for high-quality UI components and **Tailwind CSS 4** for flexible, utility-first styling.

## Tech Stack
- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & [PrimeReact](https://primereact.org/)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **API Client**: [Axios](https://axios-http.com/)
- **Authentication**: Google OAuth 2.0 (`@react-oauth/google`)

---

## Getting Started

### 1. Prerequisites
- **Node.js**: Version 18.0 or higher (Check with `node -v`)
- **Package Manager**: npm (comes with Node.js) or yarn

### 2. Installation
Clone the repository and navigate to the frontend directory:
```bash
cd CapstoneProject_FE
```

Install dependencies:
```bash
npm install
```

#### 3. Configuration
The frontend communicates with the .NET Backend and uses Google for authentication.

1.  **Backend Connection**: Open `src/services/api.ts` and ensure the `baseURL` matches your local backend URL:
    ```typescript
    const api = axios.create({
        baseURL: 'https://localhost:7046/api',
    });
    ```
2.  **Google OAuth**: Open `src/main.tsx` and update the `GOOGLE_CLIENT_ID` with your own client ID if needed:
    ```typescript
    const GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID_HERE";
    ```

---

## Development Workflow

### Run Local Development Server
Starts the Vite dev server with Hot Module Replacement (HMR):
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

---

## Troubleshooting

-   **CORS Errors**: Ensure the Backend `Program.cs` has `http://localhost:5173` added to its CORS policy.
-   **Node Modules Issues**: If you see dependency errors, try deleting `node_modules` and `package-lock.json`, then run `npm install` again.
-   **Blank Page**: Check the browser console (F12) for API connection or authentication errors.

---

### Build for Production
Compiles and minifies the application for deployment:
```bash
npm run build
```
The output will be generated in the `dist/` directory.

### Linting
Check for code quality and styling issues:
```bash
npm run lint
```

---

## Project Structure
| Directory | Description |
|-----------|-------------|
| `src/pages/` | Main page components (Home, Login, Dashboard, etc.) |
| `src/components/` | Reusable UI components (Buttons, Modals, Navbars) |
| `src/services/` | API interaction logic (Axios instances, Service methods) |
| `src/assets/` | Static assets like images, icons, and global styles |
| `public/` | Static files served directly (favicon, manifest) |

---

## Key Features
- **Responsive Design**: Mobile-friendly layout using Tailwind CSS.
- **Modern UI**: Polished components provided by PrimeReact.
- **OAuth Login**: Secure login using Google accounts.
- **Type Safety**: Full TypeScript integration for robust development.
- **Global Feedback**: SweetAlert2 for beautiful, interactive alerts.

---
*Developed for FPT Capstone Project.*
