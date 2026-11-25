import { restoreSessionTitle } from '../lib/resume.mjs';
import { gooseClient } from '../lib/client.mjs';
import { text } from 'node:stream/consumers';

try {
  const payload = JSON.parse(await text(process.stdin));
  const agent = process.argv[2] || (payload.event === 'SessionStart' ? 'goose' : 'gemini');
  const resumed = agent === 'goose' ? payload.event === 'SessionStart' : payload.hook_event_name === 'SessionStart' && payload.source === 'resume';
  if (resumed) {
    const client = agent === 'goose' ? gooseClient() : true;
    if (client === undefined) console.error('titlewave: terminal title not restored: local Goose CLI owner could not be verified.');
    if (client) await restoreSessionTitle(agent, payload);
  }
} catch { /* Invalid hook input must not block session startup. */ }
console.log('{}');
