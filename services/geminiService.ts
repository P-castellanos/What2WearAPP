/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";
import { ChatMessage, WardrobeItem } from "../types";

// --- API Key Check ---
// Crucial check to ensure the API key is available.
// This provides a much clearer error message to the developer
// if they haven't set up their environment variables correctly.
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error(
        "La API Key no se encontró. Asegúrate de crear un archivo `.env.local` en la raíz de tu proyecto y añadir tu clave como `API_KEY=TU_CLAVE_AQUI`. Después, reinicia tu servidor de desarrollo."
    );
}

const fileToPart = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
};

const dataUrlToParts = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    return { mimeType: mimeMatch[1], data: arr[1] };
}

const dataUrlToPart = (dataUrl: string) => {
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
}

const handleApiResponse = (response: GenerateContentResponse): string => {
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `La solicitud fue bloqueada. Razón: ${blockReason}. ${blockReasonMessage || ''}`;
        throw new Error(errorMessage);
    }

    // Find the first image part in any candidate
    for (const candidate of response.candidates ?? []) {
        const imagePart = candidate.content?.parts?.find(part => part.inlineData);
        if (imagePart?.inlineData) {
            const { mimeType, data } = imagePart.inlineData;
            return `data:${mimeType};base64,${data}`;
        }
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `La generación de la imagen se detuvo inesperadamente. Razón: ${finishReason}. Esto suele estar relacionado con la configuración de seguridad.`;
        throw new Error(errorMessage);
    }
    const textFeedback = response.text?.trim();
    const errorMessage = `El modelo de IA no devolvió una imagen. ` + (textFeedback ? `El modelo respondió con texto: "${textFeedback}"` : "Esto puede ocurrir debido a los filtros de seguridad o si la solicitud es demasiado compleja. Por favor, prueba con una imagen diferente.");
    throw new Error(errorMessage);
};

const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Retry Configuration ---
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isRetryableError = (error: any): boolean => {
    const errorStr = JSON.stringify(error);
    // Check for 503 (Service Unavailable) or UNAVAILABLE status
    return (
        error?.code === 503 ||
        error?.status === 'UNAVAILABLE' ||
        errorStr.includes('UNAVAILABLE') ||
        errorStr.includes('overloaded') ||
        errorStr.includes('429') ||
        errorStr.includes('TOO_MANY_REQUESTS')
    );
};

const withRetry = async <T>(
    fn: () => Promise<T>,
    operationName: string
): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`[${operationName}] Intento ${attempt}/${MAX_RETRIES}`);
            return await fn();
        } catch (error: any) {
            lastError = error;
            console.error(`[${operationName}] Error en intento ${attempt}:`, error);
            
            if (!isRetryableError(error)) {
                console.error(`[${operationName}] Error no recuperable, lanzando excepción`);
                throw error; // Non-retryable error, throw immediately
            }
            
            if (attempt < MAX_RETRIES) {
                // Exponential backoff with jitter
                const exponentialDelay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
                const jitter = Math.random() * 1000; // 0-1s random jitter
                const waitTime = exponentialDelay + jitter;
                
                console.warn(
                    `${operationName} falló (intento ${attempt}/${MAX_RETRIES}). ` +
                    `Reintentando en ${Math.round(waitTime)}ms... (El servicio de Gemini está sobrecargado)`
                );
                await delay(waitTime);
            }
        }
    }
    
    throw new Error(
        `${operationName} falló después de ${MAX_RETRIES} intentos. ` +
        `El servicio de Gemini está muy sobrecargado. Por favor, intenta de nuevo en unos minutos. ` +
        `Si el problema persiste, revisa tu cuota de API en Google Cloud Console.`
    );
};

export const generateModelImage = async (userImage: File): Promise<string> => {
    return withRetry(async () => {
        const userImagePart = await fileToPart(userImage);
        const prompt = "Eres un IA experta en fotografía de moda. Transforma a la persona en esta imagen en una foto de modelo de moda de cuerpo entero, adecuada para un sitio web de comercio electrónico. Si solo se proporciona una cara, genera un modelo de moda de cuerpo entero realista que preserve los rasgos faciales y la identidad de la persona, colocándola en una pose de modelo estándar y relajada. El fondo debe ser un fondo de estudio limpio y neutro (gris claro, #f0f0f0). La persona debe tener una expresión de modelo neutra y profesional. Preserva la identidad, los rasgos únicos y el tipo de cuerpo de la persona. La imagen final debe ser fotorrealista. Devuelve ÚNICAMENTE la imagen final.";
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [userImagePart, { text: prompt }] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        return handleApiResponse(response);
    }, "Generación de imagen de modelo");
};

export const getOutfitRecommendation = async (
    wardrobe: WardrobeItem[], 
    chatHistory: ChatMessage[]
): Promise<{ outfitDescription: string, reasoning: string }> => {
    return withRetry(async () => {
        let model = 'gemini-2.5-pro';

        const historyForPrompt = chatHistory
            .map(msg => {
                if (msg.role === 'user') return `Usuario: ${msg.content}`;
                if (typeof msg.content === 'string') return `Estilista: ${msg.content}`;
                return `Estilista: [Se ha generado una imagen de atuendo]`;
            }).join('\n');

        const systemInstruction = `Eres 'What2Wear', un experto estilista de moda IA. Tu objetivo es crear atuendos hermosos y detallados que se vean increíbles en la persona.

          Basado en la petición del usuario y el historial del chat, debes crear una descripción visual detallada de un atuendo completo.
          
          IMPORTANTE:
          - Crea descripciones visuales detalladas con colores específicos, estilos y combinaciones que funcionen bien juntas.
          - Describe el outfit completo: prendas de arriba, abajo, accesorios, zapatos, etc.
          - Usa lenguaje descriptivo y específico (ej: 'vaqueros ajustados azul indigo', no solo 'vaqueros').
          - Proporciona una explicación breve y amigable de por qué este outfit es perfecto.
          - Sé creativo/a y ten un gran sentido del estilo.
          - La descripción será usada por IA para generar una imagen visual del outfit, así que sé detallado/a.`;

        const contents = `Este es el historial de la conversación:\n${historyForPrompt}\n\nBasado en el último mensaje del usuario, por favor sugiere un nuevo atuendo con una descripción visual detallada.`;

        try {
            // Intenta con gemini-2.5-pro primero
            console.log("Intentando con gemini-2.5-pro");
            const response = await ai.models.generateContent({
                model,
                contents,
                config: {
                    systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            outfitDescription: {
                                type: Type.STRING,
                                description: "Una descripción visual detallada del outfit completo con colores, estilos y prendas específicas."
                            },
                            reasoning: {
                                type: Type.STRING,
                                description: "Una explicación corta, amigable y con estilo de por qué se eligió este atuendo."
                            }
                        },
                        required: ['outfitDescription', 'reasoning'],
                    },
                },
            });

            const jsonStr = response.text.trim();
            if (!jsonStr.startsWith('{') || !jsonStr.endsWith('}')) {
                throw new Error('La IA devolvió una respuesta JSON no válida.');
            }
            return JSON.parse(jsonStr);
        } catch (error: any) {
            // Si falla, intenta con gemini-2.0-flash (más disponible)
            if (isRetryableError(error)) {
                console.log("gemini-2.5-pro no disponible, intentando con gemini-2.0-flash");
                const response = await ai.models.generateContent({
                    model: 'gemini-2.0-flash',
                    contents,
                    config: {
                        systemInstruction,
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                outfitDescription: {
                                    type: Type.STRING,
                                    description: "Una descripción visual detallada del outfit completo con colores, estilos y prendas específicas."
                                },
                                reasoning: {
                                    type: Type.STRING,
                                    description: "Una explicación corta, amigable y con estilo de por qué se eligió este atuendo."
                                }
                            },
                            required: ['outfitDescription', 'reasoning'],
                        },
                    },
                });
                
                const jsonStr = response.text.trim();
                if (!jsonStr.startsWith('{') || !jsonStr.endsWith('}')) {
                    throw new Error('La IA devolvió una respuesta JSON no válida.');
                }
                return JSON.parse(jsonStr);
            }
            throw error;
        }
    }, "Recomendación de atuendo");
};


export const generateOutfitImage = async (modelImageUrl: string, outfitDescription: string): Promise<string> => {
    return withRetry(async () => {
        const modelImagePart = dataUrlToPart(modelImageUrl);

        const prompt = `Eres un experto en prueba de ropa virtual con IA. Se te proporciona una 'imagen de modelo' y una 'descripción detallada de un outfit'.

Tu tarea: Crea una nueva imagen fotorrealista donde la persona de la 'imagen de modelo' lleva EXACTAMENTE el outfit descrito.

DESCRIPCIÓN DEL OUTFIT A CREAR:
${outfitDescription}

**Reglas Críticas:**
1. **Reemplazo Completo:** Reemplaza COMPLETAMENTE la ropa actual de la persona con el outfit descrito.
2. **Fidelidad a la Descripción:** Sigue la descripción al pie de la letra - colores, estilos, prendas específicas.
3. **Preservar Identidad:** La cara, el pelo, la forma del cuerpo, la pose y el fondo DEBEN permanecer sin cambios.
4. **Capas Lógicas:** Coloca las prendas en capas realisticamente (chaqueta sobre camisa, camisa sobre pantalones, etc).
5. **Detalles Realistas:** Añade pliegues, sombras e iluminación naturales que combinen con la iluminación original.
6. **Resultado:** Devuelve ÚNICAMENTE la imagen final completa. No inclujas texto ni anotaciones.`;

        try {
            // Intenta primero con gemini-2.5-flash-image
            console.log("Intentando con gemini-2.5-flash-image");
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [modelImagePart, { text: prompt }] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });
            return handleApiResponse(response);
        } catch (error: any) {
            // Si falla, intenta con gemini-2.0-flash (más estable)
            if (isRetryableError(error)) {
                console.log("gemini-2.5-flash-image no disponible, intentando con gemini-2.0-flash");
                const response = await ai.models.generateContent({
                    model: 'gemini-2.0-flash',
                    contents: { parts: [modelImagePart, { text: prompt }] },
                    config: {
                        responseModalities: [Modality.IMAGE],
                    },
                });
                return handleApiResponse(response);
            }
            throw error;
        }
    }, "Generación de imagen de atuendo");
};