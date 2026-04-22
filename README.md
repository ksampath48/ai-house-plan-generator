# 🏠 AI House Plan Generator

An AI-powered residential house plan generator that creates conceptual floor plans, room dimensions, and engineering notes from plot details.

**Tech Stack:** Node.js · Serverless API-compatible backend · HTML Canvas · jsPDF · Vanilla JS

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the App
```bash
npm start
```
### 3. Open in Browser
```
http://localhost:3000
```

---

## 📁 Project Structure

```
ai-house-plan/
├── index.html           ← Frontend UI (form + results)
├── style.css            ← Blueprint-themed dark UI
├── script.js            ← Canvas renderer, PDF export, API calls
├── server.js            ← Node backend serving static files + API
├── api/generate-plan.js ← Serverless function handler (Vercel-compatible)
├── lib/generatePlan.js  ← Shared planning engine used by both backends
├── package.json
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
- This build currently uses a deterministic planning engine for offline/local usage.
- If you later plug in an LLM provider, keep architectural review in the loop before construction.

---

## 🔧 Development

```bash
# Type/syntax checks
npm run check
```

---

*Built as an internal prototype for Vaishno Devi Planning Centre.*
