/** Cross-browser fullscreen helpers (gesture-gated by the browser). */

type FsDoc = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
};

type FsEl = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
};

export function isFullscreen(): boolean {
  const doc = document as FsDoc;
  return Boolean(document.fullscreenElement ?? doc.webkitFullscreenElement);
}

export function fullscreenLabel(): string {
  return isFullscreen() ? 'Salir de pantalla completa' : 'Pantalla completa';
}

export async function toggleFullscreen(target: HTMLElement = document.documentElement): Promise<void> {
  const doc = document as FsDoc;
  const el = target as FsEl;
  try {
    if (isFullscreen()) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
      return;
    }
    if (el.requestFullscreen) await el.requestFullscreen();
    else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
  } catch {
    // User gesture denied / unsupported — ignore quietly.
  }
}
