export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { plotSize, bedrooms, bathrooms, floors } = req.body;

  const plan = `
AI Generated House Plan

Plot Size: ${plotSize} sq yards
Bedrooms: ${bedrooms}
Bathrooms: ${bathrooms}
Floors: ${floors}

Suggested Layout:

Ground Floor
- Living Room
- Kitchen
- 1 Bedroom
- Bathroom

First Floor
- Bedrooms
- Balcony
`;

  return res.status(200).json({   summary: "AI Generated Floor Plan",    rooms: [     { name: "Living Room", x: 40, y: 40, width: 220, height: 160 },     { name: "Kitchen", x: 280, y: 40, width: 140, height: 120 },     { name: "Bedroom 1", x: 40, y: 220, width: 180, height: 140 },     { name: "Bedroom 2", x: 240, y: 220, width: 180, height: 140 },     { name: "Bathroom", x: 440, y: 220, width: 100, height: 120 }   ],    notes: "Basic test layout" });{
    success: true,
    plan: plan
  });

}
