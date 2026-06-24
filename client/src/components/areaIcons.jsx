import {
  Building2,
  Building,
  Home,
  Armchair,
  ArrowUpDown,
  Trees,
  UtensilsCrossed,
  Flame,
  Cog,
  Monitor,
  Accessibility,
  Bath,
  BedDouble,
  ScrollText,
  FileCheck,
  Boxes,
  Shirt,
  ClipboardList,
} from 'lucide-react';

const MAP = {
  'Hotel Entrance': Building2,
  Lobby: Armchair,
  'Guest Elevators': ArrowUpDown,
  'Ground Floor Hall': Home,
  Lawn: Trees,
  'First Floor Hall': Building,
  Restaurant: UtensilsCrossed,
  Kitchen: Flame,
  'Main Kitchen': Flame,
  'Base Kitchen': Flame,
  'Satellite Kitchen': Flame,
  'Service Elevators': ArrowUpDown,
  'Plant & Machinery': Cog,
  'BOH Ground Floor': Boxes,
  'IT & Security': Monitor,
  Laundry: Shirt,
  'Specially Abled Rooms': Accessibility,
  'Public Washrooms': Bath,
  'Licenses – Lessor': ScrollText,
  'Licenses – Lessee': FileCheck,
};

export function AreaIcon({ area, className }) {
  let Icon = MAP[area];
  if (!Icon && area.startsWith('Rooms')) Icon = BedDouble;
  if (!Icon) Icon = ClipboardList;
  return <Icon className={className} aria-hidden="true" />;
}
