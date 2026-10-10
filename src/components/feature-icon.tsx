import {
  Clapperboard,
  ImageIcon,
  Map,
  Sparkles,
  Wand2,
  Film,
  Camera,
  Video,
  Music,
  Mic,
  Palette,
  Zap,
  Rocket,
  Star,
  Heart,
  Cpu,
  Brain,
  Globe,
  Layers,
  Shapes,
  type LucideIcon,
} from 'lucide-react';

export const FEATURE_ICON_NAMES = [
  'Clapperboard',
  'ImageIcon',
  'Map',
  'Sparkles',
  'Wand2',
  'Film',
  'Camera',
  'Video',
  'Music',
  'Mic',
  'Palette',
  'Zap',
  'Rocket',
  'Star',
  'Heart',
  'Cpu',
  'Brain',
  'Globe',
  'Layers',
  'Shapes',
] as const;

export type FeatureIconName = (typeof FEATURE_ICON_NAMES)[number];

const ICON_MAP: Record<string, LucideIcon> = {
  Clapperboard,
  ImageIcon,
  Map,
  Sparkles,
  Wand2,
  Film,
  Camera,
  Video,
  Music,
  Mic,
  Palette,
  Zap,
  Rocket,
  Star,
  Heart,
  Cpu,
  Brain,
  Globe,
  Layers,
  Shapes,
};

export function getFeatureIcon(name: string): LucideIcon {
  return ICON_MAP[name] || Sparkles;
}

interface FeatureIconProps {
  name: string;
  className?: string;
}

export function FeatureIcon({ name, className }: FeatureIconProps) {
  const Icon = getFeatureIcon(name);
  return <Icon className={className} />;
}
