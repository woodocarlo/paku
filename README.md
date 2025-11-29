<div align="center">
  <br />
  <h1>🧠 PAKU</h1>
  <h3>Personalized Autonomous Knowledge Unit</h3>
  <p>
    <b>EduAssist Pro:</b> A Self-Adaptive, Privacy-First AI Clone for Educators & Professionals.
    <br />
    <i>Bridging the gap between edge computing and academic productivity.</i>
  </p>

  <p>
    <a href="https://github.com/woodocarlo/paku/issues">Report Bug</a> ·
    <a href="https://github.com/woodocarlo/paku/issues">Request Feature</a>
  </p>
</div>

<div align="center">
  <img src="https://img.shields.io/badge/Status-Prototype-orange?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/github/last-commit/woodocarlo/paku?style=for-the-badge" alt="Last Commit" />
  <img src="https://img.shields.io/github/license/woodocarlo/paku?style=for-the-badge" alt="License" />
</div>
<br />

<div align="center">
  <a href="http://paku-two.vercel.app/">
    <img src="https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
  </a>
  <a href="documents/Distributed%20Inference%20research%20paper.pdf">
    <img src="https://img.shields.io/badge/Research%20Paper-PDF-red?style=for-the-badge&logo=adobeacrobatreader&logoColor=white" alt="Read Paper" />
  </a>
</div>

<br />

## 📖 About PAKU

**PAKU** (Personalized Autonomous Knowledge Unit) is a cutting-edge AI system designed to create a comprehensive digital clone of a user—replicating voice, face, and decision-making patterns.

Unlike traditional cloud-based assistants, PAKU is engineered with a **privacy-first architecture**, ensuring all sensitive operations like OCR, semantic analysis, and RAG (Retrieval-Augmented Generation) occur locally or via distributed inference on personal devices.

The current frontend interface, **EduAssist Pro**, serves as the command center for educators, automating administrative workflows such as grading, scheduling, and student interaction without compromising data sovereignty.



---

## 🌟 Unique Selling Points (USPs)

* **🛡️ 100% Privacy-First:** Eliminates reliance on external cloud servers for processing sensitive academic data (student records, exam papers).
* **⚡ Distributed Inference:** Dynamically offloads heavy compute tasks (like LLM inference) from mobile devices to laptops via local networks to reduce latency.
* **🧠 Contextual Memory:** Uses RAG with Knowledge Graphs to recall past interactions and academic context for personalized responses.
* **🎓 Teacher-Centric Tools:** Specialized modules for auto-grading lab manuals, checking assignments, and managing academic calendars.

---

## ✨ Features

### 🛠️ Core Modules

#### 🤖 Auto-Lab Grader Pro
* **Comparative Analysis:** Automatically compares student submissions against an "Ideal Solution" file.
* **Semantic Scoring:** Intelligently grades objective and practical components based on logic rather than just keyword matching.
* **Export to Sheets:** Generates detailed spreadsheets of class performance with a single click.

#### 📝 Assignment AI Checker
* **Text Analysis Engine:** Upload question papers to establish context, then bulk-process student submissions for semantic accuracy.
* **Smart Penalty System:** Automatically calculates and applies penalties for late submissions based on configurable deadlines.
* **Handwriting OCR (Prototype):** Capable of reading and digitizing handwritten assignments for grading.

#### 📅 Intelligent Calendar
* **Google Workspace Sync:** Two-way synchronization with Google Calendar to manage academic schedules.
* **Conflict Detection:** AI Assistant warns about scheduling conflicts and suggests "Deep Work" sessions or breaks based on workload.
* **Smart Agenda:** Visualizes daily classes, meetings, and deadlines in an intuitive timeline view.

#### 🗣️ Multimodal Meeting Clone (Prototype)
* **Virtual Avatar:** Generates a real-time lip-synced video avatar to represent the user in meetings.
* **Command Interface:** Accepts text commands to drive the avatar's speech and actions during live feeds.

---

## 🛠️ Built With

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-%23000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-%23007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-%2338B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Python-%233776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Google_Cloud-%234285F4?style=for-the-badge&logo=google-cloud&logoColor=white" alt="Google Cloud" />
  <img src="https://img.shields.io/badge/PyTorch-%23EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" alt="PyTorch" />
</div>

### System Architecture
* **Frontend:** Next.js 14 (App Router) with Tailwind CSS for a responsive, glassmorphic UI.
* **Backend Inference:** Python-based distributed inference engine (prototype runs locally on port 5010).
* **Integrations:** Google Drive API (File storage), Google Calendar API (Scheduling), Google Sheets API (Reporting).

---

## 🚀 Getting Started

Follow these steps to set up the **EduAssist/PAKU** dashboard locally.

### Prerequisites
* Node.js (v18+)
* Google Cloud Console Project (Enable Drive, Calendar, and Sheets APIs).

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/woodocarlo/paku.git](https://github.com/woodocarlo/paku.git)
    cd paku/paku
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment Variables**
    Create a `.env.local` file in the `paku/` directory and add your Google Cloud credentials:
    ```env
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
    NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key_here
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  **Open your browser**
    Navigate to `http://localhost:3000` to access the dashboard.

---

## 👥 The Team

**Built with ❤️ by the PAKU Team at The NorthCap University.**

| Name | Role | Responsibilities |
| :--- | :--- | :--- |
| **Nischal Sharma** | Team Lead | Computer Vision, Edge Computing, System Arch |
| **Yashika** | Member | Speech Processing, Deep Learning |
| **Nikhil Gupta** | Member | NLP, OCR, RAG & AI Applications |
| **Chahat Gupta** | Member | LLMs, Knowledge Retrieval, Documentation |

**Supervised By:**
* Dr. Anuradha Dhull (Associate Professor)
* Dr. Srishti Sharma (Associate Professor)

---

## 📄 License

This project is licensed under the MIT License.

<br />
<p align="center">
  <i>"Death is the easiest of all things after it, and the hardest of all things before it." — Abu Bakr (RA)</i>
  <br /><br />
  <img src="https://img.shields.io/badge/Made%20in-India-orange?style=for-the-badge" alt="Made in India">
</p>
