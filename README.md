# 🚀 BYT — AI-Powered YouTube Content Multiplier

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-Backend-green?style=for-the-badge&logo=node.js" />
  <img src="https://img.shields.io/badge/Express.js-API-black?style=for-the-badge&logo=express" />
  <img src="https://img.shields.io/badge/MongoDB-Database-green?style=for-the-badge&logo=mongodb" />
  <img src="https://img.shields.io/badge/BullMQ-Queue-red?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Gemini-AI-blue?style=for-the-badge&logo=google" />
  <img src="https://img.shields.io/badge/Stripe-Payments-purple?style=for-the-badge&logo=stripe" />
</p>

<p align="center">
  <b>Turn one YouTube video into a complete multi-platform content bundle.</b>
</p>

<p align="center">
  Blog posts • Viral hooks • Twitter/X threads • LinkedIn posts • Newsletters • AI images
</p>

---

## 📸 Preview

> Add your own screenshots here after deployment.

```md
![Dashboard Screenshot](./screenshots/dashboard.png)
![Generated Content Screenshot](./screenshots/generated-content.png)
```

---

## ✨ Overview

**BYT** is a full-stack SaaS platform that converts YouTube videos into ready-to-use content assets.

Users submit a YouTube URL, and BYT asynchronously extracts the transcript or audio, processes it with **Google Gemini AI**, and generates polished content for multiple platforms.

The system uses a scalable architecture where the **Express API** handles user requests while **BullMQ + Redis workers** handle heavy AI, video, audio, and image-generation tasks in the background.

---

## 🔥 Features

- 🧠 **AI Content Repurposing**  
  Generate blogs, viral hooks, Twitter/X threads, LinkedIn posts, and newsletters from one YouTube URL.

- ⚙️ **Transcript + Audio Fallback**  
  Uses `youtubei.js` / `yt-dlp` for transcripts, and falls back to `ffmpeg` + Gemini File API when transcripts are unavailable.

- 📬 **Async Background Processing**  
  BullMQ and Redis keep the API fast while long-running jobs run in workers.

- 💬 **AI Co-Pilot**  
  Rewrite, expand, shorten, or adjust generated content using contextual AI chat.

- 🎨 **AI Image Generation**  
  Generate blog featured images using Gemini 2.5 Flash Image with fallback support.

- 💳 **Stripe Monetization**  
  Supports Free, Starter, Pro, and Agency tiers with quota enforcement.

- 🔐 **JWT Authentication**  
  Secure auth with access tokens, refresh tokens, and token rotation.

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Queue | BullMQ, Redis |
| AI | Google Gemini, `@google/genai` |
| Video/Audio | `yt-dlp`, `ffmpeg`, `youtubei.js` |
| Payments | Stripe Checkout, Stripe Webhooks |
| Auth | JWT, Refresh Token Rotation |
| Infra | Docker, Docker Compose |

---

## 🏗️ Architecture

```text
User submits YouTube URL
        ↓
Express API validates request + quota
        ↓
Job is saved in MongoDB
        ↓
Job is pushed to BullMQ queue
        ↓
Redis stores queue state
        ↓
Worker extracts transcript/audio
        ↓
Gemini generates content bundle
        ↓
Optional AI image is generated
        ↓
Job status updates to completed
        ↓
User views, edits, and exports content
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js `v20+`
- MongoDB
- Redis
- Docker & Docker Compose
- FFmpeg
- yt-dlp
- Google Gemini API key
- Stripe API keys

---

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YourUsername/byt.git
cd byt
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Update `.env`:

```env
NODE_ENV=development
PORT=3000

# Database
MONGO_URI=mongodb://localhost:27017/byt

# Auth
JWT_SECRET=your_jwt_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Gemini
GOOGLE_API_KEY=your_google_gemini_api_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Client
CLIENT_URL=http://localhost:5173
```

### 4. Start Redis

```bash
docker-compose up redis -d
```

### 5. Run API Server

```bash
npm run dev
```

### 6. Run Worker

```bash
npm run worker
```

Or run the full stack:

```bash
docker-compose up --build
```

---

## 📌 API Overview

### Auth

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

### Jobs

```http
POST   /api/jobs
GET    /api/jobs
GET    /api/jobs/:id
DELETE /api/jobs/:id
```

### AI Editing

```http
POST /api/content/chat
POST /api/content/rewrite
POST /api/content/image
```

### Billing

```http
POST /api/billing/checkout
POST /api/billing/portal
POST /api/webhooks/stripe
```

---

## 📁 Project Structure

```text
byt/
├── src/
│   ├── controllers/
│   ├── services/
│   ├── workers/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── app.js
│
├── docker-compose.yml
├── Dockerfile
├── package.json
├── .env.example
└── README.md
```

---

## 🧪 Core Concepts

- SaaS backend architecture
- Background job queues
- Redis-based worker processing
- YouTube transcript extraction
- Audio fallback processing
- Gemini AI content generation
- AI image generation
- JWT authentication
- Refresh token rotation
- Stripe subscription billing
- Webhook-based quota synchronization
- Dockerized local development

---

## 🎯 Use Cases

BYT is useful for:

- YouTubers
- Podcasters
- Content creators
- Social media managers
- Marketing teams
- Newsletter writers
- SEO teams
- Agencies
- Startup founders

---

## ⚠️ Limitations

- YouTube transcripts may not always be available.
- Audio fallback can take longer for large videos.
- AI-generated content should be reviewed before publishing.
- Stripe webhooks must be configured correctly.
- Local development requires Redis, FFmpeg, and yt-dlp.

---

## 🧹 Recommended `.gitignore`

```gitignore
node_modules/
.env
dist/
build/
coverage/
.DS_Store
npm-debug.log
yarn-error.log
uploads/
tmp/
```

---

## 🧑‍💻 Author

**MdZakiAfzal**

---

## 📄 License

This project is licensed under the MIT License.
