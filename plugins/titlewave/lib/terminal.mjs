import { execFileSync } from 'node:child_process';
import { openSync, writeSync, closeSync } from 'node:fs';
import { validateName } from './agents.mjs';
import { nativeCommand } from './rpc.mjs';

export function terminalHost(env = process.env, herdrPane) {
  if (herdrPane !== undefined) {
    try { validateName(herdrPane); }
    catch { throw new Error('Use a nonempty, fully qualified --herdr-pane ID without control characters.'); }
    return 'herdr';
  }
  if (env.CODEX_DAEMON_SHUTDOWN_SOCKET) throw new Error('Codex shared-daemon terminal context may belong to another pane. Start Codex with --no-daemon; Herdr callers can instead supply a verified --herdr-pane ID.');
  if ([env.TMUX && env.TMUX_PANE, env.STY && env.WINDOW !== undefined, env.ZELLIJ].filter(Boolean).length > 1) {
    throw new Error('Multiple multiplexers detected; omit --terminal or clear the inherited outer context.');
  }
  if (env.TMUX && env.TMUX_PANE) return 'tmux';
  if (env.STY && env.WINDOW !== undefined) return 'screen';
  if (env.ZELLIJ) return 'zellij';
  if (env.HERDR_PANE_ID) return 'herdr';
  if (env.WEZTERM_PANE) return 'wezterm';
  if (env.KITTY_WINDOW_ID) return 'kitty';
  return 'osc';
}

function ancestorTty() {
  let pid = process.ppid;
  const seen = new Set();
  try {
    while (pid > 1 && !seen.has(pid)) {
      seen.add(pid);
      const [parent, tty] = execFileSync('/bin/ps', ['-p', String(pid), '-o', 'ppid=', '-o', 'tty='], { encoding: 'utf8', timeout: 1000, stdio: ['ignore', 'pipe', 'ignore'] }).trim().split(/\s+/);
      if (/^(pts\/\d+|tty[\w]+)$/.test(tty || '')) return `/dev/${tty}`;
      pid = Number(parent);
    }
  } catch {}
}

export function setTerminalTitle(name, env = process.env, herdrPane) {
  validateName(name);
  const run = (exe, args) => execFileSync(nativeCommand(exe), args, { encoding: 'utf8', timeout: 5000, windowsHide: true });
  const host = terminalHost(env, herdrPane);
  switch (host) {
    case 'tmux':
      run('tmux', ['select-pane', '-t', env.TMUX_PANE, '-T', name]);
      if (run('tmux', ['display-message', '-p', '-t', env.TMUX_PANE, '#{window_panes}']).trim() === '1') run('tmux', ['rename-window', '-t', env.TMUX_PANE, name]);
      break;
    case 'screen': run('screen', ['-S', env.STY, '-p', env.WINDOW, '-X', 'title', name]); break;
    case 'herdr': {
      if (name !== name.trim()) throw new Error('Herdr trims surrounding whitespace; use a title without it.');
      const command = nativeCommand('herdr');
      const herdr = args => execFileSync(command, args, { encoding: 'utf8', timeout: 5000, windowsHide: true });
      let paneSaved = false;
      try {
        const target = herdrPane || env.HERDR_PANE_ID;
        const pane = JSON.parse(herdr(['pane', 'get', target]))?.result?.pane;
        if (typeof pane?.pane_id !== 'string' || !pane.pane_id) throw new Error('Herdr pane was not found.');
        if (herdrPane && pane.pane_id !== herdrPane) throw new Error('Herdr requires the exact fully qualified --herdr-pane ID.');
        herdr(['pane', 'rename', pane.pane_id, name]);
        const savedPane = JSON.parse(herdr(['pane', 'get', pane.pane_id]))?.result?.pane;
        if (savedPane?.pane_id !== pane.pane_id || savedPane.label !== name) throw new Error('Herdr did not save the pane label.');
        paneSaved = true;
        if (typeof savedPane.tab_id !== 'string' || !savedPane.tab_id) throw new Error('Herdr pane has no tab ID.');
        const tab = JSON.parse(herdr(['tab', 'get', savedPane.tab_id]))?.result?.tab;
        if (tab?.tab_id !== savedPane.tab_id || !Number.isSafeInteger(tab.pane_count) || tab.pane_count < 1) throw new Error('Herdr tab was not found.');
        if (tab.pane_count === 1) {
          herdr(['tab', 'rename', tab.tab_id, name]);
          const savedTab = JSON.parse(herdr(['tab', 'get', tab.tab_id]))?.result?.tab;
          if (savedTab?.tab_id !== tab.tab_id || savedTab.label !== name) throw new Error('Herdr did not save the tab label.');
        }
      } catch (error) {
        throw new Error(`${paneSaved ? 'Herdr pane label saved; tab label unverified' : 'Herdr pane label unverified'}: ${error.message}`);
      }
      break;
    }
    case 'wezterm': {
      const panes = JSON.parse(run('wezterm', ['cli', 'list', '--format', 'json']));
      const pane = panes.find(p => String(p.pane_id) === env.WEZTERM_PANE);
      if (!pane) throw new Error('WezTerm pane was not found.');
      if (panes.filter(p => p.tab_id === pane.tab_id).length !== 1) throw new Error('Split WezTerm tab kept its existing title.');
      run('wezterm', ['cli', 'set-tab-title', '--pane-id', env.WEZTERM_PANE, name]);
      break;
    }
    case 'kitty': run('kitty', ['@', 'set-window-title', '--match', `id:${env.KITTY_WINDOW_ID}`, name]); break;
    case 'zellij':
      if (!env.ZELLIJ_PANE_ID) throw new Error('Zellij requires ZELLIJ_PANE_ID to target the calling pane safely.');
      run('zellij', ['action', 'rename-pane', '--pane-id', env.ZELLIJ_PANE_ID, name]);
      break;
    case 'osc': {
      let fd;
      try { fd = openSync(process.platform === 'win32' ? '\\\\.\\CONOUT$' : '/dev/tty', 'w'); }
      catch (error) {
        if (process.platform === 'win32' || !['ENXIO', 'ENODEV', 'ENOTTY', 'ENOENT'].includes(error.code)) throw error;
        const tty = ancestorTty();
        if (!tty) throw error;
        fd = openSync(tty, 'w');
      }
      try { writeSync(fd, `\x1b]2;${name}\x07`); } finally { closeSync(fd); }
      break;
    }
  }
  return host;
}
