const crypto = require('crypto');

let cachedAuth;

/**
 * @return {{authorizationToken, apiUrl, downloadUrl}}
 */
async function getAuth() {
  if (!cachedAuth) {
    cachedAuth = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.B2_KEYID}:${process.env.B2_KEY}`).toString('base64')}`
      }
    }).then(r => r.json());

    if (!cachedAuth.authorizationToken) {
      throw Object.assign(new Error(), cachedAuth);
    }
  }
  return cachedAuth;
}

let cachedUploadAuth;

/**
 * @return {{authorizationToken, uploadUrl}}
 */
async function getUploadAuth() {
  if (!cachedUploadAuth) {
    const auth = await getAuth();

    cachedUploadAuth = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_upload_url`, {
      headers: {
        Authorization: auth.authorizationToken,
      },
      body: JSON.stringify({ buckedId: auth.allowed.bucketId })
    }).then(r => r.json());

    if (cachedUploadAuth.code === 'expired_auth_token') {
      cachedAuth = null;
      console.log('Expired auth token, retry');
      return getUploadUrl();
    }

    if (!cachedUploadAuth.authorizationToken) {
      throw Object.assign(new Error(), cachedUploadAuth);
    }
  }
  return cachedUploadAuth;
}


exports.upload = async function upload({ body, name, type }) {
  const auth = await getUploadAuth();

  const result = await fetch(auth.uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': auth.authorizationToken,
      'X-Bz-File-Name': encodeURIComponent(name),
      'Content-Type': type || 'b2/auto',
      'X-Bz-Content-Sha1': crypto.createHash('sha1').update(body).digest('hex'),
    },
    body
  }).then(r => r.json());
 
  if (result.code === 'expired_auth_token') {
    cachedUploadAuth = null;
    console.log('Expired upload auth token, retry');
    return upload({ body, name, type });
  }

  if (result.fileName) { // OK
    return `${auth.downloadUrl}/file/${auth.allowed.bucketId}/${result.fileName}`;
  }

  throw Object.assign(new Error(), result);
}
