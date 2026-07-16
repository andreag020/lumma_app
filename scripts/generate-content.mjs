#!/usr/bin/env node
/**
 * Generación de contenido diario de Lumma (astrología + frase) POR LOTES,
 * fundamentada en la POSICIÓN REAL DE LOS ASTROS para cada fecha.
 *
 * ⚠️ Este script se ejecuta OFFLINE, en tu máquina — NUNCA dentro de la app.
 * Tu clave de Claude vive solo aquí (variable de entorno), jamás en el APK.
 *
 * Cómo funciona:
 *   1. Para cada fecha, `astronomy-engine` (cálculo astronómico puro, sin
 *      dependencias nativas) computa el cielo real: signo que transita el
 *      Sol, signo y fase de la Luna, y los signos de Mercurio, Venus y
 *      Marte (zodiaco tropical, longitud eclíptica).
 *   2. Esos datos reales se le pasan a Claude, que escribe la lectura del
 *      día para cada signo FUNDAMENTADA en esa posición — no inventada.
 *   3. Genera el lote en TODOS los idiomas de LANGUAGES (hoy: es, en) —
 *      la distribución multi-país de Lumma empieza por España y mercados
 *      de habla inglesa. Cada entrada de content.json queda marcada con
 *      su `language`.
 *
 * Uso:
 *   export ANTHROPIC_API_KEY=sk-ant-...
 *   node scripts/generate-content.mjs [--days 30] [--start 2026-07-13]
 *
 * Resultado: sobrescribe assets/content/content.json con un array de
 * objetos DailyContent que la app empaqueta y carga localmente.
 *
 * Modelo: Claude Haiku 4.5 (la opción más barata de Claude para tareas
 * ligeras). La Batch API reduce el costo ~50 % frente a llamadas normales.
 */
import Anthropic from '@anthropic-ai/sdk';
import * as Astronomy from 'astronomy-engine';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

try {
  process.loadEnvFile(new URL('../.env', import.meta.url));
} catch {
  // Sin .env — se asume que ANTHROPIC_API_KEY ya está en el entorno.
}

const MODEL = 'claude-haiku-4-5';

// Signos en el ORDEN del zodiaco tropical (0°=inicio de Aries). El índice
// coincide con floor(longitud_eclíptica / 30). La clave interna (sin
// acento) coincide con ZODIAC_SIGNS de la app; `es`/`en` son el nombre
// visible en cada idioma de distribución.
const ZODIAC = [
  { key: 'aries', es: 'Aries', en: 'Aries' },
  { key: 'tauro', es: 'Tauro', en: 'Taurus' },
  { key: 'geminis', es: 'Géminis', en: 'Gemini' },
  { key: 'cancer', es: 'Cáncer', en: 'Cancer' },
  { key: 'leo', es: 'Leo', en: 'Leo' },
  { key: 'virgo', es: 'Virgo', en: 'Virgo' },
  { key: 'libra', es: 'Libra', en: 'Libra' },
  { key: 'escorpio', es: 'Escorpio', en: 'Scorpio' },
  { key: 'sagitario', es: 'Sagitario', en: 'Sagittarius' },
  { key: 'capricornio', es: 'Capricornio', en: 'Capricorn' },
  { key: 'acuario', es: 'Acuario', en: 'Aquarius' },
  { key: 'piscis', es: 'Piscis', en: 'Pisces' },
];

// Idiomas de distribución (ver app.json / Play Console: España + países de
// habla inglesa). Cada uno genera su propio lote de lecturas.
const LANGUAGES = ['es', 'en'];

const MOON_PHASE_LABELS = {
  es: {
    new: 'luna nueva',
    waxingCrescent: 'luna creciente',
    firstQuarter: 'cuarto creciente',
    waxingGibbous: 'luna gibosa creciente',
    full: 'luna llena',
    waningGibbous: 'luna gibosa menguante',
    lastQuarter: 'cuarto menguante',
    waningCrescent: 'luna menguante',
  },
  en: {
    new: 'new moon',
    waxingCrescent: 'waxing crescent moon',
    firstQuarter: 'first quarter moon',
    waxingGibbous: 'waxing gibbous moon',
    full: 'full moon',
    waningGibbous: 'waning gibbous moon',
    lastQuarter: 'last quarter moon',
    waningCrescent: 'waning crescent moon',
  },
};

// --- Argumentos ---
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
// const DAYS = parseInt(getArg('days', '30'), 10);
// const START = getArg('start', new Date().toISOString().slice(0, 10));

// --- MODO PRUEBA (activo ahora): 1 día × 12 signos, para no gastar de más
// mientras se prueba el script. Para volver al modo normal, comenta este
// bloque y descomenta las dos líneas de arriba.
const DAYS = 1;
const START = getArg('start', new Date().toISOString().slice(0, 10));

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Falta ANTHROPIC_API_KEY. Expórtala antes de ejecutar.');
  process.exit(1);
}

const client = new Anthropic();

// ---------------------------------------------------------------------------
// Astronomía real
// ---------------------------------------------------------------------------

/** Devuelve la entrada de ZODIAC (no el nombre) para no atarse a un idioma. */
function signFromLongitude(lon) {
  const normalized = ((lon % 360) + 360) % 360;
  return ZODIAC[Math.floor(normalized / 30)];
}

/** Clave de fase lunar (ver MOON_PHASE_LABELS) a partir del ángulo
 * (0=nueva, 180=llena). */
function moonPhaseKey(angle) {
  const a = ((angle % 360) + 360) % 360;
  if (a < 22.5 || a >= 337.5) return 'new';
  if (a < 67.5) return 'waxingCrescent';
  if (a < 112.5) return 'firstQuarter';
  if (a < 157.5) return 'waxingGibbous';
  if (a < 202.5) return 'full';
  if (a < 247.5) return 'waningGibbous';
  if (a < 292.5) return 'lastQuarter';
  return 'waningCrescent';
}

function planetSign(body, date) {
  const ecl = Astronomy.Ecliptic(Astronomy.GeoVector(body, date, true));
  return signFromLongitude(ecl.elon);
}

/** Estado real del cielo para una fecha (se computa una vez por día,
 * independiente de idioma — los signos/fase se resuelven a texto en
 * `skySummary`). */
function skyState(dateISO) {
  // Mediodía UTC: representa el día completo razonablemente bien.
  const date = new Date(`${dateISO}T12:00:00Z`);
  const sunSign = signFromLongitude(Astronomy.SunPosition(date).elon);
  const moonSign = signFromLongitude(Astronomy.EclipticGeoMoon(date).lon);
  const phase = moonPhaseKey(Astronomy.MoonPhase(date));
  const illum = Math.round(
    Astronomy.Illumination('Moon', date).phase_fraction * 100
  );
  return {
    sunSign,
    moonSign,
    moonPhase: phase,
    moonIllumination: illum,
    mercurySign: planetSign('Mercury', date),
    venusSign: planetSign('Venus', date),
    marsSign: planetSign('Mars', date),
  };
}

/** Resumen en lenguaje natural del cielo, para darle contexto a Claude. */
function skySummary(sky, lang) {
  const moonPhaseLabel = MOON_PHASE_LABELS[lang][sky.moonPhase];
  if (lang === 'en') {
    return [
      `Sun in ${sky.sunSign.en}`,
      `Moon in ${sky.moonSign.en} (${moonPhaseLabel}, ${sky.moonIllumination}% illuminated)`,
      `Mercury in ${sky.mercurySign.en}`,
      `Venus in ${sky.venusSign.en}`,
      `Mars in ${sky.marsSign.en}`,
    ].join('; ');
  }
  return [
    `Sol en ${sky.sunSign.es}`,
    `Luna en ${sky.moonSign.es} (${moonPhaseLabel}, ${sky.moonIllumination}% iluminada)`,
    `Mercurio en ${sky.mercurySign.es}`,
    `Venus en ${sky.venusSign.es}`,
    `Marte en ${sky.marsSign.es}`,
  ].join('; ');
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

// extendedText queda deshabilitado por ahora: se generaba pero ninguna
// pantalla lo mostraba (ver DailyContent), así que era gasto de tokens sin
// uso. Se deja comentado, no borrado, por si se conecta a futuro (p. ej.
// un "Leer más" en Home).
const schema = {
  type: 'object',
  properties: {
    shortAstrologyText: { type: 'string' },
    dailyPhrase: { type: 'string' },
    // extendedText: { type: 'string' },
  },
  required: ['shortAstrologyText', 'dailyPhrase'],
  additionalProperties: false,
};

const SYSTEM = {
  es: [
    'Eres columnista de horóscopos de Lumma: escribes la lectura diaria como',
    'se leía antes en el periódico — directa, cercana, en segunda persona,',
    'dirigiéndote al signo por su nombre (p. ej. "Aries, hoy...").',
    'Tono: cálido pero firme y concreto, con una pizca de misterio — nunca',
    'grandilocuente, nunca vago ni new age, nunca frío o técnico.',
    'Se te dará la POSICIÓN REAL de los astros para una fecha concreta.',
    'Fundamenta la lectura en esa posición real — la fase lunar, la estación',
    'solar, el movimiento de los planetas — pero SIN NOMBRAR NUNCA el signo',
    'zodiacal de esos tránsitos (ni "Luna en Leo", ni "Venus en Virgo", etc.):',
    'describe el EFECTO o el TEMA que trae esa posición (p. ej. "una energía',
    'lunar renovadora y expresiva" en vez de "la Luna en Leo"), para que la',
    'lectura se sienta enfocada en SU signo, no en un resumen astronómico de',
    'otros signos. La única excepción es cuando el tránsito ocurre en el',
    'propio signo de la persona — ahí sí puedes decir que es "su" signo.',
    'La lectura debe variar según el cielo del día, no ser genérica.',
    'Como en el horóscopo clásico de periódico, da una guía concreta para',
    'el día (una oportunidad, una advertencia, un terreno — amor, trabajo,',
    'ánimo, salud, dinero) en vez de quedarte en un estado de ánimo abstracto.',
    'shortAstrologyText: 1–2 frases con la lectura y guía concreta del día',
    'para el signo, ancladas en el cielo real.',
    'dailyPhrase: una frase breve y memorable para llevar el día, al estilo',
    'de la máxima final de una columna de horóscopo — no un aforismo vago.',
    // 'extendedText: 2–3 frases de lectura ampliada, con más detalle práctico.',
  ].join(' '),
  en: [
    "You are Lumma's horoscope columnist: you write the daily reading the",
    'way old newspaper horoscope columns read — direct, warm, in second',
    'person, addressing the sign by name (e.g. "Aries, today...").',
    'Tone: warm but firm and concrete, with a pinch of mystery — never',
    'grandiose, never vague or new-age, never cold or technical.',
    "You'll be given the REAL POSITION of the sky for a specific date.",
    'Ground the reading in that real position — the moon phase, the solar',
    'season, planetary movement — but NEVER NAME the zodiac sign of those',
    'transits (not "Moon in Leo", not "Venus in Virgo", etc.): describe the',
    'EFFECT or THEME that position brings (e.g. "a renewing, expressive',
    'lunar energy" instead of "the Moon in Leo"), so the reading feels',
    "focused on THEIR sign, not an astronomical summary of other signs.",
    'The only exception is when the transit occurs in the person\'s own',
    'sign — then you may say it is "their" sign.',
    'The reading should vary with the sky of the day, never generic.',
    'Like a classic newspaper horoscope, give concrete guidance for the',
    'day (an opportunity, a warning, a terrain — love, work, mood, health,',
    'money) instead of staying in an abstract mood.',
    'shortAstrologyText: 1–2 sentences with the reading and concrete',
    "guidance for the sign's day, grounded in the real sky.",
    'dailyPhrase: a short, memorable line to carry through the day, in the',
    'style of the closing maxim of a horoscope column — not a vague aphorism.',
    // 'extendedText: 2–3 sentences of extended reading, with more practical detail.',
  ].join(' '),
};

function dateAt(startISO, offset) {
  const d = new Date(`${startISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

function buildUserMessage(lang, date, sign, sky) {
  const summary = skySummary(sky, lang);
  const moonInSign = sky.moonSign.key === sign.key;
  if (lang === 'en') {
    return [
      `Date: ${date}.`,
      `Person with sign ${sign.en}.`,
      `Real sky position today: ${summary}.`,
      moonInSign ? 'Note: today the Moon transits their OWN sign.' : '',
      "Write their reading of the day for Lumma, grounded in that real sky.",
    ]
      .filter(Boolean)
      .join(' ');
  }
  return [
    `Fecha: ${date}.`,
    `Persona de signo ${sign.es}.`,
    `Posición real del cielo hoy: ${summary}.`,
    moonInSign ? 'Nota: hoy la Luna transita por SU PROPIO signo.' : '',
    `Escribe su lectura del día para Lumma, fundamentada en ese cielo real.`,
  ]
    .filter(Boolean)
    .join(' ');
}

// --- Construir las solicitudes del lote (idiomas × 12 signos × N días) ---
const requests = [];
for (let day = 0; day < DAYS; day++) {
  const date = dateAt(START, day);
  const sky = skyState(date); // una vez por día, compartido por idiomas y signos

  for (const lang of LANGUAGES) {
    for (const sign of ZODIAC) {
      requests.push({
        custom_id: `${sign.key}__${date}__${lang}`,
        params: {
          model: MODEL,
          max_tokens: 640,
          system: SYSTEM[lang],
          output_config: { format: { type: 'json_schema', schema } },
          messages: [{ role: 'user', content: buildUserMessage(lang, date, sign, sky) }],
        },
      });
    }
  }
}

console.log(
  `Enviando lote: ${requests.length} solicitudes (${DAYS} días × ${ZODIAC.length} signos × ${LANGUAGES.length} idiomas), fundamentadas en astronomía real...`
);
const batch = await client.messages.batches.create({ requests });
console.log(`Lote creado: ${batch.id}. Esperando a que termine...`);

// --- Sondear hasta que el lote termine ---
let status = batch.processing_status;
while (status !== 'ended') {
  await new Promise((r) => setTimeout(r, 15_000));
  const current = await client.messages.batches.retrieve(batch.id);
  status = current.processing_status;
  process.stdout.write(`  estado: ${status}\r`);
}
console.log('\nLote terminado. Recogiendo resultados...');

// --- Recoger resultados (llegan en cualquier orden: mapear por custom_id) ---
const byId = new Map();
for await (const result of await client.messages.batches.results(batch.id)) {
  if (result.result.type !== 'succeeded') {
    console.warn(`  ${result.custom_id}: ${result.result.type}`);
    continue;
  }
  const textBlock = result.result.message.content.find((b) => b.type === 'text');
  if (!textBlock) continue;
  try {
    byId.set(result.custom_id, JSON.parse(textBlock.text));
  } catch {
    console.warn(`  ${result.custom_id}: JSON inválido, se omite`);
  }
}

// --- Ensamblar el array DailyContent ---
const content = [];
for (const req of requests) {
  const parsed = byId.get(req.custom_id);
  if (!parsed) continue;
  const [zodiacSign, date, language] = req.custom_id.split('__');
  content.push({
    contentId: `${zodiacSign}-${date}-${language}`,
    date,
    zodiacSign,
    language,
    shortAstrologyText: parsed.shortAstrologyText,
    dailyPhrase: parsed.dailyPhrase,
    extendedText: null, // deshabilitado — ver nota junto al schema
  });
}

const outPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'assets',
  'content',
  'content.json'
);
await writeFile(outPath, JSON.stringify(content, null, 2) + '\n', 'utf8');
console.log(`Escritas ${content.length} entradas en ${outPath}`);
