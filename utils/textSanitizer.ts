// utils/textSanitizer.ts
/**
 * Utilitaires pour nettoyer et encoder correctement le texte.
 */

// Fonction pour nettoyer le texte des caractères problématiques
export const sanitizeTextForAPI = (text: string): string => {
  if (!text) return '';
  
  // Cette approche plus générique utilise les propriétés Unicode pour être plus robuste
  // à travers différentes langues, tout en étant inspirée par la logique de l'utilisateur.
  return text
    // Remplacer les guillemets et tirets non standard
    .replace(/[“”〝〞„‟]/g, '"')
    .replace(/[‘’‛‚]/g, "'")
    .replace(/[‐‑‒–—―]/g, '-')
    .replace(/[…‥]/g, '...')
    
    // Normaliser les espaces
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
    
    // Supprimer les caractères de contrôle sauf Tab, Newline, etc.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')

    // Remplacer les emojis par un placeholder générique
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '[emoji]')
    
    // Supprimer les symboles divers qui ne sont généralement pas du texte
    .replace(/[\p{Symbol}]/gu, '')

    // Nettoyer les espaces multiples qui pourraient résulter des remplacements
    .replace(/\s+/g, ' ')
    .trim();
};

const createSafeHeaders = (apiKey: string): HeadersInit => {
  const safeApiKey = apiKey.replace(/[^\x00-\x7F]/g, '');
  
  return {
    'Authorization': `Bearer ${safeApiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://writeweave.app',
    'X-Title': 'WriteWeave Novel Writing Assistant',
  };
};

const createSafePayload = (
  model: string,
  messages: Array<{role: string, content: string}>,
  options: {
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: string };
  } = {}
): string => {
  const cleanMessages = messages.map(msg => ({
    role: msg.role,
    content: sanitizeTextForAPI(msg.content)
  }));
  
  const payload: any = {
    model: sanitizeTextForAPI(model),
    messages: cleanMessages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 4000,
  };

  if (options.response_format) {
    payload.response_format = options.response_format;
  }
  
  return JSON.stringify(payload);
};

export const callOpenRouterSafe = async (
  apiKey: string,
  model: string,
  messages: Array<{role: string, content: string}>,
  options: {
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: 'json_object' };
  } = {}
): Promise<any> => {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: createSafeHeaders(apiKey),
      body: createSafePayload(model, messages, options)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError;
      try {
          parsedError = JSON.parse(errorText);
      } catch(e) { /* not a json error */ }
      const errorMessage = parsedError?.error?.message || errorText || response.statusText;
      console.error('OpenRouter API Error:', response.status, errorMessage);
      throw new Error(`Erreur OpenRouter (${response.status}): ${errorMessage}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Réponse vide du modèle');
    }

    if (options.response_format?.type === 'json_object') {
        try {
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            const jsonString = jsonMatch ? jsonMatch[1] : content;
            return JSON.parse(jsonString);
        } catch (e) {
            console.error("Impossible de parser le JSON d'OpenRouter:", content, e);
            throw new Error("OpenRouter a renvoyé un JSON malformé.");
        }
    }
    
    return content;
    
  } catch (error) {
    console.error('Erreur de connexion à OpenRouter:', error);
    throw error;
  }
};
