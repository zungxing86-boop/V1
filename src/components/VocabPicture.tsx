import {
  Globe, Flag, CalendarDays, CalendarCheck, Sun, Moon, Dumbbell, Users,
  Library, ShoppingCart, Sofa, Mountain, GraduationCap, Tv, Palette,
  Camera, CookingPot, Search, Waves, Bike, Puzzle, BookOpen, Keyboard,
  Cake, Theater, Volleyball, Brain, Stethoscope, Ear, Smile, Wind,
  Accessibility, Eye, HeartPulse, Thermometer, Hospital, Compass,
  Landmark, Building, Train, MapPin, Sprout, Tractor, Dog, Snowflake,
  CloudSun, Newspaper, Radio, Trees, Gamepad2, Fish, type LucideIcon,
} from 'lucide-react';
import type { VocabItem } from '../types/curriculum';

const pictures: Record<string, LucideIcon> = {
  'v1-iran': Flag, 'v1-china': Flag, 'v1-continents': Globe,
  'v2-weekdays': CalendarDays, 'v2-weekend': CalendarCheck,
  'v2-saturday': CalendarDays, 'v2-tuesday': CalendarDays,
  'v2-morning': Sun, 'v2-evening': Moon, 'v2-gym': Dumbbell,
  'v2-relatives': Users, 'v2-library': Library, 'v2-shopping': ShoppingCart,
  'v2-relax': Sofa, 'v2-climb': Mountain, 'v2-study': GraduationCap,
  'v2-sports': Tv, 'v3-draw': Palette, 'v3-photos': Camera,
  'v3-cook': CookingPot, 'v3-web': Search, 'v3-swim': Waves,
  'v3-bicycle': Bike, 'v3-puzzle': Puzzle, 'v3-quran': BookOpen,
  'v3-type': Keyboard, 'v3-cake': Cake, 'v3-story': Theater,
  'v3-sports-games': Volleyball, 'v4-headache': Brain,
  'v4-sore-throat': Stethoscope, 'v4-toothache': Smile, 'v4-earache': Ear,
  'v4-running-nose': Wind, 'v4-backache': Accessibility, 'v4-sore-eyes': Eye,
  'v4-stomachache': HeartPulse, 'v4-cough-sneeze': Thermometer,
  'v4-medical': Hospital, 'v4-mumps-measles': Stethoscope,
  'v5-directions': Compass, 'v5-shrine-mosque': Landmark,
  'v5-museum-bridge': Building, 'v5-transport': Train, 'v5-other-places': MapPin,
  'v6-village': Mountain, 'v6-field-farm': Sprout, 'v6-tools-animals': Tractor,
  'v6-animals-list': Dog, 'v6-seasons': Snowflake, 'v6-weather': CloudSun,
  'v6-temp': Thermometer, 'v7-reading-mag': Newspaper,
  'v7-movies-radio': Radio, 'v7-park-garden': Trees,
  'v7-games-net': Gamepad2, 'v7-outdoor': Fish,
};

export function VocabPicture({ item }: { item: VocabItem }) {
  const Picture = pictures[item.id] ?? BookOpen;
  return (
    <div role="img" aria-label={`تصویر آموزشی: ${item.fa}`} className="vocab-picture">
      <Picture size={88} strokeWidth={1.7} aria-hidden="true" />
      {item.id === 'v1-iran' && <span className="picture-country">IRAN</span>}
      {item.id === 'v1-china' && <span className="picture-country">CHINA</span>}
    </div>
  );
}
