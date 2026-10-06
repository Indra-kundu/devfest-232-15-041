/**
 * Compute SHA-256 hash of an ArrayBuffer in browser using Web Crypto API.
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<string>} Hex-encoded SHA-256 digest
 */
export async function computeSHA256(arrayBuffer) {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API is not supported in this browser.');
  }
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
