import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const adminEmail = process.env.STORAGE_TEST_ADMIN_EMAIL;
const adminPassword = process.env.STORAGE_TEST_ADMIN_PASSWORD;
const nonAdminEmail = process.env.STORAGE_TEST_NON_ADMIN_EMAIL;
const nonAdminPassword = process.env.STORAGE_TEST_NON_ADMIN_PASSWORD;

let localUrl;
if (supabaseUrl) {
  const parsedUrl = new URL(supabaseUrl);
  localUrl = ['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname);
  if (!localUrl) {
    throw new Error('Storage security tests refuse non-loopback SUPABASE_URL values. Use only a local Supabase stack.');
  }
}

const skipReason = !supabaseUrl
  ? 'Set SUPABASE_URL to a local Supabase URL to run Storage integration tests.'
  : !publishableKey || !adminEmail || !adminPassword || !nonAdminEmail || !nonAdminPassword
    ? 'Set the local publishable key and pre-provisioned local admin/non-admin test credentials.'
    : false;

const authOptions = {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
};

test('Storage public/private policies enforce access through the local API', { skip: skipReason }, async () => {
  assert.equal(localUrl, true, 'Storage tests must target loopback only');

  const anonymous = createClient(supabaseUrl, publishableKey, authOptions);
  const admin = createClient(supabaseUrl, publishableKey, authOptions);
  const nonAdmin = createClient(supabaseUrl, publishableKey, authOptions);
  const { error: adminLoginError } = await admin.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
  assert.equal(adminLoginError, null, 'local admin test account must sign in');
  const { error: nonAdminLoginError } = await nonAdmin.auth.signInWithPassword({ email: nonAdminEmail, password: nonAdminPassword });
  assert.equal(nonAdminLoginError, null, 'local non-admin test account must sign in');

  const token = randomUUID();
  const publicPath = `stage5-security/${token}.png`;
  const privatePath = `stage5-security/${token}.pdf`;
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j8r8AAAAASUVORK5CYII=', 'base64');
  const pdf = Buffer.from('%PDF-1.4\n% local RLS fixture\n%%EOF\n');

  try {
    const publicUpload = await admin.storage.from('portfolio-public').upload(publicPath, png, { contentType: 'image/png' });
    assert.equal(publicUpload.error, null, 'active admin can upload public media');
    const privateUpload = await admin.storage.from('admin-private').upload(privatePath, pdf, { contentType: 'application/pdf' });
    assert.equal(privateUpload.error, null, 'active admin can upload private media');

    const upsert = await admin.storage.from('portfolio-public').upload(publicPath, png, {
      contentType: 'image/png',
      upsert: true,
    });
    assert.equal(upsert.error, null, 'admin upsert is allowed by SELECT, INSERT, and UPDATE policies');

    const publicDownload = await anonymous.storage.from('portfolio-public').download(publicPath);
    assert.equal(publicDownload.error, null, 'public bucket objects can be downloaded without authentication');
    const privateAsAnonymous = await anonymous.storage.from('admin-private').download(privatePath);
    assert.ok(privateAsAnonymous.error, 'anonymous users cannot download private objects');
    const privateAsNonAdmin = await nonAdmin.storage.from('admin-private').download(privatePath);
    assert.ok(privateAsNonAdmin.error, 'authenticated non-admin users cannot download private objects');
    const privateAsAdmin = await admin.storage.from('admin-private').download(privatePath);
    assert.equal(privateAsAdmin.error, null, 'active admin can download private objects');

    const publicListAsAdmin = await admin.storage.from('portfolio-public').list('stage5-security');
    assert.equal(publicListAsAdmin.error, null, 'active admin can list portfolio media');
    assert.ok(publicListAsAdmin.data?.some((item) => item.name === `${token}.png`));
    const publicListAsAnonymous = await anonymous.storage.from('portfolio-public').list('stage5-security');
    assert.ok(publicListAsAnonymous.error || publicListAsAnonymous.data?.length === 0,
      'anonymous users cannot enumerate portfolio media');

    const nonAdminPublicUpload = await nonAdmin.storage.from('portfolio-public').upload(`stage5-security/${token}-denied.png`, png, {
      contentType: 'image/png',
    });
    assert.ok(nonAdminPublicUpload.error, 'authenticated non-admin cannot upload public media');
    const nonAdminPrivateUpload = await nonAdmin.storage.from('admin-private').upload(`stage5-security/${token}-denied.pdf`, pdf, {
      contentType: 'application/pdf',
    });
    assert.ok(nonAdminPrivateUpload.error, 'authenticated non-admin cannot upload private media');
    const nonAdminPublicDelete = await nonAdmin.storage.from('portfolio-public').remove([publicPath]);
    assert.ok(nonAdminPublicDelete.error, 'authenticated non-admin cannot delete public media');
    const nonAdminPrivateDelete = await nonAdmin.storage.from('admin-private').remove([privatePath]);
    assert.ok(nonAdminPrivateDelete.error, 'authenticated non-admin cannot delete private media');
    const anonymousUpload = await anonymous.storage.from('portfolio-public').upload(`stage5-security/${token}-anon.png`, png, {
      contentType: 'image/png',
    });
    assert.ok(anonymousUpload.error, 'anonymous users cannot upload media');
    const anonymousDelete = await anonymous.storage.from('admin-private').remove([privatePath]);
    assert.ok(anonymousDelete.error, 'anonymous users cannot delete media');

    const publicDelete = await admin.storage.from('portfolio-public').remove([publicPath]);
    assert.equal(publicDelete.error, null, 'active admin can delete public media');
    const privateDelete = await admin.storage.from('admin-private').remove([privatePath]);
    assert.equal(privateDelete.error, null, 'active admin can delete private media');
  } finally {
    await admin.storage.from('portfolio-public').remove([publicPath]);
    await admin.storage.from('admin-private').remove([privatePath]);
    await admin.auth.signOut();
    await nonAdmin.auth.signOut();
  }
});
