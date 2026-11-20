import { parseArgs } from 'node:util';

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, strict: false, options: {
    agent: { type: 'string' }, session: { type: 'string' }, url: { type: 'string' },
    transcript: { type: 'string' }, help: { type: 'boolean', short: 'h' },
  } });
  const terminalOnly = positionals.length === 2 && positionals[0] === 'terminal';
  if (!values.help && !terminalOnly && (!values.agent || !values.session)) {
    throw new Error('Saved renames require explicit --agent and --session; inherited agent identities are not safe targets.');
  }
  await import('../../../bin/titlewave.mjs');
} catch (error) {
  console.error(`titlewave: ${error.message}`);
  process.exitCode = 1;
}
