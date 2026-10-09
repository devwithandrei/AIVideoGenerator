import * as fs from 'fs';
import * as path from 'path';

// #region debug-point S:service-init
const __dbg = (() => {
  let u = 'http://127.0.0.1:7777/event', s = 'video-gen-hang';
  try { const e = fs.readFileSync(path.join(process.cwd(), '.dbg', 'video-gen-hang.env'), 'utf8'); u = e.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || u; s = e.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || s; } catch {}
  const rid = 'pre';
  return (hyp?: string, loc?: string, msg?: string, data: Record<string, any> = {}, trc?: string) => { (async () => { try { await (globalThis.fetch || (require('node-fetch') as any).default)(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: s, runId: rid, hypothesisId: hyp ?? '', location: loc ?? '', msg: '[DEBUG] ' + (msg ?? ''), data: data ?? {}, traceId: trc ?? '', ts: Date.now() }) }); } catch {} })(); };
})();
// #endregion

export interface ComfyUIPromptInput {
  [nodeId: string]: {
    inputs: Record<string, any>;
    class_type: string;
    _meta?: { title?: string };
  };
}

export interface ComfyUIQueuePromptResponse {
  prompt_id: string;
  number: number;
  node_errors?: Record<string, any>;
}

export interface ComfyUIHistoryOutput {
  [promptId: string]: {
    prompt_id: string;
    status?: { status?: 'queued' | 'running' | 'completed' | 'error'; messages?: Array<[string, any]> };
    outputs: {
      [nodeId: string]: {
        images?: Array<{
          filename: string;
          subfolder: string;
          type: string;
        }>;
        videos?: Array<{
          filename: string;
          subfolder: string;
          type: string;
        }>;
        gifs?: Array<{
          filename: string;
          subfolder: string;
          type: string;
        }>;
        files?: Array<{
          filename: string;
          subfolder: string;
          type: string;
        }>;
        [other: string]: unknown;
      };
    };
  };
}

export interface ComfyUIGenerateResult {
  promptId: string;
  status: 'queued' | 'running' | 'completed' | 'error';
  outputUrls: string[];
  error?: string;
}

const DEFAULT_COMFYUI_URL =
  process.env.COMFYUI_SERVER_URL || 'http://127.0.0.1:8188';

function getComfyUIBaseUrl(): string {
  const url = process.env.COMFYUI_SERVER_URL || DEFAULT_COMFYUI_URL;
  return url.replace(/\/$/, '');
}

function loadWorkflowFromFile(filePath: string): ComfyUIPromptInput {
  const absolutePath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Workflow file not found: ${absolutePath}`);
  }
  const raw = fs.readFileSync(absolutePath, 'utf8');
  return JSON.parse(raw) as ComfyUIPromptInput;
}

export class ComfyUIService {
  private baseUrl: string;
  private clientId: string;

  constructor(clientId?: string) {
    this.baseUrl = getComfyUIBaseUrl();
    this.clientId = clientId || `aisnv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  async healthCheck(): Promise<{ ok: boolean; message?: string }> {
    try {
      const fetch = (await import('node-fetch')).default;
      __dbg('B', 'comfyui-service:health-before', 'healthCheck calling /system_stats', { baseUrl: this.baseUrl });
      const res = await fetch(`${this.baseUrl}/system_stats`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        __dbg('B', 'comfyui-service:health-result', 'healthCheck status non-200', { status: res.status });
        return { ok: false, message: `Backend returned status ${res.status}` };
      }
      __dbg('B', 'comfyui-service:health-result', 'healthCheck OK', { status: res.status });
      return { ok: true };
    } catch (err: any) {
      __dbg('B', 'comfyui-service:health-result', 'healthCheck EXCEPTION (ComfyUI unreachable?)', { errMsg: err.message || String(err) });
      return { ok: false, message: err.message || 'Failed to reach backend' };
    }
  }

  async queuePrompt(
    workflow: ComfyUIPromptInput
  ): Promise<ComfyUIQueuePromptResponse> {
    const fetch = (await import('node-fetch')).default;
    const nodeCount = Object.keys(workflow).length;
    __dbg('C', 'comfyui-service:queue-before', 'POST /prompt queueing workflow', { baseUrl: this.baseUrl, nodeCount, hasUnet: !!Object.values(workflow).find((n) => n.class_type === 'UNETLoader'), hasKSampler: !!Object.values(workflow).find((n) => n.class_type === 'KSampler'), hasVHS: !!Object.values(workflow).find((n) => String(n.class_type || '').includes('VHS') || String(n.class_type || '').includes('VideoCombine')), hasSaveImage: !!Object.values(workflow).find((n) => n.class_type === 'SaveImage') });
    const body = JSON.stringify({
      prompt: workflow,
      client_id: this.clientId,
    });
    const res = await fetch(`${this.baseUrl}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
    });
    if (!res.ok) {
      const text = await res.text();
      __dbg('C', 'comfyui-service:queue-result', 'POST /prompt FAILED (4xx/5xx - validation likely)', { status: res.status, textPreview: (text || '').slice(0, 1200) });
      throw new Error(
        `Request failed (${res.status}): ${text}`
      );
    }
    const json = (await res.json()) as ComfyUIQueuePromptResponse;
    // #region debug-point C:queue-nodeerrors-detail
    const ne: Record<string, any> | undefined = json.node_errors;
    const hasErrors = !!ne && Object.keys(ne).length > 0;
    __dbg('C', 'comfyui-service:queue-result', hasErrors ? 'POST /prompt returned HTTP 200 BUT node_errors present (validation failed!)' : 'POST /prompt QUEUED', {
      promptId: json.prompt_id,
      number: json.number,
      nodeErrorsPresent: hasErrors,
      nodeErrorsCount: hasErrors ? Object.keys(ne).length : 0,
      nodeErrors: hasErrors ? Object.fromEntries(
        Object.entries(ne).map(([nodeId, err]: [string, any]) => [
          nodeId,
          {
            class_type: err.class_type || null,
            dependent_outputs: err.dependent_outputs || null,
            errors: (err.errors || []).map((e: any) => ({
              type: e.type,
              message: e.message,
              details: e.details,
              input_name: e.extra_info?.input_name || null,
              input_config: e.extra_info?.input_config ? (Array.isArray(e.extra_info.input_config[0]) ? `${e.extra_info.input_config[0].length} allowed values` : e.extra_info.input_config) : null,
              received_value: e.extra_info?.received_value ?? null,
            })),
          },
        ])
      ) : null,
    });
    if (hasErrors) {
      const firstEntry = Object.entries(ne)[0];
      const [nodeId, firstErr] = firstEntry as [string, any];
      const err0 = (firstErr.errors || [])[0];
      const summaryMsg = [
        `Prompt validation failed with ${Object.keys(ne).length} node error(s).`,
        `First error at node ${nodeId} (${firstErr.class_type || 'unknown'}): ${err0?.message || 'unknown error'}`,
        err0?.details ? `Details: ${err0.details}` : null,
        err0?.extra_info?.input_name ? `Input: ${err0.extra_info.input_name}; received: ${JSON.stringify(err0.extra_info.received_value)}` : null,
      ].filter(Boolean).join(' | ');
      throw new Error(summaryMsg);
    }
    // #endregion
    return json;
  }

  async getHistory(promptId: string): Promise<ComfyUIHistoryOutput> {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch(`${this.baseUrl}/history/${promptId}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      __dbg('E', 'comfyui-service:getHistory', 'GET /history failed', { status: res.status, promptId });
      throw new Error(
        `History request failed (${res.status}): ${await res.text()}`
      );
    }
    return (await res.json()) as ComfyUIHistoryOutput;
  }

  async getQueueStatus(): Promise<any> {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch(`${this.baseUrl}/queue`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Queue request failed (${res.status})`);
    }
    return await res.json();
  }

  buildAssetUrl(
    filename: string,
    subfolder = '',
    type = 'output'
  ): string {
    const params = new URLSearchParams({ filename, subfolder, type });
    return `${this.baseUrl}/view?${params.toString()}`;
  }

  async collectOutputsFromHistory(
    promptId: string
  ): Promise<ComfyUIGenerateResult> {
    const history = await this.getHistory(promptId);
    const entry = history[promptId];

    if (!entry) {
      return { promptId, status: 'queued', outputUrls: [] };
    }

    // Detect explicit execution error early — don't poll forever on dead jobs.
    if (entry.status && entry.status.messages) {
      for (const msg of entry.status.messages) {
        const [type, payload] = msg;
        if (type === 'execution_error' && payload) {
          const p = payload as any;
          const nodeId = String(p.node_id || '?');
          const nodeType = String(p.node_type || 'unknown');
          const exMsg = String(p.exception_message || 'Execution error');
          const exType = String(p.exception_type || 'RuntimeError');
          // surface a short 1-line (strip multi-line exception_message from ComfyUI)
          const firstLine = exMsg.split('\n').map(s => s.trim()).find(Boolean) || exMsg;
          __dbg('D', 'comfyui-service:collect-execution_error', 'Found execution_error in history (will throw surface)', {
            promptId,
            nodeId,
            nodeType,
            exceptionType: exType,
            exceptionFirstLine: firstLine,
          });
          return {
            promptId,
            status: 'error',
            outputUrls: [],
            error: `Backend node ${nodeId} (${nodeType}) failed: ${exType}: ${firstLine}`,
          };
        }
      }
    }

    const urls: string[] = [];
    if (entry.outputs) {
      for (const nodeId of Object.keys(entry.outputs)) {
        const out = entry.outputs[nodeId];
        if (out.images) {
          for (const img of out.images) {
            urls.push(this.buildAssetUrl(img.filename, img.subfolder, img.type));
          }
        }
        if (out.videos) {
          for (const vid of out.videos) {
            urls.push(this.buildAssetUrl(vid.filename, vid.subfolder, vid.type));
          }
        }
        if (out.gifs) {
          for (const g of out.gifs) {
            urls.push(this.buildAssetUrl(g.filename, g.subfolder, g.type));
          }
        }
        if (out.files) {
          for (const f of out.files) {
            urls.push(this.buildAssetUrl(f.filename, f.subfolder, f.type));
          }
        }
      }
    }
    if (urls.length > 0) {
      return { promptId, status: 'completed', outputUrls: urls };
    }

    if (entry.status && (entry.status as any).status_str === 'error') {
      return { promptId, status: 'error', outputUrls: [], error: 'Backend reported status_str=error with no outputs' };
    }

    return { promptId, status: 'running', outputUrls: [] };
  }

  async waitForCompletion(
    promptId: string,
    options: { timeoutMs?: number; pollIntervalMs?: number } = {}
  ): Promise<ComfyUIGenerateResult> {
    const timeoutMs = options.timeoutMs ?? 10 * 60 * 1000;
    const pollIntervalMs = options.pollIntervalMs ?? 3000;
    const startedAt = Date.now();
    __dbg('D', 'comfyui-service:wait-start', 'waitForCompletion starting', { promptId, timeoutMs, pollIntervalMs });
    let iter = 0;

    while (Date.now() - startedAt < timeoutMs) {
      iter++;
      const result = await this.collectOutputsFromHistory(promptId);
      __dbg('D', 'comfyui-service:wait-iter', `waitForCompletion iteration`, { iter, elapsedMs: Date.now() - startedAt, status: result.status, outputUrlsLen: result.outputUrls.length, promptId, errorPreview: result.error ? (result.error.slice(0, 220)) : null });
      if (result.status === 'completed') return result;
      if (result.status === 'error') {
        __dbg('D', 'comfyui-service:wait-aborted', 'waitForCompletion stopping early (status=error - not polling forever)', { promptId, error: result.error || 'unknown' });
        return result;
      }
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }

    __dbg('D', 'comfyui-service:wait-timeout', 'waitForCompletion TIMEOUT reached', { promptId, timeoutMs, iter });
    return {
      promptId,
      status: 'error',
      outputUrls: [],
      error: 'Timed out waiting for job to finish',
    };
  }

  async generateImageFromText(params: {
    prompt: string;
    negativePrompt?: string;
    width?: number;
    height?: number;
    steps?: number;
    cfg?: number;
    seed?: number;
    workflowPath?: string;
    unetVariant?: 'fl2va' | 'ref2va';
    vaeVariant?: 'taeh3' | 'minimax_h3_video_vae_fp16' | 'minimax_h3_audio_vae_fp32';
  }): Promise<ComfyUIGenerateResult> {
    const {
      prompt,
      negativePrompt = 'low quality, bad anatomy, extra digits, missing digits, extra limbs, missing limbs',
      width = 1024,
      height = 1024,
      steps = 8,
      cfg = 1,
      seed = Math.floor(Math.random() * 1_000_000_000),
      workflowPath = 'minimax+lipsync.json',
      unetVariant = 'fl2va',
      vaeVariant = 'minimax_h3_video_vae_fp16',
    } = params;
    __dbg('C', 'comfyui-service:gen-start', 'generateImageFromText START', { unetVariant, vaeVariant, w: width, h: height, steps, cfg, promptLen: prompt.length, workflowPath });

    let workflow: ComfyUIPromptInput;
    try {
      workflow = loadWorkflowFromFile(workflowPath);
    } catch (e: any) {
      __dbg('C', 'comfyui-service:gen-workflow', 'workflow load failed; falling back', { err: e?.message || String(e), fallbackPath: 'minimax+lipsync.json' });
      workflow = loadWorkflowFromFile(
        'minimax+lipsync.json'
      );
    }

    // Map human friendly variants → exact installed filenames from ComfyUI ObjectInfo:
    const unetFileName: Record<'fl2va' | 'ref2va', string> = {
      fl2va: 'minimax_h3_fl2va_pruned_int8_convrot.safetensors',
      ref2va: 'minimax_h3_ref2va_pruned_int8_convrot.safetensors',
    };
    const vaeFileName: Record<'taeh3' | 'minimax_h3_video_vae_fp16' | 'minimax_h3_audio_vae_fp32', string> = {
      taeh3: 'taeh3.safetensors',
      minimax_h3_video_vae_fp16: 'minimax_h3_video_vae_fp16.safetensors',
      minimax_h3_audio_vae_fp32: 'minimax_h3_audio_vae_fp32.safetensors',
    };
    const clipFileName = 'qwen3vl_32b_minimax_h3_int8_convrot.safetensors';

    const aspectRatioMap: Record<string, string> = {
      '1:1': '1:1', '16:9': '16:9', '9:16': '9:16',
      '4:3': '4:3', '3:4': '3:4', '3:2': '3:2', '2:3': '2:3',
      '21:9': '21:9', 'landscape': '16:9', 'portrait': '9:16', 'square': '1:1',
    };
    const resolutionMap: Record<string, string> = {
      '480p': '480p', '720p': '720p', '1080p': '720p',
      '4K': '720p',
    };
    let hasHighLevelT2V = false;

    for (const nodeId of Object.keys(workflow)) {
      const node = workflow[nodeId];
      if (!node.inputs) continue;

      if (node.class_type === 'ComfyCloudMiniMaxH3TextToVideoNode' ||
          node.class_type === 'MinimaxTextToVideoNode') {
        hasHighLevelT2V = true;
        const w = Math.max(32, Math.round(Number(width) / 32) * 32);
        const h = Math.max(32, Math.round(Number(height) / 32) * 32);
        const ratio = Math.round((w / h) * 100) / 100;
        let aspect = '16:9';
        for (const [k, v] of Object.entries(aspectRatioMap)) {
          if (k.includes(':')) {
            const [a, b] = k.split(':').map(Number);
            if (Math.abs(ratio - (a / b)) < 0.06) { aspect = v; break; }
          }
        }
        node.inputs.prompt = prompt;
        node.inputs.seed = Number.isFinite(seed) ? Number(seed) : Math.floor(Math.random() * 1_000_000_000);
        node.inputs.aspect_ratio = aspectRatioMap[String(width)+':'+String(height)] || aspect;
        const resKey = steps && steps <= 6 ? '480p' : (String(steps).includes('pro') ? '720p' : '480p');
        node.inputs.resolution = resolutionMap[resKey] || '480p';
        node.inputs.duration_seconds = 5;
        continue;
      }

      if (node.class_type === 'UNETLoader') {
        node.inputs.unet_name = unetFileName[unetVariant];
      }
      if (node.class_type === 'VAELoader') {
        node.inputs.vae_name = vaeFileName[vaeVariant];
      }
      if (node.class_type === 'CLIPLoader') {
        node.inputs.clip_name = clipFileName;
      }
      if (node.class_type === 'CLIPTextEncode') {
        const existingText = String(node.inputs.text || '').toLowerCase();
        if (existingText === '' || existingText.includes('anime rpg') || !nodeId.includes('71')) {
          const posNodeId = Object.keys(workflow).find(
            (n) =>
              workflow[n].class_type === 'CLIPTextEncode' &&
              /anime|cute|campfire|guitar|galaxy/.test(
                String(workflow[n].inputs.text || '').toLowerCase()
              )
          );
          if (posNodeId && nodeId === posNodeId) {
            node.inputs.text = prompt;
          }
          if (!posNodeId) {
            const ksamplerNode = Object.values(workflow).find(
              (n) => n.class_type === 'KSampler'
            );
            if (ksamplerNode) {
              const posRef = (ksamplerNode.inputs.positive as any[])?.[0];
              const negRef = (ksamplerNode.inputs.negative as any[])?.[0];
              if (posRef === nodeId) {
                node.inputs.text = prompt;
              } else if (negRef === nodeId) {
                node.inputs.text = negativePrompt;
              }
            }
          }
        }
        if (nodeId === '71') {
          node.inputs.text = negativePrompt;
        }
        if (nodeId === '67') {
          node.inputs.text = prompt;
        }
      }
      if (node.class_type === 'EmptySD3LatentImage') {
        node.inputs.width = width;
        node.inputs.height = height;
      }
      if (node.class_type === 'KSampler') {
        node.inputs.seed = seed;
        node.inputs.steps = steps;
        node.inputs.cfg = cfg;
      }
      if (node.class_type === 'VHS_VideoCombine') {
        node.inputs.frame_rate = 24;
        node.inputs.filename_prefix = 'AISNV_MiniMax_H3';
        node.inputs.save_output = true;
        if (node.inputs.format == null) node.inputs.format = 'video/h264-mp4';
        if (node.inputs.loop_count == null) node.inputs.loop_count = 0;
        if (node.inputs.pingpong == null) node.inputs.pingpong = false;
      }
    }

    __dbg('C', 'comfyui-service:gen-patched', 'workflow patched; will queue', {
      hasHighLevelT2V,
      unetFile: unetFileName[unetVariant],
      vaeFile: vaeFileName[vaeVariant],
      clipFile: clipFileName,
      classTypes: [...new Set(Object.values(workflow).map((n) => n.class_type))].join(','),
    });
    const { prompt_id } = await this.queuePrompt(workflow);
    return this.waitForCompletion(prompt_id);
  }

  async downloadAssetAsDataUri(url: string): Promise<string> {
    const fetch = (await import('node-fetch')).default as any;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `Failed to download asset (${res.status}): ${url}`
      );
    }
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType =
      res.headers.get('content-type') || 'application/octet-stream';
    return `data:${contentType};base64,${base64}`;
  }
}

export const comfyUIService = new ComfyUIService();
