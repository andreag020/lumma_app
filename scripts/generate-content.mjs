#!/usr/bin/env node
/**
 * Generación de contenido diario de Lumma (astrología + frase) POR LOTES.
 *
 * ⚠️ Este script se ejecuta OFFLINE, en tu máquina — NUNCA dentro de la app.
 * Tu clave de Claude vive solo aquí (variable de entorno), jamás en el APK.
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
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const MODEL = 'claude-haiku-4-5';
const SIGNS = [
  'aries', 'tauro', 'geminis', 'cancer', 'leo', 'virgo',
  'libra', 'escorpio', 'sagitario', 'capricornio', 'acuario', 'piscis',
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

// Esquema de salida estructurada: garantiza un JSON parseable por request.
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
  'Eres la voz de Lumma, una marca de astrología serena y calma nocturna.',
  'Escribe en español, en segunda persona, con ternura y claridad.',
  'Tono: suave, contemplativo, nunca dramático ni esotérico recargado.',
  'shortAstrologyText: 1–2 frases de guía astrológica calmada para el signo.',
  'dailyPhrase: una frase breve, poética, para llevar el día.',
  'extendedText: 2–3 frases de lectura ampliada, opcional pero cálida.',
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
  for (const sign of SIGNS) {
    requests.push({
      custom_id: `${sign}__${date}`,
      params: {
        model: MODEL,
        max_tokens: 512,
        system: SYSTEM,
        output_config: { format: { type: 'json_schema', schema } },
        messages: [
          {
            role: 'user',
            content: `Genera el contenido de Lumma para el signo "${sign}" y la fecha ${date}.`,
          },
        ],
      },
    });
  }
}

console.log(`Enviando lote: ${requests.length} solicitudes (${DAYS} días × ${SIGNS.length} signos)...`);
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

const outPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'content', 'content.json');
await writeFile(outPath, JSON.stringify(content, null, 2) + '\n', 'utf8');
console.log(`Escritas ${content.length} entradas en ${outPath}`);
