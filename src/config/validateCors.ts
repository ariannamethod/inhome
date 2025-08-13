import {z} from 'zod';

const domainSchema = z.string().regex(/^(https?:\/\/)?([\w.-]+)(:\d+)?$/);

export function validateCors(raw?: string): string[] {
  const list = raw ? raw.split(',').map((o) => o.trim()).filter(Boolean) : [];
  const parsed = z.array(domainSchema).safeParse(list);
  if(!parsed.success) {
    throw new Error(
      'Invalid CORS whitelist: ' +
        parsed.error.issues.map((i) => i.message).join(', ')
    );
  }
  return parsed.data;
}

export default validateCors;
