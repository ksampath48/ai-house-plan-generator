/**
 * AI House Plan Generator — Frontend Logic
 * Handles: Form submission, API calls, Canvas rendering, PDF export
 */

"use strict";

// ─── DOM References ────────────────────────────────────────────────────────────
const planForm        = document.getElementById("planForm");
const generateBtn     = document.getElementById("generateBtn");
const formError       = document.getElementById("formError");
const formSection     = document.getElementById("formSection");
const loadingSection  = document.getElementById("loadingSection");
const resultsSection  = document.getElementById("resultsSection");

// Result elements
const summaryGrid     = document.getElementById("summaryGrid");
const roomsTableBody  = document.getElementById("roomsTableBody");
const allocationBars  = document.getElementById("allocationBars");
const asciiPlan       = document.getElementById("asciiPlan");
const suggestionsGrid = document.getElementById("suggestionsGrid");
const structuralSpecs = document.getElementById("structuralSpecs");
const canvas          = document.getElementById("floorPlanCanvas");

// Download buttons
const downloadPdfBtn  = document.getElementById("downloadPdf");
const downloadImgBtn  = document.getElementById("downloadImage");
const resetBtn        = document.getElementById("resetBtn");

// Loading steps
const loadingSteps = [
  document.getElementById("step1"),
  document.getElementById("step2"),
  document.getElementById("step3"),
  document.getElementById("step4"),
  document.getElementById("step5"),
];

// Global state
let currentPlanData = null;
let loadingTimer    = null;
let stepIndex       = 0;

// ─── Loading Steps Animation ───────────────────────────────────────────────────
function startLoadingAnimation() {
  stepIndex = 0;
  loadingSteps.forEach((s) => s.classList.remove("active", "done"));
  loadingSteps[0].classList.add("active");

  loadingTimer = setInterval(() => {
    if (stepIndex < loadingSteps.length - 1) {
      loadingSteps[stepIndex].classList.remove("active");
      loadingSteps[stepIndex].classList.add("done");
      stepIndex++;
      loadingSteps[stepIndex].classList.add("active");
    }
  }, 1500);
}

function stopLoadingAnimation() {
  clearInterval(loadingTimer);
  loadingSteps.forEach((s) => { s.classList.remove("active"); s.classList.add("done"); });
}

// ─── Show / Hide Sections ──────────────────────────────────────────────────────
function showLoading() {
  formSection.hidden    = false;
  loadingSection.hidden = false;
  resultsSection.hidden = true;
  generateBtn.disabled  = true;
  formError.classList.remove("visible");

  // Smooth scroll to loading
  setTimeout(() => loadingSection.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  startLoadingAnimation();
}

function showResults() {
  loadingSection.hidden = true;
  resultsSection.hidden = false;
  generateBtn.disabled  = false;
  stopLoadingAnimation();

  // Scroll to results
  setTimeout(() => resultsSection.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
}

function showError(msg) {
  loadingSection.hidden = true;
  generateBtn.disabled  = false;
  stopLoadingAnimation();
  formError.textContent = msg;
  formError.classList.add("visible");
  formSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetToForm() {
  resultsSection.hidden = true;
  loadingSection.hidden = true;
  formSection.hidden    = false;
  currentPlanData       = null;
  formSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── Form Validation ───────────────────────────────────────────────────────────
function validateForm(data) {
  const fields = ["plotSize", "facingDirection", "floors", "bedrooms", "bathrooms", "parking", "kitchenType", "vastu"];
  let valid = true;

  // Remove previous error states
  document.querySelectorAll(".field-input.error").forEach((el) => el.classList.remove("error"));

  fields.forEach((f) => {
    const el = document.getElementById(f);
    if (!data[f] || data[f].toString().trim() === "") {
      el.classList.add("error");
      valid = false;
    }
  });

  if (!valid) return "Please fill in all fields before generating the plan.";
  if (Number(data.plotSize) < 20) return "Plot size must be at least 20 square yards.";
  if (Number(data.plotSize) > 5000) return "Plot size cannot exceed 5000 square yards.";
  return null;
}

// ─── Form Submit ───────────────────────────────────────────────────────────────
planForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Collect form data
  const data = {
    plotSize:        document.getElementById("plotSize").value,
    facingDirection: document.getElementById("facingDirection").value,
    floors:          document.getElementById("floors").value,
    bedrooms:        document.getElementById("bedrooms").value,
    bathrooms:       document.getElementById("bathrooms").value,
    parking:         document.getElementById("parking").value,
    kitchenType:     document.getElementById("kitchenType").value,
    vastu:           document.getElementById("vastu").value,
  };

  // Validate
  const validationError = validateForm(data);
  if (validationError) {
    formError.textContent = validationError;
    formError.classList.add("visible");
    return;
  }

  showLoading();

  try {
    const res = await fetch("/api/generate-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.error || "Unknown server error.");
    }

  

currentPlanData = { input: data, plan: json };
renderResults(data, json);
showResults();

  } catch (err) {
    console.error("Error generating plan:", err);
    showError("⚠️ " + (err.message || "Failed to connect to server. Is the server running?"));
  }
});

// ─── Render All Results ────────────────────────────────────────────────────────
function renderResults(input, plan) {
  renderPlotSummary(plan.plotSummary, input);
  renderRoomsTable(plan.rooms);
  renderAllocationBars(plan.spaceAllocation);
  renderAsciiPlan(plan.asciiFloorPlan);
  renderEngineeringSuggestions(plan.engineeringSuggestions, plan.structuralNotes);
  renderFloorPlanCanvas(plan.rooms, input);
}

// ─── Plot Summary ──────────────────────────────────────────────────────────────
function renderPlotSummary(summary, input) {
  if (!summary) return;

  const items = [
    { key: "Total Area",       val: summary.totalArea || input.plotSize + " sq yds", highlight: true },
    { key: "Built-Up Area",    val: summary.builtUpArea || "—" },
    { key: "Open Area",        val: summary.openArea || "—" },
    { key: "Facing",           val: summary.facingDirection || input.facingDirection },
    { key: "Floors",           val: summary.floors + " Floor" + (summary.floors > 1 ? "s" : "") || input.floors },
    { key: "Arch. Style",      val: summary.style || "Contemporary" },
    { key: "Vastu Compliance", val: summary.vastCompliance || (input.vastu === "Yes" ? "Applied" : "Not Required") },
    { key: "Plot Size Input",  val: input.plotSize + " sq yds" },
  ];

  summaryGrid.innerHTML = items.map(({ key, val, highlight }) => `
    <div class="summary-item">
      <div class="summary-key">${key}</div>
      <div class="summary-val ${highlight ? "highlight" : ""}">${val}</div>
    </div>
  `).join("");
}

// ─── Rooms Table ───────────────────────────────────────────────────────────────
function renderRoomsTable(rooms) {
  if (!rooms || !rooms.length) {
    roomsTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-3)">No room data available.</td></tr>`;
    return;
  }

  roomsTableBody.innerHTML = rooms.map((room) => `
    <tr>
      <td>${room.name}</td>
      <td><span class="floor-badge">Floor ${room.floor || 1}</span></td>
      <td>${room.length || "—"} × ${room.width || "—"} ft</td>
      <td><span class="area-val">${room.area || "—"} sq ft</span></td>
      <td style="color:var(--text-3);font-size:12px;">${room.position || "—"}</td>
      <td style="color:var(--text-3);font-size:12px;">${room.notes || "—"}</td>
    </tr>
  `).join("");
}

// ─── Space Allocation Bars ─────────────────────────────────────────────────────
function renderAllocationBars(allocation) {
  if (!allocation || !allocation.length) {
    allocationBars.innerHTML = `<p style="color:var(--text-3);font-size:13px;">No allocation data.</p>`;
    return;
  }

  allocationBars.innerHTML = allocation.map((item) => `
    <div class="alloc-row">
      <div class="alloc-meta">
        <span class="alloc-name">${item.category}</span>
        <div class="alloc-values">
          <span>${item.area || ""}</span>
          <span class="alloc-pct">${item.percentage}%</span>
        </div>
      </div>
      <div class="alloc-track">
        <div class="alloc-fill" style="width: ${Math.min(item.percentage, 100)}%"></div>
      </div>
    </div>
  `).join("");
}

// ─── ASCII Floor Plan ──────────────────────────────────────────────────────────
function renderAsciiPlan(ascii) {
  asciiPlan.textContent = ascii || "Floor plan not available.";
}

// ─── Engineering Suggestions ───────────────────────────────────────────────────
function renderEngineeringSuggestions(suggestions, structural) {
  // Suggestions cards
  if (suggestions && suggestions.length) {
    suggestionsGrid.innerHTML = suggestions.map((s, i) => `
      <div class="suggestion-item">
        <div class="sug-num">${String(i + 1).padStart(2, "0")}</div>
        <div class="sug-text">${s}</div>
      </div>
    `).join("");
  }

  // Structural specs
  if (structural) {
    const specs = [
      { label: "Foundation",     val: structural.foundationType     || "—" },
      { label: "Roof Type",      val: structural.roofType           || "—" },
      { label: "Wall Thickness", val: structural.wallThickness      || "—" },
      { label: "Est. Cost",      val: structural.estimatedCost      || "—" },
      { label: "Build Time",     val: structural.constructionTime   || "—" },
    ];
    structuralSpecs.innerHTML = specs.map(({ label, val }) => `
      <div class="spec-item">
        <div class="spec-label">${label}</div>
        <div class="spec-val">${val}</div>
      </div>
    `).join("");
  }
}

// ─── Canvas Floor Plan Renderer ────────────────────────────────────────────────
/**
 * Renders a 2D floor plan on HTML Canvas based on AI room data.
 * Uses a simple packing algorithm to lay rooms out within the canvas.
 */
function renderFloorPlanCanvas(rooms, input) {
  const ctx = canvas.getContext("2d");

  // Canvas dimensions
  const W = Math.min(900, window.innerWidth - 80);
  const H = Math.round(W * 0.68);
  canvas.width  = W;
  canvas.height = H;

  // Clear
  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = "#060d1a";
  ctx.fillRect(0, 0, W, H);

  // Grid pattern
  ctx.strokeStyle = "rgba(212,160,23,0.07)";
  ctx.lineWidth = 0.5;
  const gridStep = 20;
  for (let x = 0; x <= W; x += gridStep) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += gridStep) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // ── Room color palette ──
  const ROOM_COLORS = {
    "living room":     { fill: "rgba(212,160,23,0.12)",  stroke: "#d4a017", text: "#f0c040" },
    "master bedroom":  { fill: "rgba(45,212,191,0.10)",  stroke: "#2dd4bf", text: "#5eead4" },
    "bedroom":         { fill: "rgba(45,212,191,0.08)",  stroke: "#14b8a6", text: "#5eead4" },
    "kitchen":         { fill: "rgba(239,68,68,0.09)",   stroke: "#ef4444", text: "#fca5a5" },
    "bathroom":        { fill: "rgba(99,102,241,0.10)",  stroke: "#6366f1", text: "#a5b4fc" },
    "dining":          { fill: "rgba(251,146,60,0.09)",  stroke: "#f97316", text: "#fdba74" },
    "parking":         { fill: "rgba(148,163,184,0.10)", stroke: "#94a3b8", text: "#cbd5e1" },
    "utility":         { fill: "rgba(163,230,53,0.08)",  stroke: "#84cc16", text: "#bef264" },
    "storeroom":       { fill: "rgba(163,230,53,0.06)",  stroke: "#65a30d", text: "#bef264" },
    "pooja":           { fill: "rgba(251,191,36,0.10)",  stroke: "#fbbf24", text: "#fde68a" },
    "garden":          { fill: "rgba(34,197,94,0.08)",   stroke: "#22c55e", text: "#86efac" },
    "default":         { fill: "rgba(212,160,23,0.07)",  stroke: "#d4a017", text: "#e8edf5" },
  };

  function getRoomColor(name) {
    const n = name.toLowerCase();
    for (const key of Object.keys(ROOM_COLORS)) {
      if (n.includes(key)) return ROOM_COLORS[key];
    }
    return ROOM_COLORS["default"];
  }

  // ── Filter to ground floor rooms (or all if no floor data) ──
  const groundRooms = rooms
    ? rooms.filter((r) => !r.floor || r.floor === 1 || r.floor === "1")
    : [];

  if (!groundRooms.length && rooms) {
    groundRooms.push(...rooms.slice(0, 8));
  }

  // ── Compute a simple grid layout ──
  const PAD   = 32;
  const LABEL_H = 24;
  const availW  = W - PAD * 2;
  const availH  = H - PAD * 2 - LABEL_H;

  // Total area for proportional sizing
  const totalArea = groundRooms.reduce((sum, r) => sum + (r.area || 100), 0);
  const scaleFactor = (availW * availH) / totalArea;

  // Calculate display dimensions proportional to area
  const roomRects = groundRooms.map((room) => {
    const roomArea = room.area || 100;
    const displayArea = roomArea * scaleFactor;

    // Try to maintain aspect ratio from room dimensions
    let aspect = room.length && room.width ? room.length / room.width : 1.4;
    aspect = Math.max(0.5, Math.min(aspect, 3)); // clamp
    const dW = Math.sqrt(displayArea * aspect);
    const dH = displayArea / dW;
    return { room, dW: Math.round(dW), dH: Math.round(dH) };
  });

  // ── Simple shelf packing ──
  const placed = [];
  let shelfX = PAD, shelfY = PAD + LABEL_H, shelfH = 0;
  const ROOM_PAD = 3;

  for (const item of roomRects) {
    let { dW, dH } = item;
    dW = Math.min(dW, availW);
    dH = Math.min(dH, availH);

    if (shelfX + dW + ROOM_PAD > W - PAD) {
      // New shelf
      shelfY += shelfH + ROOM_PAD;
      shelfX  = PAD;
      shelfH  = 0;
    }

    // Prevent overflow vertically
    if (shelfY + dH > H - PAD) {
      dH = H - PAD - shelfY;
      if (dH < 20) break;
    }

    placed.push({ room: item.room, x: shelfX, y: shelfY, w: dW, h: dH });
    shelfX += dW + ROOM_PAD;
    shelfH = Math.max(shelfH, dH);
  }

  // ── Draw outer house boundary ──
  ctx.strokeStyle = "rgba(212,160,23,0.5)";
  ctx.lineWidth = 2;
  ctx.strokeRect(PAD - 4, PAD + LABEL_H - 4, availW + 8, availH + 8);

  // ── Draw each room ──
  for (const { room, x, y, w, h } of placed) {
    const colors = getRoomColor(room.name);

    // Room fill
    ctx.fillStyle = colors.fill;
    ctx.fillRect(x, y, w, h);

    // Room border
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);

    // Corner marks (architectural style)
    const cs = 6;
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 1;
    [[x,y],[x+w,y],[x,y+h],[x+w,y+h]].forEach(([cx,cy]) => {
      const sx = cx === x ? 1 : -1;
      const sy = cy === y ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(cx + sx*cs, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + sy*cs);
      ctx.stroke();
    });

    // Room label
    if (w > 30 && h > 20) {
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);

      const name = room.name;
      const areaText = room.area ? `${room.area} sq ft` : "";

      // Name
      const maxFontSize = Math.min(12, w / 7);
      const fontSize = Math.max(8, maxFontSize);
      ctx.font = `600 ${fontSize}px 'DM Sans', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Text shadow effect
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillText(name, 1, 1);

      ctx.fillStyle = colors.text;
      ctx.fillText(name, 0, 0);

      // Area label (if room is big enough)
      if (h > 40 && areaText) {
        ctx.font = `400 ${Math.max(7, fontSize - 2)}px 'DM Mono', monospace`;
        ctx.fillStyle = "rgba(212,160,23,0.7)";
        ctx.fillText(areaText, 0, fontSize + 4);
      }
      ctx.restore();
    }
  }

  // ── Floor plan title ──
  ctx.fillStyle = "rgba(212,160,23,0.9)";
  ctx.font = `700 13px 'DM Sans', sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("GROUND FLOOR PLAN", PAD, PAD + LABEL_H / 2 - 2);

  // North arrow
  drawNorthArrow(ctx, W - PAD - 20, PAD + LABEL_H / 2, input.facingDirection);

  // Compass direction indicator
  ctx.fillStyle = "rgba(168,181,200,0.5)";
  ctx.font = `400 10px 'DM Mono', monospace`;
  ctx.textAlign = "right";
  ctx.fillText(`Facing: ${input.facingDirection}`, W - PAD - 46, PAD + LABEL_H / 2 - 2);

  // ── Scale bar ──
  drawScaleBar(ctx, PAD, H - 12);
}

function drawNorthArrow(ctx, x, y, facing) {
  const arrowLen = 14;
  ctx.save();
  ctx.translate(x, y);

  const facingAngles = {
    "North": 0, "North-East": 45, "East": 90, "South-East": 135,
    "South": 180, "South-West": 225, "West": 270, "North-West": 315,
  };
  const angle = ((facingAngles[facing] || 0) * Math.PI) / 180;
  ctx.rotate(angle);

  // Arrow
  ctx.beginPath();
  ctx.moveTo(0, -arrowLen);
  ctx.lineTo(4, 0);
  ctx.lineTo(0, 3);
  ctx.lineTo(-4, 0);
  ctx.closePath();
  ctx.fillStyle = "rgba(212,160,23,0.9)";
  ctx.fill();
  ctx.strokeStyle = "rgba(212,160,23,0.6)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.restore();

  // N label
  ctx.font = `700 9px 'DM Sans', sans-serif`;
  ctx.fillStyle = "rgba(212,160,23,0.9)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("N", x, y - 20);
}

function drawScaleBar(ctx, x, y) {
  ctx.fillStyle = "rgba(168,181,200,0.4)";
  ctx.font = `9px 'DM Mono', monospace`;
  ctx.textAlign = "left";
  ctx.fillText("Scale: Not to scale — Indicative layout", x, y);
}

// ─── PDF Download ──────────────────────────────────────────────────────────────
downloadPdfBtn.addEventListener("click", () => {
  if (!currentPlanData) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const { input, plan } = currentPlanData;
  const pageW = 210;
  let y = 20;

  // ── Color helpers ──
  const setColor = (r, g, b) => { doc.setTextColor(r, g, b); };
  const setFill  = (r, g, b) => { doc.setFillColor(r, g, b); };
  const setDraw  = (r, g, b) => { doc.setDrawColor(r, g, b); };

  // ── Header ──
  setFill(10, 15, 30);
  doc.rect(0, 0, pageW, 35, "F");
  setColor(212, 160, 23);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("AI HOUSE PLAN GENERATOR", pageW / 2, 13, { align: "center" });
  setColor(200, 210, 225);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Intelligent Architecture  |  Automated Design  |  Vastu Compliant", pageW / 2, 20, { align: "center" });
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageW / 2, 27, { align: "center" });

  y = 44;

  // ── Plot Details Box ──
  setFill(20, 30, 50);
  setDraw(212, 160, 23);
  doc.setLineWidth(0.4);
  doc.rect(14, y, pageW - 28, 32, "FD");
  setColor(212, 160, 23);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("PLOT DETAILS", 20, y + 6);

  const details = [
    `Plot Size: ${input.plotSize} sq yds`,
    `Facing: ${input.facingDirection}`,
    `Floors: ${input.floors}`,
    `Bedrooms: ${input.bedrooms}`,
    `Bathrooms: ${input.bathrooms}`,
    `Parking: ${input.parking}`,
    `Kitchen: ${input.kitchenType}`,
    `Vastu: ${input.vastu}`,
  ];

  setColor(180, 200, 220);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const cols = 4;
  details.forEach((d, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    doc.text(d, 20 + col * 46, y + 14 + row * 7);
  });

  y += 40;

  // ── Plot Summary ──
  if (plan.plotSummary) {
    setColor(212, 160, 23);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("PLOT SUMMARY", 14, y);
    y += 5;
    setDraw(212, 160, 23);
    doc.setLineWidth(0.4);
    doc.line(14, y, pageW - 14, y);
    y += 5;

    const ps = plan.plotSummary;
    const summaryItems = [
      ["Total Area", ps.totalArea || "—"],
      ["Built-Up Area", ps.builtUpArea || "—"],
      ["Open Area", ps.openArea || "—"],
      ["Architectural Style", ps.style || "Contemporary"],
      ["Vastu Compliance", ps.vastCompliance || "—"],
    ];

    summaryItems.forEach(([k, v]) => {
      setColor(140, 160, 190);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(k + ":", 16, y);
      setColor(200, 215, 230);
      doc.setFont("helvetica", "normal");
      doc.text(v.toString().substring(0, 70), 60, y);
      y += 6;
    });
    y += 4;
  }

  // ── Room Dimensions Table ──
  if (plan.rooms && plan.rooms.length) {
    setColor(212, 160, 23);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("ROOM DIMENSIONS", 14, y);
    y += 5;
    doc.setLineWidth(0.4);
    doc.line(14, y, pageW - 14, y);
    y += 4;

    // Table header
    const cols2 = [14, 60, 100, 130, 158, 182];
    const headers2 = ["Room Name", "Floor", "L × W (ft)", "Area (sq ft)", "Position", "Notes"];
    setFill(20, 35, 60);
    doc.rect(14, y - 3, pageW - 28, 8, "F");
    setColor(212, 160, 23);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    headers2.forEach((h, i) => doc.text(h, cols2[i], y + 2));
    y += 8;

    plan.rooms.forEach((room, idx) => {
      if (y > 260) { doc.addPage(); y = 20; }
      if (idx % 2 === 0) {
        setFill(15, 25, 45);
        doc.rect(14, y - 3, pageW - 28, 7, "F");
      }
      setColor(190, 210, 230);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text((room.name || "—").substring(0, 22), cols2[0], y + 1);
      doc.text("F" + (room.floor || 1), cols2[1], y + 1);
      doc.text(`${room.length || "?"} × ${room.width || "?"}`, cols2[2], y + 1);
      doc.text((room.area || "—").toString(), cols2[3], y + 1);
      doc.text((room.position || "—").substring(0, 14), cols2[4], y + 1);
      doc.text((room.notes || "—").substring(0, 14), cols2[5], y + 1);
      y += 7;
    });
    y += 6;
  }

  // ── Floor Plan Image ──
  if (y > 180) { doc.addPage(); y = 20; }

  setColor(212, 160, 23);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("2D FLOOR PLAN DIAGRAM", 14, y);
  y += 5;
  doc.setLineWidth(0.4);
  doc.line(14, y, pageW - 14, y);
  y += 4;

  try {
    const imgData = canvas.toDataURL("image/png");
    const imgW = pageW - 28;
    const imgH = Math.round(imgW * (canvas.height / canvas.width));
    if (y + imgH < 290) {
      doc.addImage(imgData, "PNG", 14, y, imgW, imgH);
      y += imgH + 8;
    } else {
      doc.addPage();
      doc.addImage(imgData, "PNG", 14, 20, imgW, imgH);
      y = 20 + imgH + 8;
    }
  } catch (_) {
    y += 4;
  }

  // ── Engineering Suggestions ──
  if (plan.engineeringSuggestions && plan.engineeringSuggestions.length) {
    if (y > 230) { doc.addPage(); y = 20; }
    setColor(212, 160, 23);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("ENGINEERING SUGGESTIONS", 14, y);
    y += 5;
    doc.setLineWidth(0.4);
    doc.line(14, y, pageW - 14, y);
    y += 5;

    plan.engineeringSuggestions.forEach((s, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      setColor(212, 160, 23);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(`${i + 1}.`, 16, y);
      setColor(180, 200, 220);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(s, pageW - 40);
      doc.text(lines, 22, y);
      y += lines.length * 5 + 3;
    });
    y += 4;
  }

  // ── Structural Notes ──
  if (plan.structuralNotes) {
    if (y > 240) { doc.addPage(); y = 20; }
    setColor(212, 160, 23);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("STRUCTURAL NOTES", 14, y);
    y += 5;
    doc.setLineWidth(0.4);
    doc.line(14, y, pageW - 14, y);
    y += 5;

    const sn = plan.structuralNotes;
    const specItems = [
      ["Foundation Type", sn.foundationType],
      ["Roof Type",       sn.roofType],
      ["Wall Thickness",  sn.wallThickness],
      ["Estimated Cost",  sn.estimatedCost],
      ["Build Time",      sn.constructionTime],
    ].filter(([, v]) => v);

    specItems.forEach(([k, v]) => {
      if (y > 270) { doc.addPage(); y = 20; }
      setColor(140, 160, 190);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(k + ":", 16, y);
      setColor(45, 212, 191);
      doc.setFont("helvetica", "normal");
      doc.text(v.toString().substring(0, 80), 60, y);
      y += 6;
    });
  }

  // ── Footer ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    setFill(10, 15, 30);
    doc.rect(0, 286, pageW, 12, "F");
    setColor(100, 120, 150);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(
      "AI House Plan Generator — Internal Prototype — Powered by OpenAI GPT-4o — Plans are AI-generated, consult a licensed architect for construction.",
      pageW / 2, 292, { align: "center" }
    );
    doc.text(`Page ${i} of ${totalPages}`, pageW - 14, 292, { align: "right" });
  }

  doc.save(`house-plan-${input.plotSize}sqyd-${input.bedrooms}bhk-${Date.now()}.pdf`);
});

// ─── Image Download ────────────────────────────────────────────────────────────
downloadImgBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = `floor-plan-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
});

// ─── Reset ─────────────────────────────────────────────────────────────────────
resetBtn.addEventListener("click", resetToForm);

// ─── Clear error on input change ───────────────────────────────────────────────
document.querySelectorAll(".field-input").forEach((el) => {
  el.addEventListener("change", () => {
    el.classList.remove("error");
    formError.classList.remove("visible");
  });
});
