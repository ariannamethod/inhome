import {describe, it, expect} from 'vitest';
import {readBlob} from '../../git-serve.js';

describe('git-serve security', () => {
  it('rejects repository path traversal', async() => {
    await new Promise<void>((resolve) => {
      readBlob('../evil', 'main', 'file', (err) => {
        expect(err).toBeTruthy();
        expect(err.message).toContain('invalid repository');
        resolve();
      });
    });
  });

  it('rejects malicious revision', async() => {
    await new Promise<void>((resolve) => {
      readBlob('repository', 'rev;rm -rf /', 'file', (err) => {
        expect(err).toBeTruthy();
        expect(err.message).toContain('invalid revision');
        resolve();
      });
    });
  });

  it('rejects path traversal in file', async() => {
    await new Promise<void>((resolve) => {
      readBlob('repository', 'main', '../etc/passwd', (err) => {
        expect(err).toBeTruthy();
        expect(err.message).toContain('invalid file');
        resolve();
      });
    });
  });
});
