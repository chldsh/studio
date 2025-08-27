'use server';

/**
 * @fileOverview An AI agent that suggests an optimized budget based on past spending data.
 *
 * - suggestOptimizedBudget - A function that handles the budget optimization process.
 * - SuggestOptimizedBudgetInput - The input type for the suggestOptimizedBudget function.
 * - SuggestOptimizedBudgetOutput - The return type for the suggestOptimizedBudget function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestOptimizedBudgetInputSchema = z.object({
  pastSpendingData: z
    .string()
    .describe(
      'A JSON string containing an array of spending records. Each record should have a category and amount field.'
    ),
  advancedBudgetingRules: z
    .string()
    .describe(
      'A JSON string containing advanced budgeting rules, such as percentage-based allocations or savings goals.'
    ),
});
export type SuggestOptimizedBudgetInput = z.infer<
  typeof SuggestOptimizedBudgetInputSchema
>;

const SuggestOptimizedBudgetOutputSchema = z.object({
  optimizedBudgets: z
    .string()
    .describe(
      'A JSON string containing an array of optimized budget suggestions for each category. Each suggestion should have a category and suggestedBudget field.'
    ),
  summary: z
    .string()
    .describe('A summary of the changes, insights, and important tips.'),
});
export type SuggestOptimizedBudgetOutput = z.infer<
  typeof SuggestOptimizedBudgetOutputSchema
>;

export async function suggestOptimizedBudget(
  input: SuggestOptimizedBudgetInput
): Promise<SuggestOptimizedBudgetOutput> {
  return suggestOptimizedBudgetFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestOptimizedBudgetPrompt',
  input: {schema: SuggestOptimizedBudgetInputSchema},
  output: {schema: SuggestOptimizedBudgetOutputSchema},
  prompt: `You are an AI-powered financial advisor. Analyze the user's past spending data and provide optimized budget suggestions for each category based on advanced budgeting rules.

Past Spending Data: {{{pastSpendingData}}}
Advanced Budgeting Rules: {{{advancedBudgetingRules}}}

Provide the optimized budget suggestions as a JSON string in the format: [{\"category\": \"category_name\", \"suggestedBudget\": \"suggested_amount\"}, ...]. Also, provide a comprehensive summary of the changes, insights, and important tips to help the user improve their financial planning and savings.

Make sure the JSON is parseable and contains no errors.`,
});

const suggestOptimizedBudgetFlow = ai.defineFlow(
  {
    name: 'suggestOptimizedBudgetFlow',
    inputSchema: SuggestOptimizedBudgetInputSchema,
    outputSchema: SuggestOptimizedBudgetOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
