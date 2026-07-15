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
// coincide con floor(longitud_eclíptica / 30). Nombres con acento para el
// texto; la clave interna (sin acento) coincide con ZODIAC_SIGNS de la app.
const ZODIAC = [
  { key: 'aries', label: 'Aries' },
  { key: 'tauro', label: 'Tauro' },
  { key: 'geminis', label: 'Géminis' },
  { key: 'cancer', label: 'Cáncer' },
  { key: 'leo', label: 'Leo' },
  { key: 'virgo', label: 'Virgo' },
  { key: 'libra', label: 'Libra' },
  { key: 'escorpio', label: 'Escorpio' },
  { key: 'sagitario', label: 'Sagitario' },
  { key: 'capricornio', label: 'Capricornio' },
  { key: 'acuario', label: 'Acuario' },
  { key: 'piscis', label: 'Piscis' },
];

// --- Argumentos ---
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const DAYS = parseInt(getArg('days', '30'), 10);
const START = getArg('start', new Date().toISOString().slice(0, 10));

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Falta ANTHROPIC_API_KEY. Expórtala antes de ejecutar.');
  process.exit(1);
}

const client = new Anthropic();

// ---------------------------------------------------------------------------
// Astronomía real
// ---------------------------------------------------------------------------

function signFromLongitude(lon) {
  const normalized = ((lon % 360) + 360) % 360;
  return ZODIAC[Math.floor(normalized / 30)].label;
}

/** Fase lunar en español a partir del ángulo (0=nueva, 180=llena). */
function moonPhaseName(angle) {
  const a = ((angle % 360) + 360) % 360;
  if (a < 22.5 || a >= 337.5) return 'luna nueva';
  if (a < 67.5) return 'luna creciente';
  if (a < 112.5) return 'cuarto creciente';
  if (a < 157.5) return 'luna gibosa creciente';
  if (a < 202.5) return 'luna llena';
  if (a < 247.5) return 'luna gibosa menguante';
  if (a < 292.5) return 'cuarto menguante';
  return 'luna menguante';
}

function planetSign(body, date) {
  const ecl = Astronomy.Ecliptic(Astronomy.GeoVector(body, date, true));
  return signFromLongitude(ecl.elon);
}

/** Estado real del cielo para una fecha (se computa una vez por día). */
function skyState(dateISO) {
  // Mediodía UTC: representa el día completo razonablemente bien.
  const date = new Date(`${dateISO}T12:00:00Z`);
  const sunSign = signFromLongitude(Astronomy.SunPosition(date).elon);
  const moonSign = signFromLongitude(Astronomy.EclipticGeoMoon(date).lon);
  const phase = moonPhaseName(Astronomy.MoonPhase(date));
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
function skySummary(sky) {
  return [
    `Sol en ${sky.sunSign}`,
    `Luna en ${sky.moonSign} (${sky.moonPhase}, ${sky.moonIllumination}% iluminada)`,
    `Mercurio en ${sky.mercurySign}`,
    `Venus en ${sky.venusSign}`,
    `Marte en ${sky.marsSign}`,
  ].join('; ');
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const schema = {
  type: 'object',
  properties: {
    shortAstrologyText: { type: 'string' },
    dailyPhrase: { type: 'string' },
    extendedText: { type: 'string' },
  },
  required: ['shortAstrologyText', 'dailyPhrase', 'extendedText'],
  additionalProperties: false,
};

const SYSTEM = [
  'Eres columnista de horóscopos de Lumma: escribes la lectura diaria como',
  'se leía antes en el periódico — directa, cercana, en segunda persona,',
  'dirigiéndote al signo por su nombre (p. ej. "Aries, hoy...").',
  'Tono: cálido pero firme y concreto, con una pizca de misterio — nunca',
  'grandilocuente, nunca vago ni new age, nunca frío o técnico.',
  'Se te dará la POSICIÓN REAL de los astros para una fecha concreta.',
  'Fundamenta la lectura en esa posición real: menciona con naturalidad la',
  'fase o el signo de la Luna, la estación solar o algún planeta cuando',
  'aporte sentido — sin sonar a manual técnico. La lectura debe variar',
  'según el cielo del día, no ser genérica.',
  'Como en el horóscopo clásico de periódico, da una guía concreta para',
  'el día (una oportunidad, una advertencia, un terreno — amor, trabajo,',
  'ánimo, salud, dinero) en vez de quedarte en un estado de ánimo abstracto.',
  'shortAstrologyText: 1–2 frases con la lectura y guía concreta del día',
  'para el signo, ancladas en el cielo real.',
  'dailyPhrase: una frase breve y memorable para llevar el día, al estilo',
  'de la máxima final de una columna de horóscopo — no un aforismo vago.',
  'extendedText: 2–3 frases de lectura ampliada, con más detalle práctico.',
].join(' ');

function dateAt(startISO, offset) {
  const d = new Date(`${startISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

// --- Construir las solicitudes del lote (12 signos × N días) ---
const requests = [];
for (let day = 0; day < DAYS; day++) {
  const date = dateAt(START, day);
  const sky = skyState(date); // una vez por día, compartido por los 12 signos
  const summary = skySummary(sky);

  for (const { key, label } of ZODIAC) {
    const moonInSign = sky.moonSign === label;
    const userMsg = [
      `Fecha: ${date}.`,
      `Persona de signo ${label}.`,
      `Posición real del cielo hoy: ${summary}.`,
      moonInSign ? 'Nota: hoy la Luna transita por SU PROPIO signo.' : '',
      `Escribe su lectura del día para Lumma, fundamentada en ese cielo real.`,
    ]
      .filter(Boolean)
      .join(' ');

    requests.push({
      custom_id: `${key}__${date}`,
      params: {
        model: MODEL,
        max_tokens: 640,
        system: SYSTEM,
        output_config: { format: { type: 'json_schema', schema } },
        messages: [{ role: 'user', content: userMsg }],
      },
    });
  }
}

console.log(
  `Enviando lote: ${requests.length} solicitudes (${DAYS} días × ${ZODIAC.length} signos), fundamentadas en astronomía real...`
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
  const [zodiacSign, date] = req.custom_id.split('__');
  content.push({
    contentId: `${zodiacSign}-${date}`,
    date,
    zodiacSign,
    shortAstrologyText: parsed.shortAstrologyText,
    dailyPhrase: parsed.dailyPhrase,
    extendedText: parsed.extendedText || null,
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
