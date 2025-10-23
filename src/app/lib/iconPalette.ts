/**
 * Global icon color palette for consistent theming
 */

export const ICON_COLORS = {
  // Content types
  note: "text-blue-600",
  flashcard: "text-green-600", 
  quiz: "text-purple-600",
  revision: "text-orange-600",
  
  // Difficulty levels
  easy: "text-green-600",
  medium: "text-yellow-600",
  hard: "text-red-600",
  
  // Status indicators
  success: "text-green-600",
  warning: "text-yellow-600",
  error: "text-red-600",
  info: "text-blue-600",
  
  // Interactive states
  primary: "text-blue-600",
  secondary: "text-gray-600",
  accent: "text-purple-600",
  
  // Hover states
  hover: "hover:text-blue-600",
  hoverSuccess: "hover:text-green-600",
  hoverWarning: "hover:text-yellow-600",
  hoverError: "hover:text-red-600"
} as const;

export const ICON_SIZES = {
  xs: "w-3 h-3",
  sm: "w-4 h-4", 
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8"
} as const;

export const ICON_BACKGROUNDS = {
  note: "bg-blue-100",
  flashcard: "bg-green-100",
  quiz: "bg-purple-100", 
  revision: "bg-orange-100",
  success: "bg-green-100",
  warning: "bg-yellow-100",
  error: "bg-red-100",
  info: "bg-blue-100"
} as const;

/**
 * Get icon classes with consistent styling
 */
export function getIconClasses(
  type: keyof typeof ICON_COLORS,
  size: keyof typeof ICON_SIZES = 'md',
  background?: keyof typeof ICON_BACKGROUNDS
): string {
  const baseClasses = `${ICON_SIZES[size]} ${ICON_COLORS[type]}`;
  const bgClass = background ? ICON_BACKGROUNDS[background] : '';
  return `${baseClasses} ${bgClass}`.trim();
}

/**
 * Icon component wrapper with consistent styling
 * Note: This is a utility file for icon classes only.
 * For React components, use the classes directly in your JSX.
 */
export interface IconProps {
  type: keyof typeof ICON_COLORS;
  size?: keyof typeof ICON_SIZES;
  background?: keyof typeof ICON_BACKGROUNDS;
  className?: string;
}
