# ClearGive

**A Web-Based Donation and Community Assistance Management System**

ClearGive helps donors, partner organizations, and administrators coordinate donation drives and community-assistance activities in Dagupan City. The system records donations and distributions, tracks fulfillment, and provides reports and analytics for transparent monitoring.

## Main Features

- Donor, partner, and administrator roles
- Email verification and password-reset OTPs
- Partner organization verification and document review
- Donation-drive creation, updates, status management, and location selection
- Registered-donor search and donation recording
- Donation receipt and distribution tracking
- Beneficiary counts and proof metadata
- User suspension and restoration
- Notifications and administrative activity logs
- Admin and partner CSV reports
- Admin analytics for totals, trends, fulfillment rates, and delays
- Privacy consent and account anonymization
- HttpOnly cookie-based authentication

## Technology Stack

- **Frontend:** React, Vite, React Router, Recharts
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT stored in an HttpOnly session cookie, bcrypt password hashing
- **Email:** Brevo or Resend over HTTPS, with Nodemailer/SMTP support for local development
- **Optional quantitative analysis:** Python, Pandas, NumPy, and PySpark

The Python analytics workspace is separate from the web application. ClearGive does not require Python or PySpark to run.

## Project Structure

```text
ClearGive/
|-- client-frontend/       React and Vite frontend
|-- server-backend/        Express API, models, controllers, and tests
|-- analytics/             Optional datasets, scripts, charts, and results
|-- analytics-venv/        Local Python environment; do not commit
|-- .gitignore
`-- README.md
```

## Local Setup

### Prerequisites

- Node.js and npm
- A MongoDB connection string
- Email credentials only if OTP delivery will be tested

### Backend

1. Copy `server-backend/.env.example` to `server-backend/.env`.
2. Replace the example values with your local configuration. Never commit `.env`.
3. Install dependencies and start the API:

```powershell
cd server-backend
npm install
npm run dev
```

The local API runs at `http://localhost:5000` by default. Confirm it with:

```text
http://localhost:5000/api/health
```

### Frontend

In another terminal:

```powershell
cd client-frontend
npm install
npm run dev
```

For local development, configure the frontend API URL as:

```ini
VITE_API_URL=http://localhost:5000/api
```

The Vite development server normally runs at `http://localhost:5173`.

## Environment Variables

The backend example file documents the available variables. Important values include:

```ini
NODE_ENV=development
PORT=5000
MONGO_URI=replace_with_your_mongodb_connection_string
JWT_SECRET=replace_with_a_secure_secret
JWT_EXPIRES_IN=1h
SESSION_MAX_AGE_MS=3600000
ADMIN_EMAIL=admin@example.com
```

Set `EMAIL_PROVIDER` explicitly to `brevo`, `resend`, or `smtp`. If it is omitted, ClearGive selects Brevo when `BREVO_API_KEY` exists, then Resend when `RESEND_API_KEY` exists, and otherwise SMTP.

### Brevo HTTPS API (recommended for Render)

1. Create a Brevo account.
2. Add and verify the sender email under **Senders, domains, IPs**.
3. Create a restricted API key with **Transactional email: All** and all other permissions set to **None**.
4. Configure the backend environment:

```ini
EMAIL_PROVIDER=brevo
BREVO_API_KEY=your-private-api-key
BREVO_FROM_EMAIL=your-verified-sender@example.com
BREVO_FROM_NAME=ClearGive
```

The Brevo key is a backend secret. Put the real value only in `server-backend/.env` for local work and in the Render backend environment for deployment. Never place it in Vercel, a `VITE_` variable, `.env.example`, screenshots, or Git.

### Gmail SMTP for local development

```ini
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-google-app-password
EMAIL_FROM=ClearGive <your-email@gmail.com>
EMAIL_PROVIDER=smtp
RESEND_API_KEY=
```

Use a Google App Password, not the normal account password. Some hosting plans block outbound SMTP even when these credentials are correct; use an HTTPS provider such as Brevo in that situation.

### Resend HTTPS API

```ini
EMAIL_PROVIDER=resend
RESEND_API_KEY=your-private-api-key
EMAIL_FROM=ClearGive <onboarding@resend.dev>
```

Resend's test sender can deliver only to the email associated with the Resend account. Sending OTPs to arbitrary users requires a domain owned and verified by the project. Store production secrets in the backend hosting environment, never in the frontend or Git.

## Tests and Build Checks

Run backend tests:

```powershell
cd server-backend
npm test
```

Run frontend checks:

```powershell
cd client-frontend
npm run lint
npm run build
```

## Optional Quantitative-Analysis Workspace

The `analytics/` directory can organize survey, public, simulated, or system-exported datasets:

```text
analytics/
|-- data/
|   |-- raw/              Original CSV files
|   `-- cleaned/          Validated and anonymized data
`-- outputs/
    |-- charts/           Presentation and documentation charts
    `-- results/          Statistical result tables
```

Activate the existing local Python environment in PowerShell:

```powershell
.\analytics-venv\Scripts\Activate.ps1
```

It currently includes Pandas, NumPy, and PySpark. These tools can be used for descriptive statistics, probability calculations, correlations, regression preparation, and scalable CSV processing.

Do not commit `analytics-venv/`. Do not commit raw survey data containing names, email addresses, phone numbers, or other personal information. Use anonymous respondent IDs and commit only data that the group is authorized to share.

## Deployment Notes

- The frontend is configured for Vercel with an `/api` rewrite and SPA fallback.
- The backend is designed for Render and must use `NODE_ENV=production` there.
- Render environment variables are separate from the local `.env` file.
- Frontend environment variables are included in the browser build; never place database, JWT, or email secrets in a `VITE_` variable.
- After changing a provider environment variable, save it and redeploy the affected service.

## Security Notes

- Never commit `.env`, API keys, SMTP App Passwords, JWT secrets, or database credentials.
- Rotate a credential immediately if it is exposed in a screenshot, message, or commit.
- Use prepared test accounts and anonymized sample records for demonstrations.
- A successful local email test does not guarantee that a production host permits SMTP connections.
