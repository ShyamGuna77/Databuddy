import type { z } from 'zod';
import { AIResponseJsonSchema } from '../prompts/agent';

export interface ParsedAIResponse {
    success: boolean;
    data?: z.infer<typeof AIResponseJsonSchema>;
    error?: string;
    rawResponse?: string;
}

export function parseAIResponse(rawResponse: string): ParsedAIResponse {
    try {
        const cleanedResponse = rawResponse.trim()
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '');

        const parsedData = AIResponseJsonSchema.parse(JSON.parse(cleanedResponse));

        console.info('✅ [Response Parser] AI response parsed successfully', {
            responseType: parsedData.response_type,
            hasSQL: !!parsedData.sql,
            thinkingSteps: parsedData.thinking_steps?.length || 0
        });

        return {
            success: true,
            data: parsedData
        };
    } catch (parseError) {
        console.error('❌ [Response Parser] AI response parsing failed', {
            error: parseError instanceof Error ? parseError.message : 'Unknown error',
            rawResponseLength: rawResponse.length
        });

        return {
            success: false,
            error: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
            rawResponse
        };
    }
} 