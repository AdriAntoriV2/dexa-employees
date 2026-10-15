# Dexa Employees

Employee-facing web application for the Dexa HR and attendance system. Built with React, TypeScript, and Vite, it provides authenticated access to employee profiles and attendance features.

## Features

- **Authentication** — employee login, session restoration, and logout.
- **Role-based access** — supports the `EMPLOYEE` and `HR` roles in the employee portal.
- **Attendance** — view today's attendance, check in, check out, and browse attendance history and summaries.
- **Employee profile** — access and update employee profile information.
- **Profile image upload** — upload profile images through ImgBB.
- **API integration** — communicates with the Dexa backend through a shared API request service.
- **Automated testing** — unit tests for API requests, attendance services, and authentication behavior.

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- Vitest
- React Testing Library
- ESLint
- ImgBB for profile image hosting

## Prerequisites

- Node.js and npm
- A running Dexa backend API
- An ImgBB API key for profile image uploads

## Getting Started

### 1. Install dependencies

```text
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```dotenv
VITE_API_BASE_URL=http://localhost:3000
VITE_IMGBB_API_KEY=your_imgbb_api_key
```

Replace the API URL with the address of your running backend.

The variable names and defaults above are examples; confirm the actual API configuration in `src/config` before using them.

**Security note:** Vite exposes variables prefixed with `VITE_` in the client-side bundle. Do not put passwords, private keys, or other secrets in these variables.

### 3. Start the development server

```text
npm run dev
```

Open the local URL printed by Vite in your terminal.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build the production application |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |

## Testing

Run the automated test suite:

```text
npm run test:run
```

Run linting and production-build checks:

```text
npm run lint
npm run build
```

Tests cover API request behavior, attendance service calls, and authentication flows, including session restoration, role validation, login, logout, and employee profile updates.

## Project Structure

```text
src/
├── contexts/       # Authentication context, provider, and hook
├── services/       # API, attendance, and other service logic
├── test/           # Test setup
├── types/          # TypeScript types
├── config           # Application configuration
└── ...              # Pages, components, routes, and assets
```

## Related Repositories

- [Dexa HR](https://github.com/AdriAntoriV2/dexa-hr)
- [Dexa Audit](https://github.com/AdriAntoriV2/dexa-audit)
- [Dexa Backend](https://github.com/AdriAntoriV2/dexa-backend)

## Notes

- The backend must be running and correctly configured for authenticated features to work.
- Profile image uploads require a valid ImgBB API key.
- Access to the employee portal is restricted to supported account roles.
