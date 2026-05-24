# 🚀 BYT: AI-Powered YouTube Content Multiplier

BYT is an advanced full-stack SaaS platform that automatically transforms YouTube videos into complete multi-platform content bundles.

By simply providing a YouTube URL, BYT asynchronously processes the video's transcript or audio and uses Google's Gemini AI to generate SEO-optimized blog posts, viral hooks, Twitter/X threads, LinkedIn posts, and newsletters.

Designed for scalability, BYT uses a decoupled architecture where the Express API handles client requests while BullMQ and Redis workers process heavy, long-running AI and video tasks in the background.

---

## ✨ Key Features

### 🧠 Smart Content Repurposing

Generate a complete content suite from a single YouTube URL, including:

- SEO-optimized blog posts
- Viral hooks
- LinkedIn posts
- Twitter/X threads
- Newsletters

The generated content can adapt to user-defined tone, perspective, and length.

### ⚙️ Dual-Strategy Content Extraction

BYT uses a robust fallback mechanism for extracting video content:

- **Plan A:** Fetch YouTube transcripts directly using `youtubei.js` / `yt-dlp`
- **Plan B:** If transcripts are unavailable or rate-limited, download the audio using `ffmpeg` and process it through Google Gemini's File API for native audio-to-text generation

### 📬 Asynchronous Queue Processing

Built with **BullMQ** and **Redis**, BYT keeps the main API fast and non-blocking.

Heavy tasks such as video downloading, transcript extraction, audio processing, AI generation, and image generation run safely in the background with:

- Automatic retries
- Exponential backoff
- Job status tracking
- Failure handling

### 💬 AI Co-Pilot

BYT includes a contextual AI chat and editing assistant.

Users can highlight generated text and ask the AI to:

- Rewrite content
- Expand sections
- Shorten paragraphs
- Adjust tone
- Improve clarity
- Generate alternatives

### 🎨 AI Image Generation

BYT integrates AI image generation to automatically create featured images for generated blog posts.

It uses:

- Gemini 2.5 Flash Image
- Flux fallback support

### 🛡️ Robust Delimiter Parsing

BYT uses a carefully engineered prompt format and custom regex parser to enforce structured AI output.

This helps avoid common JSON parsing failures that occur with large LLM responses.

### 💳 Tiered Monetization & Quotas

BYT integrates with Stripe Checkout and Webhooks to support subscription-based monetization.

Supported tiers include:

- Free
- Starter
- Pro
- Agency

The system securely enforces monthly quotas for:

- Video processing
- Audio translation / transcription
- Image generation

---

## 🛠️ Technical Stack

### Backend API

- Node.js
- Express.js
- JSON Web Tokens `JWT`

### Background Workers

- BullMQ
- Redis

### Database

- MongoDB
- Mongoose

### AI Integration

- `@google/genai`
- Gemini 2.5 Flash
- Gemini Audio Processing
- Gemini File API

### Video / Audio Handling

- `yt-dlp`
- `ffmpeg`
- `youtubei.js`

### Payments

- Stripe Checkout
- Stripe Webhooks

### Infrastructure

- Docker
- Docker Compose

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed or configured:

- Node.js `v20+`
- Docker
- Docker Compose
- FFmpeg
- yt-dlp
- Google Generative AI API key
- Stripe API keys
- MongoDB connection URI

---

## 📦 Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YourUsername/byt.git
cd byt
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Then update the `.env` file with your own credentials.

Required environment variables:

```env
NODE_ENV=development
PORT=3000

# Database
MONGO_URI=mongodb://localhost:27017/byt

# Authentication
JWT_SECRET=your_jwt_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Google Gemini
GOOGLE_API_KEY=your_google_gemini_api_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# App
CLIENT_URL=http://localhost:5173
```

### 4. Start Redis

If you are using Docker:

```bash
docker-compose up redis -d
```

### 5. Run the API Server

Open the first terminal:

```bash
npm run dev
```

### 6. Run the BullMQ Worker

Open a second terminal:

```bash
npm run worker
```

Alternatively, run the entire stack:

```bash
docker-compose up --build
```

---

## 🏗️ System Architecture Highlights

### Decoupled Worker Architecture

BYT separates API handling from heavy background processing.

The `jobController.js` immediately returns a `jobId` to the client, while `queueService.js` pushes the processing task to Redis.

The worker located at `src/workers/index.js` processes queued jobs and updates the MongoDB document status as:

- `queued`
- `processing`
- `completed`
- `failed`

This design keeps the API responsive even when processing long videos or large AI-generation jobs.

### JWT Token Rotation

BYT implements a secure authentication flow using:

- Short-lived access tokens
- Long-lived refresh tokens
- Refresh token rotation
- Token reuse detection

This helps reduce the risk of session hijacking and improves account security.

### Stripe Webhook Synchronization

Billing and quota updates are handled through asynchronous Stripe Webhook events.

This ensures database consistency even if the user closes the browser during checkout or subscription updates.

Webhook events are handled by `webhookController.js`.

---

## 🔄 Processing Flow

```text
User submits YouTube URL
        ↓
API validates request and user quota
        ↓
Job is created in MongoDB
        ↓
Job is pushed to BullMQ queue
        ↓
Worker extracts transcript using Plan A
        ↓
If transcript fails, worker downloads audio using ffmpeg
        ↓
Gemini processes transcript/audio
        ↓
AI generates blog, hooks, posts, thread, and newsletter
        ↓
Optional featured image is generated
        ↓
Job status is updated to completed
        ↓
User views and edits generated content
```

---

## 📁 Suggested Project Structure

```text
byt/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── jobController.js
│   │   ├── webhookController.js
│   │   └── contentController.js
│   │
│   ├── services/
│   │   ├── authService.js
│   │   ├── queueService.js
│   │   ├── geminiService.js
│   │   ├── transcriptService.js
│   │   ├── imageService.js
│   │   └── stripeService.js
│   │
│   ├── workers/
│   │   └── index.js
│   │
│   ├── models/
│   │   ├── userModel.js
│   │   ├── jobModel.js
│   │   └── subscriptionModel.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── jobRoutes.js
│   │   ├── contentRoutes.js
│   │   └── webhookRoutes.js
│   │
│   ├── utils/
│   │   ├── appError.js
│   │   ├── catchAsync.js
│   │   ├── parser.js
│   │   └── quota.js
│   │
│   └── app.js
│
├── docker-compose.yml
├── Dockerfile
├── package.json
├── .env.example
└── README.md
```

---

## 📌 API Overview

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

### Jobs

```http
POST /api/jobs
GET  /api/jobs
GET  /api/jobs/:id
DELETE /api/jobs/:id
```

### Content Editing

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

## 🧪 Core Concepts Used

- REST API development
- SaaS architecture
- Background job queues
- BullMQ workers
- Redis-backed task processing
- MongoDB data modeling
- JWT authentication
- Refresh token rotation
- Stripe subscription billing
- Webhook-driven quota synchronization
- Gemini AI integration
- YouTube transcript extraction
- Audio fallback processing
- AI image generation
- Dockerized development

---

## 🧾 Example Use Cases

BYT can be used by:

- YouTubers
- Content creators
- Podcasters
- Marketing teams
- Social media managers
- Newsletter writers
- Startup founders
- Agencies
- SEO teams

Example workflows:

- Convert a YouTube tutorial into a blog post
- Generate LinkedIn posts from podcast episodes
- Create Twitter/X threads from educational videos
- Generate newsletter drafts from long-form content
- Repurpose video content into multi-channel marketing assets

---

## ⚠️ Limitations

- YouTube transcript availability may vary by video.
- Audio fallback processing can take longer for large videos.
- Gemini output quality depends on transcript/audio quality.
- Generated content should be reviewed before publishing.
- Stripe webhooks require correct endpoint configuration.
- Local development requires Redis and media processing dependencies.

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

MdZakiAfzal

---

## 📄 License

This project is licensed under the MIT License.

---

## ⭐ Acknowledgements

This project uses:

- Node.js
- Express.js
- MongoDB
- Mongoose
- BullMQ
- Redis
- Google Gemini
- Stripe
- Docker
- FFmpeg
- yt-dlp
- youtubei.js
