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
    plan: plan
  });

}
