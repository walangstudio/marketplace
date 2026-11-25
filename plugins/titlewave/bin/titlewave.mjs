#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { spawn } from 'node:child_process';
import { constants } from 'node:os';
import { detectAgent, sessionFor, renameSession, validateName } from '../lib/agents.mjs';
import { setTerminalTitle, terminalHost } from '../lib/terminal.mjs';
import { sessionTitle } from '../lib/resume.mjs';
import { nativeCommand } from '../lib/rpc.mjs';

function labelTerminal(name, herdrPane) {
  const host = setTerminalTitle(name, process.env, herdrPane);
  return host === 'osc' ? 'Title escape sent; visible terminal label not verified.' : `Terminal renamed to: ${name} (${host})`;
}

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    agent: { type: 'string' }, session: { type: 'string' }, url: { type: 'string' },
    transcript: { type: 'string' }, offline: { type: 'boolean' },
    terminal: { type: 'boolean' }, 'dry-run': { type: 'boolean' }, help: { type: 'boolean', short: 'h' },
    'herdr-pane': { type: 'string' }, resume: { type: 'string' },
  } });
  if (values.help) {
    console.log('titlewave <name> [--agent claude|codex|opencode|pi|goose|gemini] [--session ID]\n  --terminal       Also label the current terminal; never sends keystrokes\n  --herdr-pane ID  Explicit verified Herdr pane; required with Codex shared daemon\n  --url URL        OpenCode loopback server\n  --offline        Confirm the Pi/Gemini session is closed\n  --transcript FILE  Gemini session JSON\n  --dry-run        Print the request without starting any process\n  titlewave terminal <name>  Label only the current terminal\n  titlewave --resume <codex-session-id>  Restore the title and launch Codex --no-daemon');
  } else if (values.resume !== undefined) {
    if (positionals.length || values.agent !== undefined && values.agent !== 'codex' || Object.keys(values).some(key => !['resume', 'agent', 'dry-run'].includes(key))) throw new Error('Usage: titlewave --resume <codex-session-id> [--dry-run]');
    const session = values.resume.toLowerCase();
    if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(session)) throw new Error('Resume requires an exact Codex session UUID.');
    const args = ['--no-daemon', 'resume', session];
    if (values['dry-run']) {
      let host, terminalWarning;
      try { host = terminalHost(); } catch (error) { terminalWarning = error.message; }
      console.log(JSON.stringify({ agent: 'codex', session, command: ['codex', ...args], host, terminalWarning }));
    }
    else {
      if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('Run the resume launcher directly in an interactive terminal.');
      console.log('Restoring session title...');
      try {
        terminalHost();
        const name = await sessionTitle({ agent: 'codex', session });
        if (name !== undefined) console.log(labelTerminal(name));
      } catch (error) { console.error(`titlewave: resume title not restored: ${error.message}`); }
      const child = spawn(nativeCommand('codex'), args, { stdio: 'inherit' });
      // The foreground terminal delivers Ctrl-C to both processes; only Codex handles it.
      const interrupt = () => {}, terminate = () => child.kill('SIGTERM');
      process.on('SIGINT', interrupt); process.on('SIGTERM', terminate);
      try {
        await new Promise((resolve, reject) => {
          child.once('error', reject);
          child.once('exit', (code, signal) => { process.exitCode = code ?? (signal ? 128 + (constants.signals[signal] || 0) : 1); resolve(); });
        });
      } finally { process.off('SIGINT', interrupt); process.off('SIGTERM', terminate); }
    }
  } else {
    if (values.agent === '' || values.session === '') throw new Error('Saved renames require explicit --agent and --session values that are not empty.');
    const terminalOnly = positionals[0] === 'terminal' && positionals.length === 2;
    if (positionals.length !== (terminalOnly ? 2 : 1)) throw new Error('Usage: titlewave <name> [options]; titlewave --help');
    const name = validateName(positionals[terminalOnly ? 1 : 0]);
    if (values['herdr-pane'] !== undefined) {
      terminalHost(process.env, values['herdr-pane']);
      if (!terminalOnly && !values.terminal) throw new Error('--herdr-pane requires terminal <name> or --terminal.');
    }
    const agent = terminalOnly ? undefined : values.agent || detectAgent();
    const session = values.session || sessionFor(agent);
    const request = { ...values, agent, session, name };
    if (values['dry-run']) console.log(JSON.stringify({ ...request, host: terminalOnly || values.terminal ? terminalHost(process.env, values['herdr-pane']) : undefined }));
    else if (terminalOnly) console.log(labelTerminal(name, values['herdr-pane']));
    else {
      await renameSession(request);
      console.log(`Session renamed to: ${name} (${agent})`);
      if (values.terminal) {
        try { console.log(labelTerminal(name, values['herdr-pane'])); }
        catch (error) { console.error(`Session saved; terminal labeling failed: ${error.message}`); }
      }
    }
  }
} catch (error) {
  console.error(`titlewave: ${error.message}`);
  process.exitCode = 1;
}
