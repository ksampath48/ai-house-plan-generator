export default function handler(req, res) {
  const input = req.body || {};
  const plotSize = Number(input.plotSize) || 200;
  const floors = Number(input.floors) || 1;
  const bedrooms = Number(input.bedrooms) || 3;
  const bathrooms = Number(input.bathrooms) || 2;

  const sqft = Math.round(plotSize * 9);
  const builtUp = Math.round(sqft * (input.parking === "Yes" ? 0.72 : 0.78));
  const openArea = Math.max(sqft - builtUp, 0);
  const floorPlate = Math.round(builtUp / floors);

  const roomMix = [
    { name: "Living Room", area: Math.round(floorPlate * 0.2), floor: 1, position: "Front-center", notes: "Double height optional for premium layouts" },
    { name: "Dining", area: Math.round(floorPlate * 0.12), floor: 1, position: "Near kitchen", notes: "Direct visual connection to living" },
    { name: "Kitchen", area: Math.round(floorPlate * 0.1), floor: 1, position: input.vastu === "Yes" ? "South-East" : "Adjacent to dining", notes: `${input.kitchenType || "Open"} kitchen` },
    { name: "Guest Bedroom", area: Math.round(floorPlate * 0.11), floor: 1, position: "Ground floor", notes: "Accessible washroom nearby" },
  ];

  for (let i = 0; i < bedrooms; i++) {
    roomMix.push({
      name: i === 0 ? "Master Bedroom" : `Bedroom ${i + 1}`,
      area: Math.round(floorPlate * 0.12),
      floor: Math.min(floors, i + 1),
      position: i % 2 === 0 ? "North wing" : "South wing",
      notes: "Includes wardrobe niche",
    });
  }

  for (let i = 0; i < bathrooms; i++) {
    roomMix.push({
      name: `Bathroom ${i + 1}`,
      area: 48,
      floor: Math.min(floors, i + 1),
      position: "Near bedroom cluster",
      notes: "Wet/dry zoning",
    });
  }

  if (input.parking === "Yes") {
    roomMix.push({ name: "Parking", area: Math.round(sqft * 0.12), floor: 1, position: "Front setback", notes: "2-car stack possible" });
  }

  const rooms = roomMix.map((room) => {
    const length = Math.max(8, Math.round(Math.sqrt(room.area * 1.3)));
    const width = Math.max(6, Math.round(room.area / length));
    return { ...room, length, width };
  });

  const response = {
    success: true,
    plotSummary: {
      totalArea: `${plotSize} sq yds (${sqft} sq ft)`,
      builtUpArea: `${builtUp} sq ft`,
      openArea: `${openArea} sq ft`,
      facingDirection: input.facingDirection || "North",
      floors,
      style: "Contemporary",
      vastCompliance: input.vastu === "Yes" ? "Compliant zones allocated" : "Not requested",
    },
    rooms,
    spaceAllocation: [
      { category: "Private Spaces", area: `${Math.round(builtUp * 0.45)} sq ft`, percentage: 45 },
      { category: "Public Spaces", area: `${Math.round(builtUp * 0.28)} sq ft`, percentage: 28 },
      { category: "Service Areas", area: `${Math.round(builtUp * 0.17)} sq ft`, percentage: 17 },
      { category: "Circulation", area: `${Math.round(builtUp * 0.1)} sq ft`, percentage: 10 },
    ],
    asciiPlan: `+------------------------------+\n| Parking / Lawn  Entry Lobby |\n| Living    Dining    Kitchen |\n| Bed Cluster + Toilets       |\n+------------------------------+`,
    engineeringSuggestions: [
      "Use an RCC frame grid at 12-14 ft spacing for flexibility.",
      "Create dedicated vertical shafts for plumbing across stacked toilets.",
      "Reserve 8-12% roof area for solar + mechanical equipment.",
      `Coordinate HVAC zoning early for ${floors > 2 ? "multi-floor" : "single/duplex"} air distribution.`,
    ],
    structuralNotes: {
      foundationType: "Isolated Footing with Tie Beams",
      roofType: floors > 2 ? "Flat RCC Slab + Waterproofing Membrane" : "Flat RCC Slab",
      wallThickness: "6 in AAC external / 4 in internal",
      estimatedCost: "$70 - $95 / sq ft (indicative)",
      constructionTime: `${8 + floors * 2} to ${11 + floors * 2} months`,
    },
  };

  res.status(200).json(response);
}
