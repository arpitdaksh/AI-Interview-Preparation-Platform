# AI Interview Preparation Platform

An AI-powered platform for preparing for technical interviews, mock interviews, coding practice, career roadmaps, resume management, and more.

## Live application

[Open the AI Interview Preparation Platform](https://ai-interview-preparation-platform-kappa.vercel.app)

The frontend is deployed on Vercel and connects to the API hosted on Render.

## Run locally

### Prerequisites

- [Node.js](https://nodejs.org/) 20.19 or newer (includes npm)
- A MongoDB database: local MongoDB or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- An [OpenRouter](https://openrouter.ai/) API key for AI-powered features

### 1. Download the project

```bash
git clone https://github.com/arpitdaksh/AI-Interview-Preparation-Platform.git
cd AI-Interview-Preparation-Platform
```

### 2. Configure the backend

```bash
cd Backend
npm install
copy .env.example .env
```

Open `Backend/.env` and provide real values for these required settings:

```env
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=a-long-random-secret
OPENROUTER_API_KEY=your-openrouter-api-key
```

`npm install` downloads the Chrome browser used to create PDFs. It can take a little longer on the first install.

Start the backend:

```bash
npm run dev
```

The API runs on `http://localhost:3000`.

### 3. Configure and run the frontend

Open a second terminal in the project folder:

```bash
cd Frontend
npm install
copy .env.example .env
npm run dev
```

Open the URL shown by Vite, normally `http://localhost:5173`.

### Environment variables

| File | Variable | Required | Purpose |
| --- | --- | --- | --- |
| `Backend/.env` | `MONGO_URI` | Yes | MongoDB connection string |
| `Backend/.env` | `JWT_SECRET` | Yes | Signs login sessions |
| `Backend/.env` | `OPENROUTER_API_KEY` | Yes | Powers AI reports, chats, and suggestions |
| `Backend/.env` | `OPENROUTER_CHAT_MODEL` | No | AI model; defaults to `openai/gpt-oss-20b:free` |
| `Backend/.env` | `RAZORPAY_KEY_ID` | For paid plans | Razorpay test/live key ID; exposed only to signed-in checkout users |
| `Backend/.env` | `RAZORPAY_KEY_SECRET` | For paid plans | Server-only secret used to create orders and verify payments |
| `Backend/.env` | `RAZORPAY_WEBHOOK_SECRET` | Recommended | Server-only secret for validating captured-payment webhooks |
| `Backend/.env` | `PRO_MONTHLY_PRICE_PAISE` | No | Pro price in paise; defaults to `19900` (₹199 for 30 days) |
| `Backend/.env` | `PORT` | No | Backend port; defaults to `3000` |
| `Frontend/.env` | `VITE_API_BASE_URL` | Yes for local backend | Use `http://localhost:3000` locally |

Never commit `.env` files or API keys. The included `.env.example` files are safe templates.

### Enable paid plans

The app includes a free plan with two ATS checks per month and a one-time Pro purchase that unlocks unlimited ATS checks for 30 days. Pro currently defaults to ₹199; change `PRO_MONTHLY_PRICE_PAISE` in the backend environment to adjust it. The purchase does not auto-renew.

1. Create or activate a Razorpay merchant account and generate **Test Mode** API keys.
2. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to the backend environment on Render. Keep the secret out of the frontend and repository.
3. Set the Razorpay order capture setting to automatic.
4. Add a Razorpay webhook pointing to `https://<your-render-api-host>/api/billing/webhook`, subscribe to `payment.captured`, and copy its webhook secret into `RAZORPAY_WEBHOOK_SECRET` on Render.
5. Test checkout using Razorpay Test Mode. After verification succeeds, replace the API keys with Live Mode keys and test a real low-value purchase before launch.

Checkout stays disabled until the backend has the Razorpay key ID and secret. Payment signatures are verified on the server, and captured payments are also checked against the app's stored order amount before Pro access is granted.
