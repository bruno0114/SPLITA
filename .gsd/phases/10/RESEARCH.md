# Research: Phase 10 - Deep History & Real-time FX

## 1. DolarAPI Integration
### Endpoints
- **Base URL**: `https://dolarapi.com/v1/dolares`
- **Blue**: `https://dolarapi.com/v1/dolares/blue`
- **Cripto**: `https://dolarapi.com/v1/dolares/cripto`
- **Format**: JSON with `compra`, `venta`, `fechaActualizacion`.

### Polling Strategy
- Use a `CurrencyContext` to fetch rates on app load and store in `localStorage`.
- Provide a `refresh()` method to trigger manual updates from the UI.

## 2. Global Currency Swapper
### State Management
- `CurrencyContext` will provide:
    - `currency`: 'ARS' | 'USD'
    - `exchangeRate`: number (cached Blue/Cripto rate)
    - `lastUpdated`: string
    - `setCurrency(type)`
    - `setRateSource('blue' | 'cripto')`

### Animations (Framer Motion)
- Use `AnimatePresence` for price transitions.
- A "CurrencyWrapper" component will wrap every price to handle the flip/shimmer animation consistently.

## 3. Gemini 1.5 Document Support
- **Images**: Supported (current implementation).
- **PDF**: Supported natively by Gemini 1.5.
- **XLS/DOCX**: Supported by Gemini 1.5 as document inputs.
- **UI Logic**: Identify file type by extension or MIME type and display `FileText` (PDF), `Table` (XLS), `FileCode` (DOCX), or thumbnail (Images).

## 4. Off-Topic AI Handling
- **Prompt Modification**: Update the JSON schema to include:
    ```json
    {
      "is_expense_related": boolean,
      "joke": string (Argentine tone if is_expense_related is false),
      "transactions": [...]
    }
    ```
- **Externalization**: Move the massive prompt string to `src/lib/ai-prompts.ts` to facilitate non-code iterations.
