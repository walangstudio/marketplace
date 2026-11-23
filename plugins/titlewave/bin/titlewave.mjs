#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { detectAgent, sessionFor, renameSession, validateName } from '../lib/agents.mjs';
import { setTerminalTitle, terminalHost } from '../lib/terminal.mjs';

function labelTerminal(name, herdrPane) {
  const host = setTerminalTitle(name, process.env, herdrPane);
  return host === 'osc' ? 'Title escape sent; visible terminal label not verified.' : `Terminal renamed to: ${name} (${host})`;
}

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    agent: { type: 'string' }, session: { type: 'string' }, url: { type: 'string' },
    transcript: { type: 'string' }, offline: { type: 'boolean' },
    terminal: { type: 'boolean' }, 'dry-run': { type: 'boolean' }, help: { type: 'boolean', short: 'h' },
    'herdr-pane': { type: 'string' },
  } });
  if (values.help) {
    console.log('titlewave <name> [--agent claude|codex|opencode|pi|goose|gemini] [--session ID]\n  --terminal       Also label the current terminal; never sends keystrokes\n  --herdr-pane ID  Explicit verified Herdr pane; required with Codex shared daemon\n  --url URL        OpenCode loopback server\n  --offline        Confirm the Pi/Gemini session is closed\n  --transcript FILE  Gemini session JSON\n  --dry-run        Print the request without starting any process\n  titlewave terminal <name>  Label only the current terminal');
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
