import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-lg border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-white dark:text-white [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-muted text-muted-foreground [a&]:hover:bg-muted/80',
        destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border-border text-foreground/80 [a&]:hover:bg-accent [a&]:hover:text-foreground',
        new:
          'text-purple-600 dark:text-purple-300 bg-purple-600/30 dark:bg-purple-600/30',
        beta:
          'text-blue-600 dark:text-blue-300 bg-blue-600/30 dark:bg-blue-600/30',
        highlight:
          'text-green-800 dark:text-green-300 bg-green-600/30 dark:bg-green-600/30',
        success:
          'border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-300',
        neutral:
          'border border-border/80 bg-background/60 text-foreground/70 dark:bg-muted/40',
        warning:
          'border border-amber-400/40 bg-amber-100 text-amber-700 dark:border-amber-500/40 dark:bg-amber-400/10 dark:text-amber-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
