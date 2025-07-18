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
  } = {},
  expectJson: boolean = false
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
      const providerMessage = parsedError?.error?.message || errorText || response.statusText;
      console.error('OpenRouter API Error:', response.status, providerMessage);
      
      let userFriendlyMessage = `Erreur OpenRouter (${response.status}): ${providerMessage}`;
      
      if (response.status === 429) {
          const limitMatch = providerMessage.match(/limited to (.*)\. Please retry shortly/i);
          if (limitMatch && limitMatch[1]) {
              userFriendlyMessage = `Limite de requêtes OpenRouter atteinte. Modèle très demandé, limité à ${limitMatch[1]}. Veuillez attendre ou choisir un autre modèle.`;
          } else {
              userFriendlyMessage = `Limite de requêtes OpenRouter atteinte. Veuillez attendre un moment avant de réessayer.`;
          }
      } else if (response.status === 503) {
          userFriendlyMessage = `Le modèle demandé sur OpenRouter est temporairement indisponible. Veuillez réessayer plus tard ou choisir un autre modèle.`;
      }
      throw new Error(userFriendlyMessage);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Réponse vide du modèle');
    }

    if (expectJson) {
        try {
            let jsonString = content;
            const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (codeBlockMatch) {
                jsonString = codeBlockMatch[1];
            } else {
                const firstBrace = jsonString.indexOf('{');
                const firstBracket = jsonString.indexOf('[');
                let start = -1;
                if (firstBrace === -1) start = firstBracket;
                else if (firstBracket === -1) start = firstBrace;
                else start = Math.min(firstBrace, firstBracket);
                if (start !== -1) {
                    const lastBrace = jsonString.lastIndexOf('}');
                    const lastBracket = jsonString.lastIndexOf(']');
                    const end = Math.max(lastBrace, lastBracket);
                    if (end > start) {
                        jsonString = jsonString.substring(start, end + 1);
                    }
                }
            }
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