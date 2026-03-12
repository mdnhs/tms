'use client';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  to: string;
  className?: string;
  activeClassName?: string;
  end?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, activeClassName, to, end, ...props }, ref) => {
    const pathname = usePathname();
    const isActive = end
      ? pathname === to
      : to !== '/' ? pathname.startsWith(to) : pathname === '/';

    return (
      <NextLink
        ref={ref}
        href={to}
        className={cn(className, isActive && activeClassName)}
        {...props}
      />
    );
  },
);

NavLink.displayName = 'NavLink';
export { NavLink };
