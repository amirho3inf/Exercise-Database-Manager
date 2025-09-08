import { GoogleGenAI, Type } from "@google/genai";

export const translateToPersian = async (text: string, apiKey: string): Promise<string> => {
    if (!text || !text.trim()) {
        return "";
    }
    
    if (!apiKey) {
        throw new Error("Gemini API key is not configured.");
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: text,
            config: {
                systemInstruction: 'You are an expert translator. Translate the given English text to Persian. Only return the translated text, without any additional explanations or introductory phrases.',
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to translate text. Please check the API key and network status.");
    }
};


export interface AllTranslations {
    name: string;
    description: string;
    instructions: string;
}

export const translateAllToPersian = async (
    name_en: string, 
    description: string, 
    instructions: string[],
    apiKey: string
): Promise<AllTranslations> => {
    if (!apiKey) {
        throw new Error("Gemini API key is not configured.");
    }

    const instructionsString = instructions.join('\n');
    const prompt = `Translate the following English texts to Persian:
    
    Name: "${name_en}"
    Description: "${description}"
    Instructions:
    ${instructionsString}
    `;

    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: {
                            type: Type.STRING,
                            description: "The Persian translation of the exercise name.",
                        },
                        description: {
                            type: Type.STRING,
                            description: "The Persian translation of the exercise description.",
                        },
                        instructions: {
                            type: Type.STRING,
                            description: "The Persian translation of the exercise instructions, with each step separated by a newline character.",
                        },
                    },
                    required: ["name", "description", "instructions"],
                },
                 systemInstruction: "You are an expert translator. The user will provide English text for an exercise. Translate the name, description, and instructions to Persian. Respond with a JSON object matching the provided schema. Ensure the translated instructions have each step separated by a newline character."
            }
        });

        // The response text should be a JSON string, but trim it just in case.
        const jsonStr = response.text.trim();
        const translatedData: AllTranslations = JSON.parse(jsonStr);
        return translatedData;
        
    } catch (error) {
        console.error("Error calling Gemini API for bulk translation:", error);
        throw new Error("Failed to translate all fields. Please check the API key and network status.");
    }
};