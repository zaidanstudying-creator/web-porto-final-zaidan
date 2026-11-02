import assert from 'node:assert/strict';
import test from 'node:test';
import { externalHttpsUrlSchema, projectLinksSchema, socialLinkSchema } from '../src/lib/validations/urls.js';

test('accepts HTTPS project and social URLs', () => {
  assert.equal(externalHttpsUrlSchema.safeParse('https://example.com/project').success, true);
  assert.equal(projectLinksSchema.safeParse({ github_url: 'https://github.com/ihsan/project', demo_url: '' }).success, true);
  assert.equal(socialLinkSchema.safeParse({ platform: 'GitHub', url: 'https://github.com/ihsan' }).success, true);
});

test('rejects unsafe URL protocols and embedded credentials', () => {
  for (const value of [
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'http://example.com/insecure',
    'https://user:password@example.com/private',
  ]) {
    assert.equal(externalHttpsUrlSchema.safeParse(value).success, false, `should reject ${value.split(':')[0]} URL`);
  }

  assert.equal(projectLinksSchema.safeParse({ github_url: 'javascript:alert(1)', demo_url: '' }).success, false);
  assert.equal(socialLinkSchema.safeParse({ platform: 'Portfolio', url: 'data:text/plain,unsafe' }).success, false);
});
