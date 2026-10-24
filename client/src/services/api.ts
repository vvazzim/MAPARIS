/**
 * Utilitaire d'appel API sécurisé pour éviter le crash "Unexpected end of JSON input"
 * quand le serveur retourne une réponse vide ou du HTML/texte d'erreur.
 */
export interface SafeFetchResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(input, init);
    const text = await res.text();

    // 1. Gestion du cas de réponse vide
    if (!text || !text.trim()) {
      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          data: null,
          error: `Erreur HTTP ${res.status} ${res.statusText || ''} (réponse vide du serveur)`.trim(),
        };
      }
      return { ok: true, status: res.status, data: null };
    }

    // 2. Essai de parsing JSON
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      // Le contenu n'est pas du JSON (ex: page d'erreur HTML 502/504 ou texte brut)
      const snippet = text.slice(0, 150).replace(/<[^>]*>/g, '').trim();
      return {
        ok: false,
        status: res.status,
        data: null,
        error: snippet || `Réponse non-JSON reçue (HTTP ${res.status})`,
      };
    }

    // 3. Statut HTTP en erreur (4xx, 5xx)
    if (!res.ok) {
      const errMsg =
        parsed?.error ||
        parsed?.message ||
        (Array.isArray(parsed?.errors) ? parsed.errors.map((e: any) => e.message).join(', ') : null) ||
        `Erreur HTTP ${res.status}`;
      return {
        ok: false,
        status: res.status,
        data: parsed,
        error: errMsg,
      };
    }

    return { ok: true, status: res.status, data: parsed };
  } catch (networkErr: any) {
    // 4. Erreur réseau pure (CORS, serveur éteint, DNS)
    return {
      ok: false,
      status: 0,
      data: null,
      error: networkErr?.message || 'Erreur réseau : impossible de joindre le serveur.',
    };
  }
}
