'use server';

/**
 * @fileOverview An AI agent that explains a bill from an image, provides a spoken explanation, and offers budgeting advice.
 * 
 * - explainBill - A function that handles the bill explanation process.
 * - ExplainBillInput - The input type for the explainBill function.
 * - ExplainBillOutput - The return type for the explainBill function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/googleai';

const ExplainBillInputSchema = z.object({
    billDataUri: z
        .string()
        .describe(
            "A photo of a bill, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
});
export type ExplainBillInput = z.infer<typeof ExplainBillInputSchema>;

const ExplainBillOutputSchema = z.object({
    vendor: z.string().describe('The name of the vendor or store.'),
    totalAmount: z.number().describe('The total amount of the bill.'),
    category: z.string().describe('A suggested expense category for this bill (e.g., Groceries, Utilities, Dining).'),
    explanation: z.string().describe('A simple, spoken-word-style explanation of the bill for the user.'),
    suggestions: z.string().describe('Budgeting improvement suggestions related to this bill.'),
    audioDataUri: z.string().describe('The spoken explanation as a data URI in WAV format.'),
});
export type ExplainBillOutput = z.infer<typeof ExplainBillOutputSchema>;

export async function explainBill(input: ExplainBillInput): Promise<ExplainBillOutput> {
    return explainBillFlow(input);
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const billAnalysisPrompt = ai.definePrompt({
    name: 'billAnalysisPrompt',
    input: { schema: ExplainBillInputSchema },
    output: { 
        schema: z.object({
            vendor: ExplainBillOutputSchema.shape.vendor,
            totalAmount: ExplainBillOutputSchema.shape.totalAmount,
            category: ExplainBillOutputSchema.shape.category,
            explanation: ExplainBillOutputSchema.shape.explanation,
            suggestions: ExplainBillOutputSchema.shape.suggestions,
        })
    },
    prompt: `You are a helpful financial assistant. Analyze the following bill image.
    
    Image: {{media url=billDataUri}}
    
    Your task is to:
    1.  Identify the vendor/store name.
    2.  Extract the final total amount.
    3.  Suggest a relevant expense category (e.g., Groceries, Utilities, Dining, Shopping).
    4.  Create a simple, friendly, one or two-sentence explanation of the bill as if you were speaking to the user.
    5.  Provide a few concise bullet points with suggestions on how the user could save money or budget better regarding this type of expense.
    
    Provide the output in the requested JSON format.`,
});


const explainBillFlow = ai.defineFlow(
    {
        name: 'explainBillFlow',
        inputSchema: ExplainBillInputSchema,
        outputSchema: ExplainBillOutputSchema,
    },
    async (input) => {
        const { output: analysis } = await billAnalysisPrompt(input);
        if (!analysis) {
            throw new Error('Could not analyze the bill.');
        }

        const { media: audioMedia } = await ai.generate({
            model: googleAI.model('gemini-2.5-flash-preview-tts'),
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Algenib' },
                    },
                },
            },
            prompt: analysis.explanation,
        });

        if (!audioMedia) {
            throw new Error('Text-to-speech generation failed.');
        }

        const audioBuffer = Buffer.from(
            audioMedia.url.substring(audioMedia.url.indexOf(',') + 1),
            'base64'
        );
        
        const wavBase64 = await toWav(audioBuffer);

        return {
            ...analysis,
            audioDataUri: 'data:audio/wav;base64,' + wavBase64,
        };
    }
);
