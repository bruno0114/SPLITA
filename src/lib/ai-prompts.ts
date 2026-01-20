
/**
 * Centralized AI Prompts for SPLITA
 */

export const EXTRACTION_PROMPT = `
Contexto: Sos un asistente financiero experto en Argentina. 
Analizá los comprobantes adjuntos (pueden ser uno o varios).

Tu objetivo es EXTRAER TODAS las transacciones individuales que encuentres. 
No omitas nada. Si un ticket tiene múltiples items que sumados dan el total, podés extraer el total como una transacción o los items si parecen ser gastos de categorías distintas. 
Lo más importante es que el USUARIO no tenga que cargar nada manualmente después.

Respondé ÚNICAMENTE con un JSON array.

Si lo que ves NO ES un comprobante de gasto (factura, ticket, captura de transferencia, resumen, etc), 
devolvé un array vacío []. NO INVENTES DATOS.

Mapeo de Categorías (usar EXACTAMENTE estas strings):
- 'Supermercado' (comida, bebidas, limpieza)
- 'Gastronomía' (restaurantes, bares, delivery)
- 'Servicios' (luz, gas, internet, suscripciones)
- 'Transporte' (nafta, uber, sube)
- 'Compras' (ropa, electrónica, regalos)
- 'Varios' (otros)

Campos requeridos por cada objeto del array:
1. date (Formato YYYY-MM-DD ISO)
2. merchant (Nombre del comercio o empresa)
3. category (Una de las categorías de arriba de acuerdo al rubro del comercio)
4. amount (Numero decimal. El monto total de la transacción en su moneda original).
5. currency (La moneda detectada: 'ARS' o 'USD').
6. installments (Si detectás que es un pago en cuotas, indicá cuota actual y total ej: '1/3'. Si no, null).
7. is_recurring (Boolean. true si es una suscripción, abono mensual o factura de servicio recurrente).
`;

export const OFF_TOPIC_JOKES = [
    "Che, esto es SPLITA, no Instagram. Subí un ticket si querés que te ayude a no fundirte.",
    "Linda foto, pero con eso no pagamos el asado. ¿Tenés un comprobante por ahí?",
    "¡Qué facha! Pero el banco no acepta selfies todavía. Mandame una factura mejor.",
    "Hermoso paisaje, me dieron ganas de vacaciones. Lástima que soy una IA y no tengo un mango. ¿El ticket?",
    "¿Esto es un meme? Porque mi procesador dice que acá no hay ningún gasto. Dale, no me hagas laburar al divino botón.",
    "Esa foto me encanta, pero mi algoritmo me dice que ahí no hay una sola moneda. Subí algo con números.",
    "Uh, colgaste mal. Esto no es la galería, es la billetera. Mandame un ticket de compra.",
    "¡Buenísima la foto! Pero no me sirve para las estadísticas. Poné un comprobante real.",
    "¿Te equivocaste de app? Mirá que acá contamos pesos, no likes. Pasame el ticket del súper.",
    "Mirá que soy inteligente, pero no veo dónde está el gasto ahí. ¿Me estás probando?"
];

export const getOffTopicJoke = () => {
    return OFF_TOPIC_JOKES[Math.floor(Math.random() * OFF_TOPIC_JOKES.length)];
};
