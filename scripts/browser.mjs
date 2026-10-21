// Locate a Chromium for headless checks: $CHROME_PATH, Playwright's browser cache
// ($PLAYWRIGHT_BROWSERS_PATH or ~/Library/Caches/ms-playwright), or a system Chrome.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export function findBrowser() {
  const cands = [process.env.CHROME_PATH];
  for (const dir of [process.env.PLAYWRIGHT_BROWSERS_PATH, join(homedir(), 'Library/Caches/ms-playwright'), join(homedir(), '.cache/ms-playwright')]) {
    if (!dir || !existsSync(dir)) continue;
    for (const d of readdirSync(dir).sort().reverse()) {
      if (d.startsWith('chromium_headless_shell-')) cands.push(join(dir, d, 'chrome-linux/headless_shell'), join(dir, d, 'chrome-headless-shell-linux64/chrome-headless-shell'), join(dir, d, 'chrome-headless-shell-mac-arm64/chrome-headless-shell'));
      if (/^chromium-\d+$/.test(d)) cands.push(join(dir, d, 'chrome-linux/chrome'), join(dir, d, 'chrome-linux64/chrome'));
    }
  }
  cands.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium', '/usr/bin/google-chrome');
  return cands.filter(Boolean).find((p) => existsSync(p));
}
