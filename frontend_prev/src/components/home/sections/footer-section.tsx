'use client';

import { BRANDING } from '@/lib/branding';
import { siteConfig } from '@/lib/site';
import { ChevronRightIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function FooterSection() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mount, we can access the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc = !mounted
    ? BRANDING.logo.light
    : resolvedTheme === 'dark'
      ? BRANDING.logo.dark
      : BRANDING.logo.light;

  return (
    <footer id="footer" className="w-full pb-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-10 max-w-6xl mx-auto">
        <div className="flex flex-col items-start justify-start gap-y-5 max-w-xs mx-0">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={logoSrc}
              alt={`${BRANDING.company} Logo`}
              width={122}
              height={22}
              priority
            />
          </Link>
          <p className="tracking-tight text-muted-foreground font-medium">
            {siteConfig.hero.description}
          </p>

          <div className="flex items-center gap-4">
            <a
              href={siteConfig.links.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="size-5 text-muted-foreground hover:text-primary transition-colors"
              >
                <path
                  fill="currentColor"
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.405a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z"
                />
              </svg>
            </a>
            <a
              href={BRANDING.social.twitter}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="size-5 text-muted-foreground hover:text-primary transition-colors"
              >
                <path
                  fill="currentColor"
                  d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
                />
              </svg>
            </a>
            <a
              href={siteConfig.links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="size-5 text-muted-foreground hover:text-primary transition-colors"
              >
                <path
                  fill="currentColor"
                  d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                />
              </svg>
            </a>
          </div>
          {/* <div className="flex items-center gap-2 dark:hidden">
            <Icons.soc2 className="size-12" />
            <Icons.hipaa className="size-12" />
            <Icons.gdpr className="size-12" />
          </div>
          <div className="dark:flex items-center gap-2 hidden">
            <Icons.soc2Dark className="size-12" />
            <Icons.hipaaDark className="size-12" />
            <Icons.gdprDark className="size-12" />
          </div> */}
        </div>
        <div className="pt-5 md:w-1/2">
          <div className="flex flex-col items-start justify-start md:flex-row md:items-center md:justify-between gap-y-5 lg:pl-10">
            {siteConfig.footerLinks.map((column, columnIndex) => (
              <ul key={columnIndex} className="flex flex-col gap-y-2">
                <li className="mb-2 text-sm font-semibold text-primary">
                  {column.title}
                </li>
                {column.links.map((link, linkIndex) => (
                  <li
                    key={`${columnIndex}-${linkIndex}`}
                    className="group inline-flex cursor-pointer items-center justify-start gap-1 text-[15px]/snug text-muted-foreground"
                  >
                    <Link href={link.url}>{link.title}</Link>
                    <div className="flex size-4 items-center justify-center border border-border rounded translate-x-0 transform opacity-0 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:opacity-100">
                      <ChevronRightIcon className="h-4 w-4 " />
                    </div>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-20 pt-6 border-t border-border">
        <div className="max-w-6xl mx-auto px-10 pb-6 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {BRANDING.company}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
