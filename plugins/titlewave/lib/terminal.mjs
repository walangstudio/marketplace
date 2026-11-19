import { execFileSync } from 'node:child_process';
import { openSync, writeSync, closeSync } from 'node:fs';
import { validateName } from './agents.mjs';
import { nativeCommand } from './rpc.mjs';

export function terminalHost(env = process.env) {
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

export function setTerminalTitle(name, env = process.env) {
  validateName(name);
  const run = (exe, args) => execFileSync(nativeCommand(exe), args, { encoding: 'utf8', timeout: 5000, windowsHide: true });
  const host = terminalHost(env);
  switch (host) {
    case 'tmux':
      run('tmux', ['select-pane', '-t', env.TMUX_PANE, '-T', name]);
      if (run('tmux', ['display-message', '-p', '-t', env.TMUX_PANE, '#{window_panes}']).trim() === '1') run('tmux', ['rename-window', '-t', env.TMUX_PANE, name]);
      break;
    case 'screen': run('screen', ['-S', env.STY, '-p', env.WINDOW, '-X', 'title', name]); break;
    case 'herdr': run('herdr', ['pane', 'rename', env.HERDR_PANE_ID, name]); break;
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
      const fd = openSync(process.platform === 'win32' ? '\\\\.\\CONOUT$' : '/dev/tty', 'w');
      try { writeSync(fd, `\x1b]2;${name}\x07`); } finally { closeSync(fd); }
      break;
    }
  }
  return host;
}
