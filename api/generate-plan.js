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

 res.status(200).json({
  success: true,

  plotSummary: {
    plotSize: plotSize,
    facing: facing,
    bedrooms: bedrooms,
    bathrooms: bathrooms,
    floors: floors
  },

  rooms: [
    { name: "Living Room", floor: "Ground", width: 18, height: 14, x: 40, y: 40 },
    { name: "Kitchen", floor: "Ground", width: 12, height: 10, x: 240, y: 40 },
    { name: "Bedroom 1", floor: "Ground", width: 14, height: 12, x: 40, y: 200 },
    { name: "Bedroom 2", floor: "Ground", width: 14, height: 12, x: 200, y: 200 },
    { name: "Bathroom", floor: "Ground", width: 8, height: 6, x: 360, y: 200 }
  ],

  asciiPlan: plan,

  notes: "AI structural suggestions"
});

}
