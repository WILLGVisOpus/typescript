import { FC } from "react";

// VisOpus brand mark — navy square with amber V + dot. Matches /public/icon.svg.
// Filename retained for backward compatibility with any leftover imports.
export const ZitadelLogoLight: FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" height="100%" width="100%">
    <rect width="32" height="32" rx="6" fill="#0a1628" />
    <path
      d="M7 9L16 23L25 9"
      stroke="#f59e0b"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="16" cy="10" r="3" fill="#f59e0b" />
  </svg>
);
