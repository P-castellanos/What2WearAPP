/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Helper to convert image URL to a File object using the Fetch API.
export const urlToFile = async (url: string, filename: string): Promise<File> => {
    try {
        // For local assets (starting with '/'), we don't need any special fetch options.
        // For external URLs, the browser's default 'cors' mode will apply.
        const response = await fetch(url);

        if (!response.ok) {
            // Provide a more specific error for local files (likely 404).
            if (url.startsWith('/')) {
                 throw new Error(`Error ${response.status}: No se pudo encontrar el archivo en la ruta local '${url}'. Asegúrate de que la imagen exista en la carpeta 'public${url}'.`);
            }
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText} from ${url}`);
        }

        const blob = await response.blob();
        const mimeType = blob.type;
        // Add a fallback extension if the filename doesn't have one
        const finalFilename = filename.includes('.') ? filename : `${filename}.${mimeType.split('/')[1] || 'png'}`;
        return new File([blob], finalFilename, { type: mimeType });
    } catch (error) {
        console.error(`[Fetch Error] Failed to load and convert item from URL: ${url}.`, error);

        // Customize the final error message based on the URL type.
        if (url.startsWith('/')) {
            throw new Error(`No se pudo cargar la imagen desde la ruta local '${url}'. Revisa la consola para ver el error. Es probable que el archivo no exista en la carpeta 'public/wardrobe-assets/'.`);
        } else {
            throw new Error(`No se pudo cargar la imagen desde la URL externa. Suele ser un problema de CORS. Revisa la consola del desarrollador para más detalles.`);
        }
    }
};
