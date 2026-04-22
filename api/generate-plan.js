import { generatePlan } from "../lib/generatePlan.js";

export default function handler(req, res) {
  if (req.method && req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  const response = generatePlan(req.body || {});
  return res.status(200).json(response);
}
