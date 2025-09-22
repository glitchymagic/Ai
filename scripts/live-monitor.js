const { spawn, execSync } = require('child_process');
const fs = require('fs');

const LOG_PATH = '/tmp/bot-out.log';
const MONITOR_LOG = '/tmp/bot-monitor.log';

function log(msg) {
  const line = `${new Date().toISOString()} ${msg}`;
  console.log(line);
  try { fs.appendFileSync(MONITOR_LOG, line + '\n'); } catch (_) {}
}

function hasViolation(reply) {
  const violations = [];
  if (!reply || typeof reply !== 'string') return { violations: ['empty'], bad: true };

  // Tags
  if (/[#@]/.test(reply)) violations.push('tags');

  // Action-claims
  if (/(following\s+now|i\s*f(ol)?low(ed)?|i\s*liked|i\s*entered|good\s+luck(\s+to\s+everyone)?)/i.test(reply)) {
    violations.push('action-claim');
  }

  // Too many '!' (allow up to 2 for emphasis, or if not at end of sentence)
  const exclamations = (reply.match(/!/g) || []).length;
  const trailingExclamations = reply.match(/!+$/);
  if (exclamations > 2 || (trailingExclamations && trailingExclamations[0].length > 2)) {
    violations.push('too_many_exclamations');
  }

  // Too long
  if (reply.length > 150) violations.push('too_long');

  // Generic openers
  if (/^\s*(great|nice|awesome|amazing)\s+post\b/i.test(reply) ||
      /^\s*thanks\s+for\s+sharing\b/i.test(reply) ||
      /^\s*cool\s+(post|stuff)\b/i.test(reply)) {
    violations.push('generic_opener');
  }

  return { violations, bad: violations.length > 0 };
}

function start() {
  if (!fs.existsSync(LOG_PATH)) {
    log(`MONITOR: ${LOG_PATH} not found; waiting for bot to start...`);
  }

  const tail = spawn('tail', ['-n', '0', '-F', LOG_PATH]);

  tail.stdout.on('data', (buf) => {
    const lines = buf.toString().split(/\r?\n/);
    for (const line of lines) {
      if (!line) continue;

      // 1) Abort on partial typing warnings
      if (/Text not fully typed|Only \d+ chars typed|Dialog was likely interrupted/i.test(line)) {
        log(`MONITOR: Typing anomaly detected → stopping bot`);
        try { execSync('pkill -f "pokemon-bot-contextual.js"'); } catch (_) {}
        process.exit(0);
      }

      // 2) Inspect reply content before send
      const m = line.match(/Response ready to type:\s+"([^"]*)"/);
      if (m) {
        const reply = m[1] || '';
        const { violations, bad } = hasViolation(reply);
        if (bad) {
          log(`MONITOR: Bad reply detected (${violations.join(', ')}): "${reply}"`);
          try { execSync('pkill -f "pokemon-bot-contextual.js"'); } catch (_) {}
          process.exit(0);
        } else {
          log(`MONITOR: Reply ok (${reply.length} chars)`);
        }
      }
    }
  });

  tail.stderr.on('data', (buf) => {
    log(`MONITOR STDERR: ${buf.toString().trim()}`);
  });

  tail.on('exit', (code) => {
    log(`MONITOR: tail exited with code ${code}`);
  });

  log('MONITOR: live monitor started');
}

start();
