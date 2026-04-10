const TRADE_RULES: [RegExp, string][] = [
  [/frame|stud|framing/i, "Framing"],
  [/drywall|gyp|tape|texture/i, "Drywall"],
  [/concrete|pour|slab|footing/i, "Concrete"],
  [/plumb|dwv|domestic water/i, "Plumbing"],
  [/electric|conduit|wire|panel/i, "Electrical"],
  [/hvac|duct|mechanical/i, "HVAC"],
  [/sprinkler|fire/i, "Fire Protection"],
  [/inspect/i, "Inspection"],
  [/roof/i, "Roofing"],
  [/paint/i, "Painting"],
  [/tile|floor/i, "Flooring"],
  [/landscape/i, "Landscape"],
  [/closeout|punch/i, "Closeout"],
  [/steel|structural/i, "Structural Steel"],
  [/elevator/i, "Elevator"],
  [/demolition|demo/i, "Demolition"],
  [/excavat|earth|grade/i, "Earthwork"],
  [/underground|utility/i, "Underground"],
  [/masonry|cmu|block/i, "Masonry"],
  [/insul/i, "Insulation"],
  [/door|hardware/i, "Doors/Hardware"],
  [/window|glaz|storefront/i, "Windows/Glazing"],
  [/waterproof|membrane/i, "Waterproofing"],
  [/submitt/i, "Submittals"],
  [/fabricat/i, "Fabrication"],
  [/deliver/i, "Delivery"],
  [/survey/i, "Survey"],
  [/permit/i, "Permits"],
];

export function inferTrade(activityName: string): string {
  for (const [pattern, trade] of TRADE_RULES) {
    if (pattern.test(activityName)) return trade;
  }
  return "General";
}
