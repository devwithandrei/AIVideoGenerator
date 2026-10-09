import { NextRequest, NextResponse } from 'next/server';
import { comfyUIService, ComfyUIGenerateResult } from '@/lib/services/comfyui-service';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

export const maxDuration = 600;

// #region debug-point A:route-entry
const __dbg = (() => {
  let u = 'http://127.0.0.1:7777/event', s = 'video-gen-hang';
  try { const e = readFileSync(join(process.cwd(), '.dbg', 'video-gen-hang.env'), 'utf8'); u = e.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || u; s = e.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || s; } catch {}
  const rid = 'pre';
  return (hyp?: string, loc?: string, msg?: string, data: Record<string, any> = {}, trc?: string) => { (async () => { try { await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: s, runId: rid, hypothesisId: hyp ?? '', location: loc ?? '', msg: '[DEBUG] ' + (msg ?? ''), data: data ?? {}, traceId: trc ?? '', ts: Date.now() }) }); } catch {} })(); };
})();
// #endregion

export async function POST(request: NextRequest) {
  const traceId = 'r-' + Math.random().toString(36).slice(2, 10);
  // #region debug-point A:route-entry
  __dbg('A', 'route.ts:POST', 'route handler entry', { path: request.nextUrl.pathname, method: request.method }, traceId);
  // #endregion
  try {
    const body = await request.json();
    // #region debug-point A:route-body
    __dbg('A', 'route.ts:body', 'body parsed', { mode: body?.mode, hasPrompt: !!body?.prompt, unetVariant: body?.unetVariant || null, vaeVariant: body?.vaeVariant || null, w: body?.width || null, h: body?.height || null }, traceId);
    // #endregion
    const {
      mode = 'text-to-image',
      prompt,
      negativePrompt,
      width,
      height,
      steps,
      cfg,
      seed,
      workflowPath,
      images,
      unetVariant,
      vaeVariant,
    } = body;

    const health = await comfyUIService.healthCheck();
    // #region debug-point B:health-check
    __dbg('B', 'route.ts:health', 'healthCheck result', { ok: health.ok, message: health.message || '' }, traceId);
    // #endregion
    if (!health.ok) {
      // #region debug-point B:health-unreachable
      __dbg('B', 'route.ts:health', 'backend unreachable, returning 503', { detail: health.message || '' }, traceId);
      // #endregion
      return NextResponse.json(
        {
          error: 'Generation backend is unreachable',
          detail: health.message,
          hint: 'Ensure the generation pod is running and COMFYUI_SERVER_URL is configured in your environment.',
        },
        { status: 503 }
      );
    }

    const validateUnet = (v?: unknown): 'fl2va' | 'ref2va' | undefined =>
      v === 'fl2va' || v === 'ref2va' ? v : undefined;
    const validateVae = (v?: unknown):
      | 'taeh3'
      | 'minimax_h3_video_vae_fp16'
      | 'minimax_h3_audio_vae_fp32'
      | undefined => {
      if (
        v === 'taeh3' ||
        v === 'minimax_h3_video_vae_fp16' ||
        v === 'minimax_h3_audio_vae_fp32'
      ) {
        return v;
      }
      return undefined;
    };

    let result: ComfyUIGenerateResult;

    switch (mode) {
      case 'text-to-image':
      case 'text-to-video': {
        if (!prompt || typeof prompt !== 'string') {
          return NextResponse.json(
            { error: `A "prompt" string is required for ${mode} mode.` },
            { status: 400 }
          );
        }
        // #region debug-point C:service-precall
        __dbg('C', 'route.ts:svc-before', 'calling generateImageFromText', { mode, promptLen: (prompt || '').length, unetValid: validateUnet(unetVariant) || null, vaeValid: validateVae(vaeVariant) || null }, traceId);
        // #endregion
        result = await comfyUIService.generateImageFromText({
          prompt,
          negativePrompt,
          width: width ? Number(width) : undefined,
          height: height ? Number(height) : undefined,
          steps: steps ? Number(steps) : undefined,
          cfg: cfg ? Number(cfg) : undefined,
          seed: seed ? Number(seed) : undefined,
          workflowPath,
          unetVariant: validateUnet(unetVariant),
          vaeVariant: validateVae(vaeVariant),
        });
        // #region debug-point C:service-postcall
        __dbg('C', 'route.ts:svc-after', 'generateImageFromText returned', { status: result.status, outputUrlsLen: result.outputUrls.length, error: result.error || null, promptId: result.promptId || null }, traceId);
        // #endregion
        break;
      }
      default:
        return NextResponse.json(
          { error: `Unsupported mode: ${mode}` },
          { status: 400 }
        );
    }

    if (result.status === 'error') {
      return NextResponse.json(
        { error: result.error || 'Generation failed' },
        { status: 500 }
      );
    }

    const outputs: string[] = [];
    if (result.outputUrls.length > 0) {
      for (const url of result.outputUrls) {
        try {
          const dataUri = await comfyUIService.downloadAssetAsDataUri(url);
          outputs.push(dataUri);
        } catch (err: any) {
          outputs.push(url);
        }
      }
    }

    return NextResponse.json({
      promptId: result.promptId,
      status: result.status,
      outputUrls: result.outputUrls,
      outputs,
      mode,
    });
    // #region debug-point D:route-success
    __dbg('D', 'route.ts:done', 'SUCCESS response sent', { mode, outputsLen: outputs.length, outputUrlsLen: result.outputUrls.length, status: result.status }, traceId);
    // #endregion
  } catch (err: any) {
    // #region debug-point D:route-error
    __dbg('D', 'route.ts:catch', 'UNHANDLED error in route catch', { errMsg: err?.message || String(err), stack: (err?.stack || '').slice(0, 400) }, traceId);
    // #endregion
    console.error('[api/comfyui/generate] Error:', err);
    return NextResponse.json(
      { error: err.message || 'An unknown error occurred during generation.' },
      { status: 500 }
    );
  }
}
