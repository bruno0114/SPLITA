# Research: AI Keys & Financial Advice

## Storage Options for API Keys

| Option | Pros | Cons |
|--------|------|------|
| **Supabase `profiles` field** | Easy to implement, RLS protected. | Key is sent to client on profile fetch. |
| **Supabase `vault`** | Extremely secure, hardware-level encryption. | Requires complex SQL to set up for individual users. |
| **Encrypted string in DB** | Good middle ground. | Needs client-side encryption key (chicken-egg problem). |

**Decision:** Storage in a new `user_settings` table (or `profiles` extension) with strict RLS (only owner can read). For maximum security, we should implement a Supabase Edge Function to proxy the Gemini calls so the key never leaves the server, but for v1, we will implement user-scoped retrieval from the `profiles` table to keep UX fast.

## AI Advice Prompting
We will pass:
1. Total Income (monthly)
2. Total Expenses (monthly)
3. Category breakdown
4. Savings rate
5. Target goals (if available)

**Prompt Template:**
"Actúa como un asesor financiero experto en Argentina. Analiza estos datos: {data}. Proporciona 3 consejos accionables y específicos para mejorar la salud financiera del usuario."

## Implementation Path
1. **Database:** Add dynamic key support.
2. **UI Settings:** Add "IA & API" section in Settings.
3. **Services:** Create `src/services/ai.ts` to handle Gemini calls.
4. **Integration:** Hook `useEconomicHealth` into the new AI service.
