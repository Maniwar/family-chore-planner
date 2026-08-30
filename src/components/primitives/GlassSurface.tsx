import React from 'react';

export type GlassSurfaceVariant = 
  | 'header' 
  | 'tabbar' 
  | 'modal' 
  | 'sheet' 
  | 'banner' 
  | 'action-bar' 
  | 'floating';

export interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  variant?: GlassSurfaceVariant;
  dimmed?: boolean;
  borderPosition?: 'all' | 'top' | 'bottom' | 'none' | 'y';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Chrome Layer Reusable Primitive: GlassSurface
 * 
 * Used strictly for floating chrome surfaces:
 * - Top Navigation & Headers
 * - Fixed Bottom Tab Bars
 * - Modals & Bottom Sheet shells
 * - Floating Banners (Nudges, Toasts)
 * - Sticky Action Bars
 * 
 * Adheres strictly to Glass & Ice best practices:
 * - Minimum tint thickness (>= 0.70 light, >= 0.68 dark)
 * - Standard blur radius (20px glass, 28px ice)
 * - Specular hairline borders
 * - Accessible fallbacks for prefers-reduced-transparency & forced-colors
 * - Dimmed state for glass-on-glass prevention
 */
export const GlassSurface = React.forwardRef<HTMLDivElement, GlassSurfaceProps>(({
  as: Component = 'div',
  variant = 'floating',
  dimmed = false,
  borderPosition = 'all',
  className = '',
  style = {},
  children,
  ...props
}, ref) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'header':
        return 'chrome-glass chrome-glass-header shadow-xs';
      case 'tabbar':
        return 'chrome-glass chrome-glass-tabbar shadow-lg';
      case 'modal':
      case 'sheet':
        return 'chrome-glass chrome-glass-modal shadow-2xl';
      case 'banner':
        return 'chrome-glass chrome-glass-banner shadow-xl';
      case 'action-bar':
        return 'chrome-glass chrome-glass-actionbar shadow-md';
      case 'floating':
      default:
        return 'chrome-glass shadow-md';
    }
  };

  const getBorderClasses = () => {
    switch (borderPosition) {
      case 'top':
        return 'border-t border-solid';
      case 'bottom':
        return 'border-b border-solid';
      case 'y':
        return 'border-y border-solid';
      case 'none':
        return 'border-0';
      case 'all':
      default:
        return 'border border-solid';
    }
  };

  const dimClasses = dimmed ? 'opacity-40 pointer-events-none transition-opacity duration-300' : 'transition-opacity duration-300';

  return (
    <Component
      ref={ref}
      className={`${getVariantClasses()} ${getBorderClasses()} ${dimClasses} ${className}`}
      style={{
        borderColor: 'var(--glass-border-color)',
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
});

GlassSurface.displayName = 'GlassSurface';
