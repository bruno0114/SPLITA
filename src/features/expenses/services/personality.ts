
const ARGENTINE_PHRASES = [
    "Che, ¿viste lo que aumentó la comida? ¡Una locura!",
    "Uh, este mes te fuiste al pasto con los gustitos.",
    "Esa compra en el super... ¿compraste oro o qué pasó?",
    "Mirá que bien venís ahorrando, ¡seguí así fiera!",
    "Ahhh bueno, otro delivery... después no nos quejemos del balance.",
    "Escaneando... aguantá un cachito que estoy haciendo cuentas.",
    "¿Ropa nueva? Te queda bárbaro, pero el bolsillo llora.",
    "¡Qué grande! Gastaste menos que el mes pasado, sos un crack.",
    "Analizando... esto me parece que va para la categoría 'Varios' porque no tiene nombre.",
    "Ojo con los gastos hormiga, ¡se te va la plata como agua!",
    "Dólar arriba, ahorro abajo... la historia de siempre.",
    "Si seguís así, a fin de mes comemos arroz con agua.",
    "¡Ésa! Encontré un descuento, sos un ninja de las compras.",
];

export const getArgentineInsight = (context?: { category?: string, diff?: number }) => {
    if (context?.diff && context.diff < 0) {
        return "¡Qué bien! Este mes venís gastando menos que el anterior. ¡Sos un campeón!";
    }

    if (context?.category === 'Gastronomía') {
        return "Otro delivery... ¿No querés probar cocinando algo?";
    }

    return ARGENTINE_PHRASES[Math.floor(Math.random() * ARGENTINE_PHRASES.length)];
};
