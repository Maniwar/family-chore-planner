import React from 'react';

export type SurfaceVariant = 
  | 'card' 
  | 'card-secondary' 
  | 'row' 
  | 'inset' 
  | 'elevated' 
  | 'interactive';

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  variant?: SurfaceVariant;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Content Layer Reusable Primitive: Surface
 * 
 * Used strictly for content items:
 * - Chore rows & checklist items
 * - Summary & statistics cards
 * - Person & member rows
 * - History & audit logs
 * - Settings lists & form fields
 * 
 * Adheres strictly to Glass & Ice best practices:
 * - Solid or near-solid fills (var(--surface-1) or var(--surface-2))
 * - Zero backdrop-blur (preserves 60fps scrolling & crisp readability)
 * - Standard high-contrast borders & accessible text colors
 */
export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(({
  as: Component = 'div',
  variant = 'card',
  className = '',
  style = {},
  children,
  ...props
}, ref) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'card-secondary':
      case 'inset':
        return 'content-surface-2 rounded-2xl border border-solid';
      case 'row':
        return 'content-surface rounded-xl border border-solid';
      case 'elevated':
        return 'content-surface rounded-2xl border border-solid shadow-md';
      case 'interactive':
        return 'content-surface rounded-2xl border border-solid transition-all duration-200 hover:shadow-xs active:scale-[0.99] cursor-pointer';
      case 'card':
      default:
        return 'content-surface rounded-2xl border border-solid shadow-2xs';
    }
  };

  return (
    <Component
      ref={ref}
      className={`${getVariantClasses()} ${className}`}
      style={{
        borderColor: 'var(--border-default)',
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
});

Surface.displayName = 'Surface';
