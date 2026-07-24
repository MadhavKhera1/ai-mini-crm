# 🤖 AI-Powered Mini CRM

An advanced, production-grade Customer Relationship Management (CRM) application designed for sales executives. This platform enables executives to maintain pipeline records, track interaction timelines, run bulk imports, and leverage the power of the **Gemini 3.6 Flash** model to generate persistent executive summaries and parse call transcripts.

---

## 🚀 One-Command Launch (Docker Compose)

The entire stack (PostgreSQL, FastAPI Backend, and React Frontend) can be launched using a single Docker Compose command.

### Prerequisites
*   Docker & Docker Compose installed.
*   A Gemini API Key (obtained from [Google AI Studio](https://aistudio.google.com/)).

### Steps
1. Create a `.env` file at the root of the project and paste your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
2. Run the compose command:
   ```bash
   docker-compose up --build
   ```
3. Open your browser and navigate to:
   *   **Frontend Client**: [http://localhost:3000](http://localhost:3000) (Served via Nginx)
   *   **FastAPI Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🎨 Core Features

### 1. 📊 Interactive Dashboard & Sales Tasks
*   **Pipeline Metrics**: Track total directory size, conversion rates, active leads, and closed deals.
*   **Sales Tasks Manager**: Interactive list to track, complete, and delete daily sales tasks, persisted locally via browser `localStorage`.

### 2. 📝 Database-Persisted AI Summaries (Gemini 3.6 Flash)
*   **Anti-Spam Persistence**: Summaries are stored in the database and loaded instantly, preventing redundant Gemini API calls on page reloads.
*   **Outdated Banners**: The CRM automatically flags the stored summary as outdated whenever notes are added, edited, or deleted, showing a warning badge with a manual **"Refresh Summary"** trigger.

### 3. 📥 Production-Ready CSV Bulk Import
*   **Drag & Drop target**: Sleek drag-and-drop dashboard upload card with file-size and type checkings.
*   **Row-Level Resiliency**: Invalid entries (blank names, bad emails, incorrect statuses) are isolated and reported in a scrollable summary box instead of crashing the transaction.
*   **Silent Duplicate Skipping**: Pre-checks existing database entries and ignores duplicate emails silently.
*   **Sample CSV Exporter**: Downloads a pre-formatted sample CSV directly.

### 4. 📞 AI Conversation Transcript Importer (.txt / .docx)
*   **Word Parser**: Reads paragraph streams from binary Microsoft Word `.docx` documents.
*   **Intelligent AI Segmentation**: Gemini splits raw meeting logs into chronological, key relationship updates, ignoring greetings, sign-offs, and formatting fluff.
*   **Duplicate Checking (SequenceMatcher)**: Compares candidates against existing logs using Python's `difflib.SequenceMatcher`. Ratios `> 0.6` trigger a **Possible Duplicate** warning badge in the review card grid.
*   **Card Review Grid**: Renders candidates as editable cards with confidence indicators (**High**, **Medium**, **Low**), allowing reps to toggle and modify content before importing.
*   **Conversation Overview**: Summarizes meeting key topics, action items, and overall sentiment.
*   **Rate-Limit Resilient Fallback**: If Gemini free tier quotas are exhausted (`429 Rate Limit`), the system runs a local dialogue-cleaner fallback that strips prefixes, filters metadata lines, and heuristically extracts topics so the app never crashes.

---

## 🛠️ Technology Stack

| Layer | Technology | Key Usage |
| :--- | :--- | :--- |
| **Backend** | **FastAPI** | High-performance RESTful API endpoints |
| | **SQLAlchemy + PostgreSQL** | Relational data persistence with connection pools |
| | **Pytest** | In-memory testing environment |
| | **python-docx** | Binary Word document paragraph parsing |
| **Frontend**| **React + TypeScript + Vite** | Robust single-page client structure |
| | **Tailwind CSS + Framer Motion**| Premium, fluid layout animations and styling |
| | **Axios** | API request routing |
| **AI/LLM**  | **Google GenAI SDK** | Gemini 3.6 Flash generation with response schemas |
| **DevOps**  | **Docker / Nginx** | Multi-stage Docker production serve configs |

---

## 📂 Project Structure

```text
├── backend/
│   ├── app/
│   │   ├── core/           # Configs (env load, secret keys)
│   │   ├── db/             # Base and Database Session managers
│   │   ├── models/         # SQLAlchemy Schemas (Customer, Note, AISummary)
│   │   ├── routers/        # API Endpoints (customer, note)
│   │   ├── schemas/        # Pydantic Schemas
│   │   ├── services/       # Business Logic & Importers (AI, Note, Customer)
│   │   └── tests/          # Pytest unit tests suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable inputs, modals, state cards
│   │   ├── pages/          # Customer Directory List and Customer Details Page
│   │   ├── services/       # Axios API client wrapper
│   │   └── styles/         # Global styles and custom checkbox overrides
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
└── docker-compose.yml
```

---

## 🔌 API Endpoints

### Customers
*   `GET /customers` - Retrieve all customers.
*   `POST /customers` - Create a new customer profile.
*   `GET /customers/{id}` - Retrieve customer profile details.
*   `PUT /customers/{id}` - Modify customer profile details.
*   `DELETE /customers/{id}` - Discard customer profile.
*   `POST /customers/import` - Bulk import customers via CSV file upload.

### Notes & Timeline
*   `GET /customers/{customer_id}/notes` - Retrieve timeline logs for a customer.
*   `POST /customers/{customer_id}/notes` - Log a new note.
*   `PUT /notes/{note_id}` - Update a timeline note.
*   `DELETE /notes/{note_id}` - Discard a timeline note.
*   `POST /customers/{customer_id}/notes/import-preview` - Preview split interactions from .txt/.docx.
*   `POST /customers/{customer_id}/notes/import-confirm` - Commit selected split notes.

### AI summaries
*   `GET /customers/{customer_id}/ai-summary` - Fetch persisted AI summary.
*   `POST /customers/{customer_id}/ai-summary/generate` - Generate/refresh AI summary using Gemini.

---

## 🧪 Testing Suite (Offline Resilient)

We use **Pytest** with an isolated, in-memory **SQLite Database** (`StaticPool` connection sharing). Mocks are configured for the Gemini API, allowing the tests to run offline without any active API keys.

To run the unit tests locally:
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Activate your virtual environment and run the test command:
   ```bash
   $env:PYTHONPATH="." ; .\.venv\Scripts\pytest.exe app/tests
   ```
Our test suite contains **15 fully passing unit tests** covering customer CRUD, note CRUD, CSV bulk upload error logs, duplicate skips, transcript formats, and AI outdated status tags.

---

## 🧠 AI Prompt Design

### 1. Executive Summary Generation
```text
You are an AI sales assistant. Analyze the following profile and interaction history.

Customer Name: {customer_name}
Company: {company}
Status: {status}

Interaction Notes:
{notes_text}

Provide a professional, actionable sales summary. Respond with a JSON object containing:
1. 'summary': A concise 2-3 sentence overview of the relationship status, budget constraints (if mentioned), key product interest, and sentiment.
2. 'insights': A list of up to 4 key insights or customer problems discovered during conversations.
3. 'action_items': A list of up to 4 concrete next steps to close the deal or maintain positive follow-up.
```

### 2. Conversation Transcript Importer
```text
You are an expert CRM assistant. Analyze the following conversation transcript or meeting notes.
Extract individual distinct interactions, customer statements, decisions, and follow-ups.
- Separate individual customer interactions.
- Preserve chronological order whenever possible.
- Ignore greetings, sign-offs, signatures, and formatting fluff.
- Merge fragmented sentences into meaningful, concise, and readable notes.
- For each note, assign a float confidence score (between 0.0 and 1.0) based on how clearly it captures a key relationship insight or transaction update.

Also compile a high-level conversation overview:
- 'meeting_summary': A 2-3 sentence overall summary of what took place.
- 'key_topics': A list of up to 4 key topics discussed.
- 'action_items': A list of up to 4 action items/next steps.
- 'overall_sentiment': Exactly one of 'Positive', 'Neutral', 'Negative'.
```

---

## ⚙️ Design Decisions & Trade-offs

*   **Heuristic Regex Fallback**: If a customer hits their daily Gemini rate limit, the CRM falls back to a smart Python parser that sanitizes dialogues, filters titles, and extracts topics. This guarantees a clean user experience regardless of API availability.
*   **`difflib.SequenceMatcher`**: Duplicate logs are flagged using a string similarity ratio threshold (`0.6`). This is calculated in-memory during preview, eliminating the need for expensive database indexing.
*   **StaticPool In-Memory Testing**: Using SQLAlchemy's `StaticPool` for the in-memory SQLite database ensures that all connections share a single instance, allowing mock sessions to see tables created during setup.

---

## ⚠️ Known Limitations

*   **Gemini Free-Tier Rate Limits**: The Gemini free tier has a daily request quota limit (20 requests/day). Exceeding this quota triggers rate limiting, which automatically falls back to our local regex parser.
*   **In-Memory Duplicate Check**: The string similarity matcher is executed in memory during the preview stage. For extremely large conversation transcript uploads (> 100 pages), this could cause memory overhead.