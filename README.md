# Financial projection, with cross-device sync

This is your projection tool packaged to deploy on Netlify so the data follows you
between devices. Your figures are encrypted in the browser before they are sent, so
Netlify only ever stores unreadable ciphertext.

## What is in here

    sync-deploy/
      index.html                     the app (served as the site's home page)
      netlify.toml                   build config (publish root + functions dir)
      package.json                   declares the @netlify/blobs dependency
      netlify/functions/sync.mjs     the serverless read/write endpoint

## Deploy it (GitHub + Netlify, your usual flow)

1. Put the contents of this folder in a new GitHub repository (index.html at the repo
   root, alongside netlify.toml, package.json and the netlify folder).
2. In Netlify: Add new site -> Import an existing project -> pick the repo.
3. Leave the build command empty. Publish directory is `.` (already set in netlify.toml).
   Netlify will find the function automatically at netlify/functions/sync.mjs.
4. Deploy. Your app is now at https://YOUR-SITE.netlify.app and the sync endpoint at
   https://YOUR-SITE.netlify.app/.netlify/functions/sync

## Turn on the endpoint lock (recommended)

The function supports a shared secret so only you can read or write the store.

1. In Netlify: Site configuration -> Environment variables -> Add a variable.
2. Key `SYNC_TOKEN`, value = any long random string you choose. Save and redeploy.
3. You will enter this same string as the "Access token" in the app.

If you skip this, the endpoint is protected only by the obscurity of your site URL and
by the encryption. Setting SYNC_TOKEN is strongly recommended.

## Use it

On each device, open the site, click **Sync**, and enter:
- **Access token**: the SYNC_TOKEN value you set in Netlify.
- **Encryption passphrase**: a secret you pick. Use the SAME passphrase on every device.

First device you enable uploads its current data as the shared copy. Every other device,
once you enter the same token and passphrase, downloads that copy and then stays in step:
changes are pushed a second or two after you stop typing, and pulled when you open the app.

The status pill by the Sync button shows Synced / Saving / Offline / conflict at a glance.

## Moving your existing data across

Your current local tool and this deployed one use separate browser storage, so the
deployed site starts empty. To carry your real data over: in your current tool click
**Export**, then on the deployed site click **Import** and choose that file, then enable
Sync. That pushes it up as the shared copy for your other devices.

## If two devices both changed while apart

Whoever saves second is warned rather than silently overwriting. A banner offers
"Use server version" or "Keep this device's". For one person moving between devices in
turn this rarely appears; it is there as a guard, not a merge.

## Security notes, plainly

- The passphrase and token live only in each device's browser. The passphrase is never
  sent to the server; it is used to encrypt and decrypt locally.
- The server stores only AES-256-GCM ciphertext plus a timestamp. A leaked store, or
  Netlify itself, cannot read your figures without the passphrase.
- There is no password recovery. If you forget the passphrase, the synced copy cannot be
  decrypted. Keep an occasional JSON Export as a backup.
- Sync needs the deployed https site. Opened as a local file it runs offline only.

This is a planning model, not financial advice.
