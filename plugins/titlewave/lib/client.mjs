import { readFileSync, readlinkSync } from 'node:fs';
import { basename, join } from 'node:path';
import { execFileSync } from 'node:child_process';

export function gooseOwner(owners) {
  for (const owner of owners) {
    const names = [owner.command, owner.args[0] || ''].map(name => basename(name).replace(/\.exe$/i, '').toLowerCase());
    if (names.includes('goosed')) return false;
    if (!names.includes('goose')) continue;
    if (owner.args.length === 0) return undefined;
    const mode = owner.args[1];
    if (!mode || ['session', 's', 'run'].includes(mode)) return true;
    if (['acp', 'mcp', 'web', 'gateway', 'gw', 'serve', 'server'].includes(mode)) return false;
    return undefined;
  }
  return undefined;
}

export function gooseClient() {
  try {
    if (process.platform === 'win32') {
      const script = `$processes=@{}; Get-CimInstance Win32_Process -Property ProcessId,ParentProcessId,Name,ExecutablePath,CommandLine | ForEach-Object { $processes[[int]$_.ProcessId]=$_ }; $ancestorId=${process.ppid}; $items=@(); for($i=0;$i -lt 20 -and $ancestorId -gt 0;$i++){ $p=$processes[[int]$ancestorId]; if(!$p){break}; $command=if($p.ExecutablePath){$p.ExecutablePath}else{$p.Name}; $items+=@{command=$command; commandLine=$p.CommandLine}; $ancestorId=$p.ParentProcessId }; ConvertTo-Json -InputObject $items -Compress`;
      const output = execFileSync(join(process.env.SystemRoot, 'System32/WindowsPowerShell/v1.0/powershell.exe'), ['-NoProfile', '-NonInteractive', '-Command', script], { encoding: 'utf8', timeout: 5000, windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });
      return gooseOwner(JSON.parse(output).map(owner => ({ command: owner.command, args: commandArgs(owner.command, owner.commandLine || '') })));
    }
    function* owners() {
      let pid = process.ppid;
      for (let i = 0; i < 20 && pid > 0; i++) {
        if (process.platform === 'linux') {
          const base = `/proc/${pid}`, stat = readFileSync(`${base}/stat`, 'utf8');
          const parent = Number(stat.slice(stat.lastIndexOf(')') + 2).split(' ')[1]);
          yield { command: readlinkSync(`${base}/exe`), args: readFileSync(`${base}/cmdline`, 'utf8').split('\0').filter(Boolean) };
          pid = parent;
        } else {
          const ps = column => execFileSync('/bin/ps', ['-p', String(pid), '-o', `${column}=`], { encoding: 'utf8', timeout: 1000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
          const parent = Number(ps('ppid'));
          const command = ps('comm'), raw = ps('args');
          yield { command, args: commandArgs(command, raw) };
          pid = parent;
        }
      }
    }
    return gooseOwner(owners());
  } catch { return undefined; }
}

export function commandArgs(command, raw) {
  const tail = raw === command || raw.startsWith(command + ' ') ? raw.slice(command.length).trim() : undefined;
  const words = text => text.match(/"[^"]*"|'[^']*'|[^\s]+/g)?.map(arg => arg.replace(/^["']|["']$/g, '')) || [];
  return tail === undefined ? words(raw) : [command, ...words(tail)];
}
