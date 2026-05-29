/**
 * `crypto.randomUUID()` is only defined in a *secure context* (HTTPS or
 * localhost). When the app is served over plain HTTP via an IP or hostname it
 * is undefined, which breaks the chat — both this Web UI and the agentscope
 * SDK call it. Polyfill it with `crypto.getRandomValues`, which IS available in
 * non-secure contexts, producing a spec-compliant v4 UUID.
 *
 * Imported first in main.tsx so it runs before any UUID is generated.
 */
type UUID = `${string}-${string}-${string}-${string}-${string}`;

if (typeof crypto !== 'undefined' && typeof crypto.randomUUID !== 'function') {
	(crypto as { randomUUID: () => UUID }).randomUUID = (): UUID => {
		const bytes = crypto.getRandomValues(new Uint8Array(16));
		bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
		bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
		const h = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
		return `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`;
	};
}
