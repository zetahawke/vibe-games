import { checkLimit } from './_rateLimit';
import { normalizeSpeechText } from '../src/shared/speech';

type Req = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body: Record<string, unknown>;
};
type Res = {
  status: (n: number) => Res;
  setHeader: (k: string, v: string) => void;
  send: (b: Buffer) => void;
  json: (b: unknown) => void;
  end: () => void;
};

const DEFAULT_VOICE = 'pFZP5JQG7iQjIQuC4Bku'; // Lily — young, works in Spanish via flash/multilingual
const cache = new Map<string, Buffer>();

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'speech', 40))) {
    res.status(429).json({ error: 'Demasiadas solicitudes.' }); return;
  }

  const key = process.env.ELEVENLABS_API_KEY?.trim();
  if (!key) {
    res.status(503).json({ error: 'ElevenLabs no configurado.' }); return;
  }

  const text = typeof req.body?.text === 'string' ? normalizeSpeechText(req.body.text) : '';
  if (!text) { res.status(400).json({ error: 'Texto inválido.' }); return; }

  const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || DEFAULT_VOICE;
  const cacheKey = `${voiceId}:${text}`;
  const hit = cache.get(cacheKey);
  if (hit) {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(hit);
    return;
  }

  const upstream = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': key,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_flash_v2_5',
        language_code: 'es',
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.75,
          style: 0.4,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '');
    res.status(502).json({
      error: 'No se pudo generar la voz.',
      detail: detail.slice(0, 200),
    });
    return;
  }

  const buf = Buffer.from(await upstream.arrayBuffer());
  if (cache.size > 200) cache.clear();
  cache.set(cacheKey, buf);
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(200).send(buf);
}
