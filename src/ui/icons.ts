import type { ToyId } from '../toys/types';

const paths: Record<string, string> = {
  pencil: '<path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-4-4L5 15l-1 5Z"/>',
  undo: '<path d="M8 4 3 9l5 5M3 9h10a6 6 0 0 1 0 12"/>',
  bubbles:
    '<circle cx="9" cy="14" r="7"/><circle cx="18" cy="5" r="3"/><circle cx="20" cy="18" r="2"/><path d="M5 13a4 4 0 0 1 4-3"/>',
  mic: '<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/>',
  search:
    '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6M8 9c0-3 5-3 5 0 0 2-3 1-3 3m0 2h.01"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"/><path d="m17 3 .6 2.4L20 6l-2.4.6L17 9l-.6-2.4L14 6l2.4-.6Z"/>',
  volume: '<path d="M11 4 6 8H3v8h3l5 4V4Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  muted: '<path d="M11 4 6 8H3v8h3l5 4V4Z"/><path d="m16 9 5 6m0-6-5 6"/>',
  play: '<path d="m8 5 11 7-11 7V5Z"/>',
  pause: '<path d="M8 5v14M16 5v14" stroke-width="3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  home: '<path d="m3 11 9-8 9 8M5 9v11h5v-6h4v6h5V9"/>',
  rotate: '<path d="M3 11a9 9 0 0 1 15-6l3 3M21 3v5h-5M21 13a9 9 0 0 1-15 6l-3-3M3 21v-5h5"/>',
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  family:
    '<circle cx="8" cy="7" r="3"/><circle cx="17" cy="8" r="2.5"/><path d="M2 20v-3a6 6 0 0 1 12 0v3m1-7a5 5 0 0 1 7 4v3"/>',
  camera: '<path d="M3 7h4l2-3h6l2 3h4v13H3V7Z"/><circle cx="12" cy="13" r="4"/>',
  fullscreen: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  shuffle:
    '<path d="M3 7h3c5 0 7 10 12 10h3m-4-4 4 4-4 4M3 17h3c1.5 0 3-1.2 4-3m4-4c1-1.8 2.5-3 4-3h3m-4-4 4 4-4 4"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  mouse:
    '<rect x="7" y="2" width="10" height="16" rx="5"/><path d="M12 5v3M4 22l-2-2 2-2m16 4 2-2-2-2"/>',
  leaf: '<path d="M20 3C8 2 2 7 5 15c7 6 14 0 15-12Z"/><path d="M3 21 15 9"/>',
  sparkle: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
};

export function icon(name: string, size = 20) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.sparkle}</svg>`;
}

const toys: Record<ToyId, string> = {
  castle:
    '<path d="M9 29h16v25H9z" fill="#a4b08b"/><path d="M39 29h16v25H39z" fill="#dfa58b"/><path d="m7 29 10-17 10 17" fill="#768768"/><path d="m37 29 10-17 10 17" fill="#c88067"/><path d="M25 35h14v19H25z" fill="#dfc697"/><path d="M29 54V43a3 3 0 0 1 6 0v11" fill="#b19166"/><path d="M16 20V7l10 4-10 4m30 4V6l10 4-10 4" stroke="#927953" stroke-width="1.7" fill="#e6bd6f"/><path d="M14 35h6v7h-6zm30 0h6v7h-6z" fill="#f9ebd2"/><path d="M7 55h50" stroke="#c4ab80" stroke-width="3" stroke-linecap="round"/>',
  blocks:
    '<g stroke="#9d7853" stroke-opacity=".17" stroke-width="1.4"><rect x="9" y="34" width="21" height="21" rx="3" fill="#d3967e"/><rect x="32" y="34" width="22" height="21" rx="3" fill="#9bb9b8"/><rect x="21" y="12" width="22" height="21" rx="3" fill="#e2bc72"/></g><g fill="#fff5db" font-family="Georgia" font-size="15" text-anchor="middle"><text x="32" y="28">A</text><text x="19.5" y="50">B</text><text x="43" y="50">C</text></g>',
  books:
    '<g transform="rotate(-9 32 34)"><rect x="10" y="17" width="37" height="37" rx="3" fill="#91aaa2"/><path d="M15 49h36v6H15a3 3 0 0 1 0-6" fill="#f9edd4"/><rect x="17" y="8" width="36" height="39" rx="3" fill="#d0a467"/><path d="M21 8v39" stroke="#b68c51" stroke-width="1.4"/><circle cx="37" cy="27" r="9" fill="#f7e9c8"/><path d="M38 17a9 9 0 0 0 8 14A9 9 0 1 1 38 17" fill="#fff8e6"/><path d="M30 41h13" stroke="#f3e3c5" stroke-width="1.4"/></g>',
  ball: '<circle cx="32" cy="32" r="23" fill="#f4e9ce"/><path d="M32 9c-21 13-21 33 0 46C1 54 1 10 32 9" fill="#a0b192"/><path d="M32 9c15 13 15 33 0 46C63 54 63 10 32 9" fill="#ce927b"/><path d="M32 9c-11 11-11 36 0 46 11-10 11-34 0-46" fill="#e4c480"/><circle cx="31" cy="11" r="3" fill="#eee1bb"/><ellipse cx="24" cy="23" rx="3" ry="5" fill="#fff" opacity=".2"/>',
  horse:
    '<path d="M11 50q21 15 43 0" stroke="#a78a60" stroke-width="4" fill="none" stroke-linecap="round"/><path d="m21 37-3 16m23-18 5 18" stroke="#bb9968" stroke-width="5"/><path d="M15 30q8-5 19 0l4-16 8-3 6 10-1 6-10-2-1 15H20q-10-2-5-10" fill="#d0af7e"/><path d="m38 15 1-7 6 5m-31 18-5 8" fill="#c3a16f" stroke="#c3a16f" stroke-width="3" stroke-linecap="round"/><path d="M22 29h13v11H22z" fill="#8fa080"/><path d="m35 17-3 12" stroke="#f0dfbe" stroke-width="4" stroke-linecap="round"/><circle cx="45" cy="19" r="1.5" fill="#61513e"/><path d="M38 29h11" stroke="#859574" stroke-width="2.8" stroke-linecap="round"/>',
  music:
    '<path d="M8 23h48v25H8z" fill="#c6a77a"/><g transform="rotate(-8 32 34)"><rect x="8" y="16" width="7" height="34" rx="2" fill="#cf927d"/><rect x="17" y="18" width="7" height="30" rx="2" fill="#e1ba78"/><rect x="26" y="20" width="7" height="26" rx="2" fill="#acb690"/><rect x="35" y="22" width="7" height="22" rx="2" fill="#9bb6b6"/><rect x="44" y="24" width="7" height="18" rx="2" fill="#b5a3b4"/></g><path d="m16 56 30-41m-9 41L14 17" stroke="#a78c65" stroke-width="2.5" stroke-linecap="round"/><circle cx="46" cy="14" r="4" fill="#d3ab67"/><circle cx="14" cy="17" r="4" fill="#c98770"/>',
  tea: '<ellipse cx="30" cy="53" rx="25" ry="4" fill="#dfccb0"/><path d="M13 29C2 22 1 43 14 40" stroke="#9aaa88" stroke-width="4" fill="none"/><path d="M37 32 48 22l4 4-11 16" fill="#9eaf8c"/><ellipse cx="27" cy="38" rx="16" ry="14" fill="#a8b593"/><path d="M15 27q12-8 24 0" fill="#c1cbae"/><ellipse cx="27" cy="25" rx="11" ry="3" fill="#899b7c"/><circle cx="27" cy="21" r="3" fill="#bfa477"/><path d="M46 45c10-4 10 7 0 5" stroke="#d49b80" stroke-width="2" fill="none"/><path d="M37 42h11l-1 10h-9z" fill="#d49b80"/><ellipse cx="42.5" cy="42" rx="5.5" ry="1.5" fill="#b1825e"/>',
  rainbow:
    '<g fill="none" stroke-linecap="round" stroke-width="7"><path d="M9 48V33a23 23 0 0 1 46 0v15" stroke="#c99178"/><path d="M18 48V33a14 14 0 0 1 28 0v15" stroke="#dfbd77"/><path d="M27 48V33a5 5 0 0 1 10 0v15" stroke="#a4b18c"/></g><path d="M5 54h54" stroke="#d7c8ab" stroke-width="2.5" stroke-linecap="round"/>',
};

export function toyIcon(id: ToyId) {
  return `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">${toys[id]}</svg>`;
}
export function avatar() {
  return `<img src="${import.meta.env.BASE_URL}favicon.svg" width="43" height="43" alt="Kaia’s portrait" />`;
}
export function flower() {
  return '<svg width="35" height="35" viewBox="0 0 40 40" aria-hidden="true"><g fill="#a2ad8f"><ellipse cx="20" cy="10" rx="5" ry="8"/><ellipse cx="20" cy="30" rx="5" ry="8"/><ellipse cx="10" cy="20" rx="8" ry="5"/><ellipse cx="30" cy="20" rx="8" ry="5"/><ellipse cx="13" cy="13" rx="5" ry="7" transform="rotate(-45 13 13)"/><ellipse cx="27" cy="27" rx="5" ry="7" transform="rotate(-45 27 27)"/><ellipse cx="13" cy="27" rx="5" ry="7" transform="rotate(45 13 27)"/><ellipse cx="27" cy="13" rx="5" ry="7" transform="rotate(45 27 13)"/></g><circle cx="20" cy="20" r="6" fill="#eee0b9"/></svg>';
}
