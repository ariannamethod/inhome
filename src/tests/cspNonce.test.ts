import request from 'supertest';
import app from '../../server.js';

describe('CSP style nonce', () => {
  it('embeds nonce in header and inline style', async() => {
    const res = await request(app).get('/');
    const csp: string = res.headers['content-security-policy'];
    expect(csp).toMatch(/style-src[^;]*'nonce-[^']+'/);
    const nonce = csp.match(/style-src[^;]*'nonce-([^']+)'/)[1];
    expect(res.text).toContain(`nonce="${nonce}"`);
  });

  it('disallows inline styles without nonce', async() => {
    const res = await request(app).get('/');
    const csp: string = res.headers['content-security-policy'];
    expect(csp).not.toMatch(/'unsafe-inline'/);
  });
});
