import React from 'react';
import { 
  Gamepad2,
  Film,
  IceCream,
  DollarSign,
  Moon,
  Sparkle,
  Sparkles,
  Gift,
  Coffee,
  Ticket,
  Trophy,
  Tv,
  Smartphone,
  Music,
  ShoppingBag,
  Heart,
  Smile,
  BookOpen,
  Bike,
  Pizza,
  Utensils,
  Crown,
  Zap,
  Shield,
  Star,
  Gem,
  Award
} from 'lucide-react';

const LUCIDE_ICON_MAP: Record<string, React.ElementType> = {
  Gamepad2,
  gamepad2: Gamepad2,
  gamepad: Gamepad2,
  Film,
  film: Film,
  movie: Film,
  IceCream,
  icecream: IceCream,
  DollarSign,
  dollarsign: DollarSign,
  allowance: DollarSign,
  Moon,
  moon: Moon,
  bedtime: Moon,
  Sparkle,
  sparkle: Sparkle,
  Sparkles,
  sparkles: Sparkles,
  Gift,
  gift: Gift,
  Coffee,
  coffee: Coffee,
  Ticket,
  ticket: Ticket,
  Trophy,
  trophy: Trophy,
  Tv,
  tv: Tv,
  Smartphone,
  smartphone: Smartphone,
  phone: Smartphone,
  Music,
  music: Music,
  ShoppingBag,
  shoppingbag: ShoppingBag,
  Heart,
  heart: Heart,
  Smile,
  smile: Smile,
  BookOpen,
  book: BookOpen,
  Bike,
  bike: Bike,
  bicycle: Bike,
  Pizza,
  pizza: Pizza,
  Utensils,
  food: Utensils,
  Crown,
  crown: Crown,
  Zap,
  zap: Zap,
  Shield,
  shield: Shield,
  Star,
  star: Star,
  Gem,
  gem: Gem,
  Award,
  award: Award,
};

interface RewardIconRendererProps {
  icon?: string;
  fallbackEmoji?: string;
  className?: string;
  size?: number;
}

export const RewardIconRenderer: React.FC<RewardIconRendererProps> = ({
  icon,
  fallbackEmoji = '🎁',
  className = 'w-6 h-6',
  size = 24,
}) => {
  if (!icon) {
    return <span className="select-none leading-none">{fallbackEmoji}</span>;
  }

  // Check if icon name matches a Lucide icon component
  const LucideComp = LUCIDE_ICON_MAP[icon] || LUCIDE_ICON_MAP[icon.toLowerCase()];
  if (LucideComp) {
    return <LucideComp className={className} size={size} />;
  }

  // If it's a short string (like emoji or 1-2 chars), render directly
  // Emojis typically have length <= 4 UTF-16 code units or regex match
  return <span className="select-none leading-none">{icon}</span>;
};
