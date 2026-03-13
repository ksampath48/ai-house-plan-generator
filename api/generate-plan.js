export default function handler(req, res) {

  const { plotSize, facing, bedrooms, bathrooms, floors } = req.body || {};

  const plan = `
Ground Floor
------------
| Living Room | Kitchen |
| Bedroom     | Bathroom |
`;

  res.status(200).json({
    success: true,

    plotSummary: {
      plotSize: plotSize || 450,
      facing: facing || "North-East",
      bedrooms: bedrooms || 3,
      bathrooms: bathrooms || 2,
      floors: floors || "G+1"
    },

    rooms: [
      { name: "Living Room", floor: "Ground", width: 18, height: 14, x: 40, y: 40 },
      { name: "Kitchen", floor: "Ground", width: 12, height: 10, x: 240, y: 40 },
      { name: "Bedroom", floor: "Ground", width: 14, height: 12, x: 40, y: 200 },
      { name: "Bathroom", floor: "Ground", width: 8, height: 6, x: 240, y: 200 }
    ],

    asciiPlan: plan,

    notes: "Basic AI generated layout"
  });

}
