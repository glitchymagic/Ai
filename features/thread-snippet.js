// features/thread-snippet.js
function buildThreadSnippet(threadContext) {
  if (!threadContext || !Array.isArray(threadContext.fullConversation)) return '';
  const msgs = threadContext.fullConversation.slice(-4, -1); // last 3 before current
  if (!msgs.length) return '';
  const parts = msgs.map(m => `@${m.username}: "${String(m.text||'').slice(0,60)}"`).join(' • ');
  const len = threadContext.threadLength || threadContext.fullConversation.length;
  return `Prev (${len-1} msgs): ${parts}.`;
}

module.exports = { buildThreadSnippet };