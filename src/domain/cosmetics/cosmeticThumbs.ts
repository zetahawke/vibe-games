/** Static SVG thumbnails for profile cosmetic grid. */
export function cosmeticThumbSvg(id: string): string {
  const wrap = (inner: string) =>
    `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;

  switch (id) {
    case 'none':
      return wrap(
        `<rect x="8" y="8" width="48" height="48" rx="8" fill="none" stroke="#6a7a70" stroke-width="3" stroke-dasharray="6 4"/>
         <line x1="18" y1="18" x2="46" y2="46" stroke="#6a7a70" stroke-width="3"/>`,
      );
    case 'cap':
      return wrap(
        `<ellipse cx="32" cy="36" rx="22" ry="12" fill="#1a3a8a"/>
         <rect x="12" y="28" width="40" height="12" rx="4" fill="#1a3a8a"/>
         <rect x="18" y="34" width="28" height="8" rx="2" fill="#152e6e"/>`,
      );
    case 'beanie':
      return wrap(
        `<ellipse cx="32" cy="38" rx="20" ry="14" fill="#2a2a2a"/>
         <path d="M14 36 Q32 12 50 36" fill="#3a3a3a"/>
         <circle cx="44" cy="22" r="5" fill="#c94c4c"/>`,
      );
    case 'jersey':
      return wrap(
        `<rect x="14" y="14" width="36" height="40" rx="4" fill="#e8e8e8"/>
         <rect x="14" y="24" width="36" height="10" fill="#c94c4c"/>
         <text x="32" y="44" text-anchor="middle" font-size="14" fill="#1a1a1a" font-family="sans-serif">10</text>`,
      );
    case 'armor':
      return wrap(
        `<rect x="14" y="16" width="36" height="34" rx="4" fill="#6a6e78"/>
         <rect x="8" y="18" width="12" height="10" rx="2" fill="#555963"/>
         <rect x="44" y="18" width="12" height="10" rx="2" fill="#555963"/>
         <rect x="26" y="28" width="12" height="8" rx="2" fill="#c9a227"/>`,
      );
    case 'jersey_argentina':
      return wrap(
        `<rect x="14" y="14" width="36" height="40" rx="4" fill="#74c2e8"/>
         <rect x="14" y="22" width="36" height="10" fill="#ffffff"/>
         <rect x="14" y="40" width="36" height="6" fill="#ffffff"/>
         <circle cx="32" cy="36" r="5" fill="#1a3a8a"/>`,
      );
    case 'shinguards':
      return wrap(
        `<rect x="12" y="18" width="16" height="32" rx="4" fill="#d0d4dc"/>
         <rect x="36" y="18" width="16" height="32" rx="4" fill="#d0d4dc"/>
         <rect x="14" y="22" width="12" height="8" fill="#a8b0bc"/>
         <rect x="38" y="22" width="12" height="8" fill="#a8b0bc"/>`,
      );
    case 'shorts_football':
      return wrap(
        `<rect x="12" y="20" width="40" height="18" rx="3" fill="#1a3a8a"/>
         <rect x="12" y="36" width="18" height="16" rx="2" fill="#1a3a8a"/>
         <rect x="34" y="36" width="18" height="16" rx="2" fill="#1a3a8a"/>
         <rect x="12" y="18" width="40" height="5" fill="#ffffff"/>`,
      );
    case 'hair_spiky':
      return wrap(
        `<ellipse cx="32" cy="40" rx="18" ry="12" fill="#2a1810"/>
         <polygon points="18,36 22,12 26,36" fill="#3b2414"/>
         <polygon points="28,34 32,8 36,34" fill="#3b2414"/>
         <polygon points="38,36 42,14 46,36" fill="#3b2414"/>`,
      );
    default:
      return wrap(`<rect x="12" y="12" width="40" height="40" rx="6" fill="#3d5c4a"/>`);
  }
}
