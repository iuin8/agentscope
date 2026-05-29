/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
	/** Default agent service URL, injected at build time (see Dockerfile / docker-compose). */
	readonly VITE_SERVER_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
