// Static handover-checklist template for "Centre Point Amravati".
// Ported 1:1 from the approved prototype (which itself digitises the
// Amravati Checklist 08.07.2025 workbook). This is the single source of
// truth for the structure of the inspection; dynamic state (statuses,
// remarks, sign-offs) lives in MongoDB and references items by id.

export const STATUS_OPTIONS = [
  { val: '', label: '— Select status —' },
  { val: 'accepted', label: '✅ Accepted' },
  { val: 'pending-install', label: '⏳ Pending – Installation' },
  { val: 'docs-pending', label: '📄 Physically Accepted, Docs Pending' },
  { val: 'damaged', label: '⚠️ Damaged – Needs Repair' },
  { val: 'phase2', label: '🅿️ Phase 2' },
  { val: 'next-visit', label: '📍 Next Visit' },
  { val: 'dropped', label: '✖️ Dropped from List' },
];

// Order used when grouping the sign-off sheet.
export const STATUS_ORDER = [
  'accepted',
  'pending-install',
  'docs-pending',
  'damaged',
  'phase2',
  'next-visit',
  'dropped',
];

// If a remark contains one of these phrases the item is surfaced in the
// "Immediate Action Needed by Hariganga" block on the sign-off sheet.
export const IMMEDIATE_KEYWORDS = [
  'payment pending', 'vendor not finalized', 'vendor not finalised',
  'needs repair', 'need repair', 'material needs', 'yet to purchase',
  'not yet purchased', 'not purchased', 'contractor not', 'pending payment',
  'amount pending', 'cost pending', 'repair needed', 'parts pending',
  'not ordered',
];

// Standard guest-room checklist, reused across every floor.
export const ROOM_ITEMS = [
  { id: 'RM_BED', name: 'Bed (min: single 90cm, double 180cm)', spec: '' },
  { id: 'RM_WRD', name: 'Wardrobe', spec: '' },
  { id: 'RM_SHV', name: 'Shelves & drawer space', spec: '' },
  { id: 'RM_BST', name: 'Bedside table & drawer', spec: '' },
  { id: 'RM_COF', name: 'Coffee table', spec: '' },
  { id: 'RM_ARM', name: 'Arm chair', spec: '' },
  { id: 'RM_DIN', name: 'Dining table', spec: '' },
  { id: 'RM_SOF', name: 'Sofa', spec: '' },
  { id: 'RM_CRT', name: 'Curtains at all windows', spec: '' },
  { id: 'RM_BAT', name: 'Bathroom min 36 sq ft', spec: '' },
  { id: 'RM_WC', name: 'Western WC with seat lid', spec: '' },
  { id: 'RM_SHW', name: 'Shower head & telephone shower', spec: '' },
  { id: 'RM_SLP', name: 'Slope test', spec: '' },
  { id: 'RM_HOT', name: 'Hot water – 40°C', spec: '' },
  { id: 'RM_PRS', name: 'Water pressure controller pumps', spec: '' },
  { id: 'RM_TUB', name: 'Bathtub', spec: '' },
  { id: 'RM_AC', name: 'Air conditioning', spec: '' },
  { id: 'RM_KEY', name: 'Key card scanner door', spec: '' },
  { id: 'RM_DRY', name: 'Hairdryer', spec: '' },
  { id: 'RM_FRG', name: 'Minibar / fridge', spec: '' },
  { id: 'RM_LGT', name: 'Energy saving smart lighting', spec: '' },
  { id: 'RM_SCK', name: '5A earthed socket & universal plug beside bed', spec: '' },
  { id: 'RM_LCK', name: 'Integrated door lock', spec: '' },
  { id: 'RM_DND', name: 'Electric DND signage with button', spec: '' },
  { id: 'RM_TV', name: 'Television', spec: '42" normal, 60" suites' },
];

export const CHECKLIST = {
  'Hotel Entrance': {
    icon: 'building-arch',
    items: [
      { id: 'E1.1', name: 'Driveway', spec: 'Free of obstruction, leveled' },
      { id: 'E1.2', name: 'Gates', spec: '4 functioning gates (2 hotel, 2 lawns)' },
      { id: 'E1.3', name: 'Porch ceiling & lights', spec: 'As per architectural drawings' },
      { id: 'E1.4', name: 'Painted walls', spec: 'As per architectural drawings' },
      { id: 'E1.5', name: 'Baggage scanner machine', spec: 'Tunnel 500×300mm, 0.2m/s, 180kg capacity' },
      { id: 'E1.6', name: 'DFMD', spec: '' },
      { id: 'E1.7', name: 'Driveway traffic mirror', spec: '' },
      { id: 'E1.8', name: 'Hotel signage', spec: 'As per architectural drawings' },
    ],
  },
  'Lobby': {
    icon: 'armchair',
    items: [
      { id: 'L2.1', name: 'Ceiling', spec: 'As per architectural drawings' },
      { id: 'L2.2', name: 'Walls', spec: '' },
      { id: 'L2.3', name: 'Flooring', spec: '' },
      { id: 'L2.4', name: 'Reception desk', spec: '' },
      { id: 'L2.5', name: 'Luggage room & back office', spec: '' },
      { id: 'L2.6', name: 'Seating & furnishing', spec: '' },
      { id: 'L2.7', name: 'Air conditioning', spec: '22°C target, <30 DBA' },
      { id: 'L2.8', name: 'Access cables – computers & WiFi', spec: '' },
      { id: 'L2.9', name: 'Lighting & chandeliers', spec: '' },
      { id: 'L2.10', name: 'Area / direction boards & signages', spec: '' },
    ],
  },
  'Guest Elevators': {
    icon: 'elevator',
    items: [
      { id: 'GE1.1', name: 'Elevator 1 – Licence', spec: '' },
      { id: 'GE1.2', name: 'Elevator 1 – Speed', spec: '' },
      { id: 'GE1.3', name: 'Elevator 1 – Finish', spec: '' },
      { id: 'GE1.4', name: 'Elevator 1 – Landing buttons G to 7', spec: '' },
      { id: 'GE1.5', name: 'Elevator 1 – Make', spec: '' },
      { id: 'GE1.6', name: 'Elevator 1 – Handshaking with Elevator 2', spec: '' },
      { id: 'GE2.1', name: 'Elevator 2 – Licence', spec: '' },
      { id: 'GE2.2', name: 'Elevator 2 – Speed', spec: '' },
      { id: 'GE2.3', name: 'Elevator 2 – Finish', spec: '' },
      { id: 'GE2.4', name: 'Elevator 2 – Landing buttons G to 7', spec: '' },
      { id: 'GE2.5', name: 'Elevator 2 – Make', spec: '' },
      { id: 'GE2.6', name: 'Elevator 2 – Handshaking with Elevator 1', spec: '' },
    ],
  },
  'Ground Floor Hall': {
    icon: 'home',
    items: [
      { id: 'GH4.1', name: 'Flooring & carpeting', spec: '' },
      { id: 'GH4.2', name: 'Walls & paintings', spec: '' },
      { id: 'GH4.3', name: 'Ceilings', spec: '' },
      { id: 'GH4.4', name: 'Lighting & chandeliers', spec: '' },
      { id: 'GH4.5', name: 'Sprinklers', spec: 'As per fire norms' },
      { id: 'GH4.6', name: 'Service entrance', spec: '' },
      { id: 'GH4.7', name: 'Guest entrance', spec: '' },
      { id: 'GH4.8', name: 'Hard floor buffet area', spec: '' },
      { id: 'GH4.9', name: 'Guest washrooms', spec: '' },
      { id: 'GH4.10', name: 'Pre-function area', spec: '' },
      { id: 'GH4.11', name: 'Air conditioning', spec: '22°C, <30 DBA' },
      { id: 'GH4.12', name: 'Service elevator access', spec: '' },
      { id: 'GH4.13', name: 'Banquet soundproofing', spec: '' },
      { id: 'GH4.f1', name: 'Banquet chairs', spec: '600 numbers' },
      { id: 'GH4.f2', name: 'Banquet buffet tables', spec: '30 tables (min 6ft×2ft)' },
      { id: 'GH4.f3', name: 'Banquet round tables', spec: '48 tables (4ft diameter)' },
      { id: 'GH4.f4', name: 'Banquet cocktail stands', spec: '18 tables (2ft diameter)' },
      { id: 'GH4.f5', name: 'Portable stage', spec: '9 parts, 1.5ft height, 8ft×4ft, 2 steps' },
    ],
  },
  'Lawn': {
    icon: 'tree',
    items: [
      { id: 'LW5.1', name: 'Landscaping & plantation', spec: '' },
      { id: 'LW5.2', name: 'Outdoor lighting', spec: '' },
      { id: 'LW5.3', name: 'Guest access gates from outside', spec: '' },
      { id: 'LW5.4', name: 'Lawn to hotel access & pathway', spec: '' },
      { id: 'LW5.5', name: 'Storm water drainage', spec: '' },
      { id: 'LW5.6', name: 'Lawn to banquet access & pathway', spec: '' },
    ],
  },
  'First Floor Hall': {
    icon: 'building',
    items: [
      { id: 'FF9.1', name: 'Flooring & carpeting', spec: '' },
      { id: 'FF9.2', name: 'Walls & paintings', spec: '' },
      { id: 'FF9.3', name: 'Ceilings', spec: '' },
      { id: 'FF9.4', name: 'Lighting & chandeliers', spec: '' },
      { id: 'FF9.5', name: 'Sprinklers', spec: 'As per fire norms' },
      { id: 'FF9.6', name: 'Service entrance', spec: '' },
      { id: 'FF9.7', name: 'Guest entrance', spec: '' },
      { id: 'FF9.8', name: 'Hard floor buffet area – pre-function', spec: '' },
      { id: 'FF9.9', name: 'Guest washrooms', spec: '' },
      { id: 'FF9.11', name: 'Air conditioning', spec: '' },
      { id: 'FF9.12', name: 'Guest elevator access', spec: '' },
      { id: 'FF9.13', name: 'Service elevator access', spec: '' },
      { id: 'FF9.14', name: 'Electric power boards & switches', spec: '' },
      { id: 'FF9.15', name: 'Banquet soundproofing', spec: '' },
      { id: 'FF9.17', name: 'Soundproof hall partition', spec: '' },
      { id: 'FF9.18', name: 'Service passage / pre-function area', spec: '' },
      { id: 'FF9.f1', name: 'Banquet chairs', spec: '60 numbers' },
      { id: 'FF9.f2', name: 'Banquet buffet tables', spec: '6 tables (min 6ft×2ft)' },
      { id: 'FF9.f3', name: 'Banquet round tables', spec: '12 tables (4ft diameter)' },
      { id: 'FF9.f4', name: 'Banquet cocktail stands', spec: '8 tables (2ft diameter)' },
    ],
  },
  'Restaurant': {
    icon: 'tools-kitchen-2',
    items: [
      { id: 'RS10.1', name: 'Seating arrangements', spec: '' },
      { id: 'RS10.2', name: 'Service side stations', spec: '' },
      { id: 'RS10.3', name: 'Lighting', spec: '' },
      { id: 'RS10.4', name: 'Ceiling & chandeliers', spec: '' },
      { id: 'RS10.5', name: 'Flooring', spec: '' },
      { id: 'RS10.6', name: 'Hostess desk', spec: '' },
      { id: 'RS10.7', name: 'Air conditioning', spec: '' },
      { id: 'RS10.8', name: 'Access to kitchen & service passage', spec: '' },
      { id: 'RS10.9', name: 'Service elevator access', spec: '' },
      { id: 'RS10.10', name: 'Interiors, props & plantations', spec: '' },
      { id: 'RS10.11', name: 'Temporary roofing, lighting & cooling – podium terrace', spec: '' },
    ],
  },
  'Main Kitchen': {
    icon: 'soup',
    items: [
      { id: 'KT11.1', name: 'Access to restaurant & banquets', spec: '' },
      { id: 'KT11.2', name: 'Store', spec: '' },
      { id: 'KT11.3', name: 'Fresh air & exhaust ducting', spec: 'GI Sheet' },
      { id: 'KT11.3b', name: 'Exhaust hoods with filters', spec: 'SS 304' },
      { id: 'KT11.4', name: 'Lighting', spec: '' },
      { id: 'KT11.6', name: 'Plumbing, drains & floor drains', spec: '' },
      { id: 'KT11.7', name: 'Potwash area demarcation', spec: '' },
      { id: 'KT11.8', name: 'Wall tiling', spec: '' },
      { id: 'KT11.9', name: 'Island range – a la carte', spec: '2 Indian ranges, 1 hot plate, 1 grill, fryer – SS 304' },
      { id: 'KT11.10', name: 'Combi-oven', spec: '' },
      { id: 'KT11.11', name: 'Working tables', spec: 'As per drawings' },
      { id: 'KT11.12', name: 'Chinese range – 3 burner', spec: 'SS 304' },
      { id: 'KT11.13', name: 'Bulk ranges', spec: '5 ranges – SS 304' },
      { id: 'KT11.14', name: 'Tandoor', spec: '3 nos' },
      { id: 'KT11.15', name: 'Dishwash – hood type', spec: 'Preferably IFB' },
      { id: 'KT11.16', name: 'Kitchen day store', spec: '' },
      { id: 'KT11.17', name: 'Sufficient sink, handwash & food-wash', spec: '' },
      { id: 'KT11.18', name: 'Refrigeration', spec: '2400 ltrs + 600 ltr deep fridge' },
      { id: 'KT11.19', name: 'IRD setup with phone & RSOT cabin', spec: '' },
    ],
  },
  // Equipment order — Hariganga's Lake Side View (Abid Refrigeration, Order R029).
  'Main Kitchen Equipment': {
    icon: 'soup',
    items: [
      { id: 'K-2', name: 'Work Table Sink', spec: '60"×28"×34", Qty 1, sink 18"×18"×12"' },
      { id: 'K-8', name: 'Work Table', spec: '60"×30"×34", Qty 1, 2 bottom shelves' },
      { id: 'K-10', name: 'Single Burner Stock Pot Range', spec: '30"×30"×21", Qty 3, high-pressure burner' },
      { id: 'K-12', name: 'Pot Rack', spec: '42"×24"×60", Qty 1, 4-tier SS perforated' },
      { id: 'K-13', name: 'Jumbo Sink Unit', spec: '42"×30"×32", Qty 1, 3 × 36"×22"×12" sinks' },
      { id: 'K-16', name: 'Work Table Sink', spec: '72"×28"×34", Qty 1, sink 18"×18"×12"' },
      { id: 'K-18', name: 'Work Table', spec: '24"×30"×32", Qty 4, 2 bottom shelves' },
      { id: 'K-19', name: 'Mobile Tandoor (coal operated)', spec: '32"×32"×42", Qty 2, glass-wool insulated, caster wheels' },
      { id: 'K-20', name: 'Three Burner Chinese Cooking Range', spec: '54"×30"×32", Qty 1, 2×G/11 + 1×T-35 burner' },
      { id: 'K-21', name: 'Work Table', spec: '67"×30"×32", Qty 1, 2 bottom shelves' },
      { id: 'K-22', name: 'Two Burner Indian Cooking Range', spec: '48"×24"×32", Qty 1, 2×G/11 burner' },
      { id: 'K-23', name: 'Work Table Sink', spec: '24"×30"×32", Qty 1, sink 18"×18"×12"' },
      { id: 'K-24', name: 'Two Burner Indian Cooking Range', spec: '48"×24"×32", Qty 1, 2×G/11 burner' },
      { id: 'K-25', name: 'Work Table', spec: '24"×30"×32", Qty 1, 2 bottom shelves' },
      { id: 'K-26', name: 'Four Burner Conti Cooking Range', spec: '36"×30"×32", Qty 1' },
      { id: 'K-27', name: 'Work Table', spec: '18"×30"×32", Qty 1, 2 bottom shelves' },
      { id: 'K-28', name: 'Dosa Bhati', spec: '33"×30"×32", Qty 1, 18mm cast-iron plate, RV burner' },
      { id: 'K-29', name: 'Pickup Counter', spec: '54"×24"×34", Qty 2, 2 overhead shelves + heater/thermostat' },
      { id: 'K-30', name: 'Pickup Counter', spec: '60"×24"×34", Qty 1, overhead shelf + heater' },
      { id: 'K-32', name: 'Service Table', spec: '60"×24"×34", Qty 1' },
      { id: 'K-33', name: 'Service Table', spec: '45"×24"×34", Qty 2' },
      { id: 'K-35', name: 'Work Table', spec: '78"×24"×34", Qty 1' },
      { id: 'K-36', name: 'Work Table Sink', spec: '33"×28"×34", Qty 1, sink 18"×18"×12"' },
      { id: 'K-38', name: 'Work Table', spec: '66"×28"×34", Qty 1, 2 bottom shelves' },
      { id: 'W-1', name: 'Dish Landing Table', spec: '90"×24"×34", Qty 1, overhead shelf, dustbin hole' },
      { id: 'W-2', name: 'Pre-Sink Unit', spec: '30"×30"×34", Qty 1, 3 × 22"×22"×12" sinks' },
      { id: 'W-3', name: 'Sorting Table', spec: '48"×30"×34", Qty 1, 2 bottom shelves' },
      { id: 'W-4', name: 'Pot Rack', spec: '42"×18"×60", Qty 1, 4-tier SS perforated' },
      { id: 'W-5', name: 'Crockery Rack', spec: '42"×18"×60", Qty 1, 4-tier SS perforated' },
      { id: 'H-1', name: 'Centre Range Kitchen Hood', spec: '264"×72"×18", Qty 1, baffle filters, oil tray' },
      { id: 'H-2', name: 'Kitchen Hood – Indian Section', spec: '120"×32"×21", Qty 1, baffle filters' },
      { id: 'GR-1', name: 'Floor Grating', spec: '36"×12"×4", Qty 7, anti-slip, removable jali, side drain' },
    ],
  },
  'Base Kitchen Equipment': {
    icon: 'grill',
    items: [
      { id: 'GK-1', name: 'Single Burner Stock Pot Range', spec: '30"×30"×21", Qty 4, high-pressure burner' },
      { id: 'GK-2', name: 'Work Table Sink', spec: '24"×32"×32", Qty 1, sink 18"×18"×12"' },
      { id: 'GK-3', name: 'Mobile Tandoor (coal operated)', spec: '32"×32"×42", Qty 3, glass-wool insulated, caster wheels' },
      { id: 'GK-4', name: 'Work Table', spec: '24"×32"×32", Qty 2, 2 bottom shelves' },
      { id: 'GK-6', name: 'Pickup Counter', spec: '72"×30"×34", Qty 1, 3-side closed' },
      { id: 'GK-8', name: 'Hot Food Bain-Marie', spec: '72"×30"×34", Qty 1, 5 × GN pans 21"×12" (25 L)' },
      { id: 'W-01', name: 'Dish Landing Table', spec: '60"×30"×34", Qty 1, overhead shelf, dustbin hole' },
      { id: 'W-02', name: 'Pre-Sink Unit', spec: '30"×30"×32", Qty 1, 3 × 22"×22"×12" sinks' },
      { id: 'W-03', name: 'Sorting Table', spec: '42"×30"×32", Qty 1, 2 bottom shelves' },
      { id: 'W-4', name: 'Pot Rack', spec: '42"×18"×32", Qty 1, 4-tier SS perforated' },
      { id: 'H-1', name: 'Kitchen Hood', spec: '312"×32"×21", Qty 1, baffle filters, oil tray' },
      { id: 'GR-1', name: 'Cutting Table', spec: '96"×24"×34", Qty 1, 2 bottom shelves' },
      { id: 'GR-2', name: 'Single Sink Unit', spec: '24"×24"×34", Qty 1, sink 18"×18"×12"' },
      { id: 'GR-4', name: 'Anti-Skid Floor Grating', spec: '36"×12"×4", Qty 6, removable jali, side drain' },
    ],
  },
  'Base Kitchen': {
    icon: 'grill',
    items: [
      { id: 'SK8.1', name: 'Tandoor', spec: '3 nos' },
      { id: 'SK8.2', name: 'Bulk ranges', spec: '2 nos' },
      { id: 'SK8.3', name: 'Washup area', spec: '' },
    ],
  },
  'Service Elevators': {
    icon: 'elevator',
    items: [
      { id: 'SE3.1', name: 'Elevator 3 – Licence', spec: '' },
      { id: 'SE3.2', name: 'Elevator 3 – Speed', spec: 'As per PO' },
      { id: 'SE3.3', name: 'Elevator 3 – Finish', spec: '' },
      { id: 'SE3.4', name: 'Elevator 3 – Landing buttons G to 7', spec: '' },
      { id: 'SE3.5', name: 'Elevator 3 – Make', spec: 'Johnson' },
      { id: 'SE4.1', name: 'Elevator 4 – Licence', spec: '' },
      { id: 'SE4.2', name: 'Elevator 4 – Speed', spec: 'As per PO' },
      { id: 'SE4.3', name: 'Elevator 4 – Finish', spec: 'As per PO' },
      { id: 'SE4.4', name: 'Elevator 4 – Landing buttons G to 1', spec: '' },
      { id: 'SE4.5', name: 'Elevator 4 – Make', spec: 'As per PO' },
    ],
  },
  'Plant & Machinery': {
    icon: 'engine',
    items: [
      { id: 'PM6.1', name: 'Electrical transformer', spec: '500 KVA' },
      { id: 'PM6.2', name: 'Genset', spec: '75% connected load, auto-switching' },
      { id: 'PM6.3', name: 'ETP & STP', spec: 'As per MPCB norms' },
      { id: 'PM6.5', name: 'Water tanks', spec: 'As per MEP drawing' },
      { id: 'PM6.6', name: 'Fire tanks', spec: 'As per fire norms' },
      { id: 'PM6.7', name: 'Fire pump & fire panel', spec: '' },
      { id: 'PM6.8', name: 'Water pump', spec: '' },
      { id: 'PM6.9', name: 'Overhead tank', spec: '' },
      { id: 'PM6.10', name: 'Heat pumps', spec: 'As per MEP drawing' },
      { id: 'PM6.11', name: 'Gas bank', spec: '' },
      { id: 'PM6.12', name: 'HVAC', spec: 'Blue Star / Daikin / Carrier' },
      { id: 'PM6.13', name: 'RO plant & softener', spec: '' },
      { id: 'PM6.14', name: 'Telephone lines with EPABX', spec: '' },
      { id: 'PM6.15', name: 'PA system & music system', spec: '' },
      { id: 'PM6.16', name: 'Pressure pumps', spec: '' },
      { id: 'PM6.17', name: 'Electrical panel HT & LT', spec: '' },
    ],
  },
  'BOH Ground Floor': {
    icon: 'layout-sidebar',
    items: [
      { id: 'BG7.1', name: 'Staff restrooms & changing room', spec: '' },
      { id: 'BG7.2', name: 'Staff cafeteria', spec: '' },
      { id: 'BG7.3', name: 'Staff bunkers', spec: '' },
      { id: 'BG7.4', name: 'Staff parking', spec: '' },
      { id: 'BG7.6', name: 'Hotel stores', spec: '' },
      { id: 'BG7.7', name: 'Housekeeping room', spec: '' },
      { id: 'BG7.8', name: 'Time office', spec: '' },
      { id: 'BG7.9', name: 'CCTV office', spec: '' },
      { id: 'BG7.10', name: 'Sales & help desk', spec: '' },
      { id: 'BG7.11', name: 'Admin office', spec: '' },
      { id: 'BG7.12', name: 'Stores', spec: '' },
      { id: 'BG7.13', name: 'Goods receiving area', spec: '' },
      { id: 'BG7.14', name: 'Separate chemical room', spec: '' },
      { id: 'BG7.15', name: 'All floor HK pantry', spec: '' },
    ],
  },
  'IT & Security': {
    icon: 'device-desktop',
    items: [
      { id: 'IT1', name: 'WiFi & CCTV cables & cameras', spec: '' },
      { id: 'IT2', name: 'Mobile network coverage', spec: '' },
    ],
  },
  'Laundry': {
    icon: 'wash-machine',
    items: [
      { id: 'LN1', name: 'Washer extractor', spec: '2 × 30 kg' },
      { id: 'LN2', name: 'Dryer tumbler', spec: '2 × 40 kg' },
      { id: 'LN3', name: 'Front load calender machine', spec: '' },
      { id: 'LN4', name: 'Stacko – guest laundry', spec: '10 kg dryer & washer extractor' },
      { id: 'LN5', name: 'Industrial steam iron & ironing table', spec: '1 no.' },
    ],
  },
  'Specially Abled Rooms': {
    icon: 'accessible',
    items: [
      { id: 'SA1', name: 'Special abled guest room', spec: 'Low furniture, audible/visible alarms, sliding wardrobe' },
      { id: 'SA2', name: 'Bathroom for specially abled', spec: 'Low washbasin, wall seat, grab bars' },
      { id: 'SA3', name: 'Ramp with anti-slip floors', spec: 'Min 90cm door, ramps in all public areas' },
    ],
  },
  'Public Washrooms': {
    icon: 'wash',
    items: [
      { id: 'PW1', name: 'Specially abled public restroom', spec: 'Min 90cm door, low urinals' },
      { id: 'PW2', name: 'Low washbasin & vanity unit', spec: '' },
      { id: 'PW3', name: 'Grab bars – WC area', spec: '' },
    ],
  },
  'Rooms – Floor 2': {
    icon: 'door',
    isRooms: true,
    floors: [
      { num: '201', cat: 'Standard' }, { num: '202', cat: 'Standard' }, { num: '203', cat: 'Standard' },
      { num: '204', cat: 'Standard' }, { num: '205', cat: 'Standard' }, { num: '206', cat: 'Standard' },
      { num: '207', cat: 'Standard' }, { num: '208', cat: 'Standard' }, { num: '209', cat: 'Standard' },
      { num: '210', cat: 'Standard' }, { num: '211', cat: 'Standard' }, { num: '212', cat: 'Standard' },
      { num: '213', cat: 'Standard' }, { num: '214', cat: 'Premium' }, { num: '215', cat: 'Standard' }, { num: '216', cat: 'Standard' },
    ],
    items: ROOM_ITEMS,
  },
  'Rooms – Floor 3': {
    icon: 'door',
    isRooms: true,
    floors: [
      { num: '301', cat: 'Standard' }, { num: '302', cat: 'Standard' }, { num: '303', cat: 'Standard' },
      { num: '304', cat: 'Standard' }, { num: '305', cat: 'Standard' }, { num: '306', cat: 'Standard' },
      { num: '307', cat: 'Standard' }, { num: '308', cat: 'Standard' }, { num: '309', cat: 'Standard' },
      { num: '310', cat: 'Standard' }, { num: '311', cat: 'Standard' }, { num: '312', cat: 'Standard' },
      { num: '313', cat: 'Standard' }, { num: '314', cat: 'Premium' }, { num: '316', cat: 'Standard' },
    ],
    items: ROOM_ITEMS,
  },
  'Rooms – Floor 4': {
    icon: 'door',
    isRooms: true,
    floors: [
      { num: '401', cat: 'Standard' }, { num: '402', cat: 'Standard' }, { num: '403', cat: 'Standard' },
      { num: '404', cat: 'Standard' }, { num: '405', cat: 'Standard' }, { num: '406', cat: 'Standard' },
      { num: '407', cat: 'Standard' }, { num: '408', cat: 'Standard' }, { num: '409', cat: 'Standard' },
      { num: '410', cat: 'Standard' }, { num: '411', cat: 'Standard' }, { num: '412', cat: 'Standard' },
      { num: '413', cat: 'Standard' }, { num: '414', cat: 'Premium' }, { num: '415', cat: 'Standard' }, { num: '416', cat: 'Standard' },
    ],
    items: ROOM_ITEMS,
  },
  'Rooms – Floor 5': {
    icon: 'door',
    isRooms: true,
    floors: [
      { num: '501', cat: 'Standard' }, { num: '502', cat: 'Standard' }, { num: '503', cat: 'Standard' },
      { num: '504', cat: 'Standard' }, { num: '505', cat: 'Standard' }, { num: '506', cat: 'Standard' },
      { num: '507', cat: 'Standard' }, { num: '508', cat: 'Standard' }, { num: '509', cat: 'Standard' },
      { num: '510', cat: 'Standard' }, { num: '511', cat: 'Standard' }, { num: '512', cat: 'Standard' },
      { num: '513', cat: 'Standard' }, { num: '514', cat: 'Premium' }, { num: '516', cat: 'Standard' },
    ],
    items: ROOM_ITEMS,
  },
  'Rooms – Floor 6 Club': {
    icon: 'door',
    isRooms: true,
    floors: [
      { num: '601', cat: 'Club Suite' }, { num: '602', cat: 'Club Suite' }, { num: '603', cat: 'Club Deluxe' },
      { num: '604', cat: 'Club' }, { num: '605', cat: 'Club' }, { num: '606', cat: 'Club Deluxe' },
      { num: '607', cat: 'Club Suite' }, { num: '608', cat: 'Club Suite' }, { num: '609', cat: 'Club Suite' },
      { num: '610', cat: 'Club Suite' }, { num: '616', cat: 'Club' },
    ],
    items: ROOM_ITEMS,
  },
  'Licenses – Lessor': {
    icon: 'certificate',
    items: [
      { id: 'LC1', name: 'Change of land use', spec: '' },
      { id: 'LC2', name: 'Permission to access from main road', spec: '' },
      { id: 'LC3', name: 'Water supply borewell – CEIG approval', spec: '' },
      { id: 'LC4', name: 'Building plan approval', spec: '' },
      { id: 'LC5', name: 'Removal of HT/LT electrical lines', spec: '' },
      { id: 'LC6', name: 'Electricity connection 500 KVA HT', spec: '' },
      { id: 'LC7', name: 'Commencement certificate', spec: '' },
      { id: 'LC8', name: 'Fire dept. clearance – pre-construction', spec: '' },
      { id: 'LC9', name: 'Water board clearance', spec: '' },
      { id: 'LC10', name: 'NOC – State Pollution Control Board', spec: '' },
      { id: 'LC11', name: 'Consent to establish & operate', spec: '' },
      { id: 'LC12', name: 'Lift NOC from CEIG', spec: '' },
      { id: 'LC13', name: 'NOC from airport authority', spec: '' },
      { id: 'LC14', name: 'Clearance from forest dept.', spec: '' },
      { id: 'LC15', name: 'Final fire certification', spec: '' },
      { id: 'LC16', name: 'Occupancy certificate', spec: '' },
      { id: 'LC17', name: 'Fire & pollution control NOC', spec: '' },
      { id: 'LC18', name: 'NOC for excise license from landlord', spec: '' },
    ],
  },
  'Licenses – Lessee': {
    icon: 'certificate-2',
    items: [
      { id: 'LL1', name: 'Provident fund registration', spec: '' },
      { id: 'LL2', name: 'ESIC registration', spec: '' },
      { id: 'LL3', name: 'GST registration', spec: '' },
      { id: 'LL4', name: 'Shop & establishment registration', spec: '' },
      { id: 'LL5', name: 'Health NOC', spec: '' },
      { id: 'LL6', name: 'Signage permission', spec: '' },
      { id: 'LL7', name: 'Food & safety licenses', spec: '' },
      { id: 'LL8', name: 'Hotel operating license', spec: '' },
      { id: 'LL9', name: 'Approval – Dept. of Tourism', spec: '' },
      { id: 'LL10', name: 'EPCG from DGFT', spec: '' },
      { id: 'LL11', name: 'Excise license & VAT registration', spec: '' },
      { id: 'LL12', name: 'Tourism license', spec: '' },
      { id: 'LL13', name: 'Weights & measures – metrology', spec: '' },
      { id: 'LL14', name: 'IPRS & live entertainment', spec: '' },
    ],
  },
};

// ---- Helpers shared by the API routes -------------------------------------

const STATUS_VALUES = new Set(STATUS_OPTIONS.map((o) => o.val).filter(Boolean));

export function getItemsForArea(area) {
  const a = CHECKLIST[area];
  return a ? a.items || [] : [];
}

export function isValidItem(area, itemId) {
  return getItemsForArea(area).some((it) => it.id === itemId);
}

export function getItemName(area, itemId) {
  const item = getItemsForArea(area).find((it) => it.id === itemId);
  return item ? item.name : itemId;
}

export function isValidStatus(status) {
  return STATUS_VALUES.has(status);
}

export function isRoomArea(area) {
  return !!(CHECKLIST[area] && CHECKLIST[area].isRooms);
}

export function isValidRoom(area, room) {
  const a = CHECKLIST[area];
  if (!a || !a.isRooms) return room === null || room === undefined;
  return a.floors.some((f) => f.num === room);
}
