/**
 * Web Push implementation using Web Crypto API (Cloudflare Workers compatible)
 *
 * Implements:
 *  - VAPID authentication (RFC 8292)
 *  - Push message encryption (RFC 8291 / aes128gcm)
 */

// ─── Types ─────────────────────────────────────────────────────

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string; // base64url
    auth: string; // base64url
  };
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

interface VapidKeys {
  publicKey: string; // base64url
  privateKey: string; // base64url
  email: string; // mailto:...
}

// ─── Base64url helpers ─────────────────────────────────────────

function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(pad);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// ─── VAPID JWT ─────────────────────────────────────────────────

async function createVapidJwt(
  audience: string,
  vapid: VapidKeys
): Promise<{ authorization: string; cryptoKey: string }> {
  // Import VAPID private key as ECDSA P-256
  const privateKeyBytes = base64urlToUint8Array(vapid.privateKey);
  const publicKeyBytes = base64urlToUint8Array(vapid.publicKey);

  // Build JWK from raw private key (32 bytes) and public key (65 bytes, uncompressed)
  const x = uint8ArrayToBase64url(publicKeyBytes.slice(1, 33));
  const y = uint8ArrayToBase64url(publicKeyBytes.slice(33, 65));
  const d = uint8ArrayToBase64url(privateKeyBytes);

  const jwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x,
    y,
    d,
  };

  const signingKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  // JWT header
  const header = { typ: "JWT", alg: "ES256" };

  // JWT payload — valid for 12 hours
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: vapid.email,
  };

  const headerB64 = uint8ArrayToBase64url(
    new TextEncoder().encode(JSON.stringify(header))
  );
  const payloadB64 = uint8ArrayToBase64url(
    new TextEncoder().encode(JSON.stringify(payload))
  );

  const unsignedToken = `${headerB64}.${payloadB64}`;
  const unsignedBytes = new TextEncoder().encode(unsignedToken);

  // Sign with ECDSA
  const signatureBuffer = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    signingKey,
    unsignedBytes
  );

  // Convert DER-encoded signature to raw r||s format (64 bytes)
  const signatureB64 = uint8ArrayToBase64url(
    new Uint8Array(signatureBuffer)
  );

  const jwt = `${unsignedToken}.${signatureB64}`;

  return {
    authorization: `vapid t=${jwt},k=${vapid.publicKey}`,
    cryptoKey: `p256ecdsa=${vapid.publicKey}`,
  };
}

// ─── HKDF ──────────────────────────────────────────────────────

async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    ikm.buffer as ArrayBuffer,
    "HKDF",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt.buffer as ArrayBuffer,
      info: info.buffer as ArrayBuffer,
    },
    key,
    length * 8
  );
  return new Uint8Array(bits);
}

// ─── Payload Encryption (RFC 8291 aes128gcm) ──────────────────

async function encryptPayload(
  subscription: PushSubscription,
  payload: string
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const plaintext = new TextEncoder().encode(payload);

  // Subscriber's keys
  const p256dhBytes = base64urlToUint8Array(subscription.keys.p256dh);
  const authBytes = base64urlToUint8Array(subscription.keys.auth);

  // Import subscriber's public key
  const subscriberKey = await crypto.subtle.importKey(
    "raw",
    p256dhBytes.buffer as ArrayBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Generate local ECDH key pair
  const localKeyPair = (await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  )) as CryptoKeyPair;

  // Export local public key (uncompressed, 65 bytes)
  const localPublicKeyExport = await crypto.subtle.exportKey("raw", localKeyPair.publicKey);
  const localPublicKeyRaw = new Uint8Array(localPublicKeyExport as ArrayBuffer);

  // Derive shared secret via ECDH
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: "ECDH", $public: subscriberKey } as unknown as SubtleCryptoDeriveKeyAlgorithm,
    localKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);

  // Generate random salt (16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Build info strings per RFC 8291
  const encoder = new TextEncoder();

  // IKM info: "WebPush: info\0" + subscriber_key + local_key
  const ikmInfo = concatUint8Arrays(
    encoder.encode("WebPush: info\0"),
    p256dhBytes,
    localPublicKeyRaw
  );

  // Derive IKM from auth secret and shared secret
  const ikm = await hkdf(authBytes, sharedSecret, ikmInfo, 32);

  // Derive content encryption key (CEK)
  const cekInfo = encoder.encode("Content-Encoding: aes128gcm\0");
  const cek = await hkdf(salt, ikm, cekInfo, 16);

  // Derive nonce
  const nonceInfo = encoder.encode("Content-Encoding: nonce\0");
  const nonce = await hkdf(salt, ikm, nonceInfo, 12);

  // Pad plaintext: add delimiter byte 0x02 (RFC 8188)
  const paddedPlaintext = concatUint8Arrays(plaintext, new Uint8Array([2]));

  // Encrypt with AES-128-GCM
  const encryptionKey = await crypto.subtle.importKey(
    "raw",
    cek,
    "AES-GCM",
    false,
    ["encrypt"]
  );

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce },
      encryptionKey,
      paddedPlaintext
    )
  );

  // Build aes128gcm content encoding header:
  // salt (16) + rs (4, big-endian uint32) + idlen (1) + keyid (65) + ciphertext
  const rs = 4096;
  const rsBytes = new Uint8Array(4);
  new DataView(rsBytes.buffer).setUint32(0, rs);

  const encrypted = concatUint8Arrays(
    salt,
    rsBytes,
    new Uint8Array([localPublicKeyRaw.length]),
    localPublicKeyRaw,
    ciphertext
  );

  return { encrypted, salt, localPublicKey: localPublicKeyRaw };
}

// ─── Send Push Notification ────────────────────────────────────

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload,
  vapid: VapidKeys
): Promise<{ success: boolean; status: number; message: string }> {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;

  // Create VAPID authorization
  const { authorization, cryptoKey } = await createVapidJwt(audience, vapid);

  // Encrypt the payload
  const payloadString = JSON.stringify(payload);
  const { encrypted } = await encryptPayload(subscription, payloadString);

  // Send the push message
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Crypto-Key": cryptoKey,
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      TTL: "86400",
      Urgency: "normal",
    },
    body: encrypted,
  });

  return {
    success: response.status >= 200 && response.status < 300,
    status: response.status,
    message: response.statusText,
  };
}
