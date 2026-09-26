/* ============ Deployment settings ============
   Edit this one file to point the app at your own proxy.

   PROXY_URL is the address of the Cloudflare Worker in worker/worker.js.
   It is only a URL — the API key lives on the worker as an encrypted secret and
   never reaches the browser, so this file is safe to commit publicly.

   Leave it empty and the app behaves as before: each person supplies their own
   key under More -> AI settings.
============================================================ */

export const PROXY_URL = 'https://fityar-api.prouzmand.workers.dev';        // e.g. 'https://fityar-api.YOURNAME.workers.dev'

/** Which model the proxy should ask for. */
export const PROXY_MODEL = 'gemini-2.5-flash';
