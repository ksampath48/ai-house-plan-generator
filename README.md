# 🏠 AI House Plan Generator

An AI-powered residential house plan generator that creates conceptual floor plans, room dimensions, and engineering notes from plot details.

**Tech Stack:** Node.js · Express · OpenAI GPT-4o · HTML Canvas · jsPDF · Vanilla JS

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure OpenAI API Key
```bash
cp .env.example .env
```
Open `.env` and replace `sk-your-openai-api-key-here` with your actual key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

### 3. Start the Server
```bash
node server.js
```

### 4. Open in Browser
```
http://localhost:3000
```

---

## 📁 Project Structure

```
ai-house-plan/
├── public/
│   ├── index.html       ← Frontend UI (form + results)
│   ├── style.css        ← Blueprint-themed dark UI
│   └── script.js        ← Canvas renderer, PDF export, API calls
├── server.js            ← Express backend + OpenAI integration
├── package.json
├── .env.example
└── README.md
```

---

## ✨ Features

| Feature | Description |
|---|---|
| **AI Floor Plan** | Generates room dimensions, zoning, Vastu notes |
| **Canvas Rendering** | 2D visual floor plan drawn with HTML5 Canvas |
| **PDF Export** | Full multi-page PDF with all plan details via jsPDF |
| **Image Export** | Download floor plan as PNG image |
| **Vastu Compliance** | Optional Vastu Shastra-compliant layouts |
| **Mobile Responsive** | Works on phones, tablets, and desktops |
| **ASCII Floor Plan** | Text-based layout from the AI |
| **Engineering Notes** | Structural suggestions, foundation type, cost estimate |

---

## 📋 Input Parameters

- **Plot Size** — in square yards (20–5000)
- **Facing Direction** — North, South, East, West, or diagonal
- **Number of Floors** — Ground to G+3
- **Bedrooms** — 1 to 6
- **Bathrooms** — 1 to 5
- **Parking** — Yes / No
- **Kitchen Type** — Open or Closed
- **Vastu Preference** — Yes or No

---

## ⚠️ Notes

- Plans are AI-generated for **prototyping only**. Always consult a licensed architect for actual construction.
- Requires a valid OpenAI API key with GPT-4o access.
- The server uses GPT-4o which may incur API costs (~$0.01–0.05 per generation).

---

## 🔧 Development

```bash
# Install nodemon for hot reload
npm install -D nodemon

# Run in dev mode
npm run dev
```

---

*Built as an internal prototype for Vaishno Devi Planning Centre.*
