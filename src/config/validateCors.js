const { z } = require('zod');

const domainSchema = z.string().regex(/^(https?:\/\/)?([\w.-]+)(:\d+)?$/);

function validateCors(raw) {
  const list = raw ? raw.split(',').map((o) => o.trim()).filter(Boolean) : [];
  const parsed = z.array(domainSchema).safeParse(list);
  if (!parsed.success) {
    throw new Error(
      'Invalid CORS whitelist: ' +
        parsed.error.issues.map((i) => i.message).join(', ')
    );
  }
  return parsed.data;
}

module.exports = { validateCors, default: validateCors };
