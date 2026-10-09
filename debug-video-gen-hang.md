# DEBUG SESSION: video-gen-hang  [OPEN]

## Symptom
User clicks "Generate" on Text-to-Video tab (MiniMax H3 / FL2VA model). UI spinner shows "Generating… This may take a moment." Hangs for 4+ minutes with no result, no error toast, no success. User has fast high-VRAM pod — normally fast.

**Expected**: Generation completes or shows a clear error toast within <60s.
**Actual**: Infinite spinner — no transition to success/error state.

## Logs provided (Next.js)
```
[0]  POST /studio/video-generator 200 in 1894ms
[0]  ○ Compiling /api/comfyui/generate ...
[0]  ✓ Compiled /api/comfyui/generate in 3.5s (1270 modules)
[0]  GET / 200 in 199ms
[0]  GET /studio/video-generator 200 in 199ms
[0]  GET /favicon.ico 200 in 11ms
```
Key observation: Route was **compiled** but no `POST /api/comfyui/generate` appears after compilation — the request never actually showed in Next logs.

## Files In Scope
- `src/app/api/comfyui/generate/route.ts`
- `src/lib/services/comfyui-service.ts` (queuePrompt + waitForCompletion polling)
- `src/middleware.ts` (URL rewrites: /studio/* → /dashboard/*, could affect /api)
- `src/app/dashboard/video-generator/components/text-to-video-tab.tsx` (onSubmit)

## Hypotheses (Falsifiable)
1. **H1: Request never reaches server (fetch client issue / middleware drop)** — POST body `mode: "text-to-video"` + `unetVariant` triggers a middleware rewrite rule that catches `/api` under `/studio`, OR the client `<form onSubmit>` does `event.preventDefault()` but later throws *synchronously* before `fetch()` such that the promise chain stops and `setIsLoading(false)` never runs in `finally`. Predict: debug log at very top of route handler NEVER fires.

2. **H2: queuePrompt() hangs / ComfyUI server unresponsive (network / wrong URL)** — `COMFYUI_SERVER_URL` points to localhost but user runs on a remote pod (different IP/port), `fetch(node-fetch)` hangs indefinitely. Predict: `queuePrompt → before POST to ComfyUI` log fires, nothing after.

3. **H3: queuePrompt 400s again but error handling eats it (no throw up to route)** — the downstream image-class nodes (EmptySD3LatentImage + KSampler + SaveImage) fail MiniMax H3 video-class validation (the 2nd issue we flagged in the summary). Predict: route entry log fires, service queuePrompt POST log fires, then a 400 error is caught but silently swallowed / returns empty outputs.

4. **H4: waitForCompletion polling infinite loop** — polling GET /history returns 200 but without expected `outputs` key because MiniMax H3 packs outputs under a different key-name / node-id shape than the code expects. Predict: `waitForCompletion iteration N` logs repeat indefinitely with `found=false`, timeout never triggers.

5. **H5: Route Response never resolved (Next edge/stream issue)** — generateImageFromText() promise never resolves (e.g., unhandled rejection inside a nested call) so the route handler never writes a Response back → client `await res.json()` never returns → spinner stuck.

## Evidence Round 1 (Pre-fix logs) — H3 + H4 CONFIRMED

Instrumentation points fired for full flow. RunId=pre. Prompt=cat-walking-768x432.

**Hypothesis verdicts (evidence-based):**
- ❌ H1 REJECTED. route.ts:POST entry log A fires (traceId r-v4frbexg) with body parsed correctly (text-to-video, prompt ok, unet=fl2va, w/h correct).
- ❌ H2 REJECTED. Same baseUrl `https://mqh83v87hr06en-8188.proxy.runpod.net` used for health → 200 OK in 539ms.
- ✅ **H3 CONFIRMED (partially).** `queuePrompt()` returned HTTP 200, prompt_id=`97beacc4-cc83-4a5d-8c74-299ac5cb04c6`, number=2, **BUT `nodeErrorsPresent: true`** → service *did not throw* because queuePrompt only checks `!res.ok` (HTTP status). ComfyUI returned 200 with validation errors. → BUG 1 IN queuePrompt: Must throw on node_errors even on HTTP 200.
- ✅ **H4 CONFIRMED.** waitForCompletion iterations 1..20+ repeat `status=running`, `outputUrlsLen=0` every 3s. Elapsed 63s+ with no transition because the prompt never actually ran (validation failed pre-execution, node_errors present but ignored). → BUG 2 IN waitForCompletion: Should early-return error if collectOutputsFromHistory keeps returning `running` for a prompt that has node_errors. We should also surface node_errors to the user.
- ❌ H5 REJECTED: route is in active wait, not a stuck promise.

**Class type snapshot from pre-fix log (comfyui-service:gen-patched, H3 evidence root cause for downstream):**
```
classTypes: "SaveImage,CLIPLoader,VAELoader,VAEDecode,UNETLoader,CLIPTextEncode,EmptySD3LatentImage,ModelSamplingAuraFlow,KSampler"
→ hasSaveImage: true,  hasKSampler: true,  hasVHS: false,  hasMiniMaxLatentVideo: false
```
Workflow still uses IMAGE nodes (KSampler, EmptySD3LatentImage, SaveImage). No `EmptyMiniMaxH3LatentVideo`, no `MiniMaxH3Sampler`, no `VHS_VideoCombine` → MiniMax H3 VIDEO UNet loaded but latent/sampler/sink are image-only → triggers node_errors during ComfyUI prompt validation.

## Evidence Round 2 (Post-fix CLI runId=post) — Infinite Spinner *FIXED*

Elapsed POST request timing + response content:
- **Pre-fix (user experience):** Spinner stuck for 4+ MINUTES with NO result/no error toast/no response. waitForCompletion polled forever because it never checked for `status_str=error`.
- **Post-fix (PowerShell POST run `job-4d79febf8075`):**
  - Total elapsed from HTTP POST → HTTP response: **32.132 seconds** (<1 min).
  - HTTP 500 Internal Server Error with CLEAR structured JSON error body, NO hang:
    ```json
    {"error":"Backend node 70 (KSampler) failed: AttributeError: 'ModelSamplingAdvanced' object has no attribute 'audio_scale'"}
    ```
  - Infinite spinner BUG 100% RESOLVED.

### Bug fixes applied (Round 2):
1. **`queuePrompt()` Bug 1 — silent 200-OK with `node_errors`:** Now inspects response.body even when HTTP 200, dumps node_errors (with `type, message, details, input_name, received_value, len(allowed_values)`) AND THROWS a summary Error so route responds in <2s. Previously: silent skip.
2. **`collectOutputsFromHistory()` Bug 2a — ignored execution_error:** NEW code block (L213-240) walks `status.messages` list; when message[0] === `'execution_error'`, extracts `node_id / node_type / exception_type / exception_message (1st line)` → returns immediately `status='error'` with user-readable error text. Previously: looped forever as status='running'.
3. **`collectOutputsFromHistory()` Bug 2b — output key-name myopia:** NEW detectors for `out.gifs` + `out.files` (H4 hypothesis — pack-specific output keys). Previously only checked `.images/.videos`.
4. **`waitForCompletion()` Bug 2c — no early stop on error:** NEW `if (result.status === 'error')` break inside poll loop at L294-297 + log `wait-aborted`. Previously: only checked for `status==='completed'`, kept polling until 10min timeout even when job was dead.
5. **`generateImageFromText()` Bug 3 — VAE wrong default:** `vaeVariant` default changed from `'taeh3'` → `'minimax_h3_video_vae_fp16'` (L332). This is what actually made us **PROGRESS from node 63 failure to node 70 failure** in the execution pipeline — `taeh3.safetensors` was failing runtime validation with `"ERROR: VAE is invalid: None"`; the user's MiniMax H3 RunPod image requires `minimax_h3_video_vae_fp16.safetensors` for actual video decode.
6. **13-file ComfyUI branding sweep leftovers — neutralized route 503/500 error strings** (generation backend / generation failed / unknown error during generation).

### Current remaining error — graph is still image-class:
Error now is at **node 70 (KSampler)** → `ModelSamplingAdvanced (class_type ModelSamplingAuraFlow, node 69) has no attribute 'audio_scale'`. The current `minimax+lipsync.json` is loading a VIDEO UNet (`minimax_h3_fl2va`) but feeding it image-class latent/sampler pipeline: `EmptySD3LatentImage` + `ModelSamplingAuraFlow` + regular image `KSampler` → MiniMax's overridden KSampler code complains because its model object doesn't have `audio_scale` (a field the MiniMax H3 video-class model wrapper sets in its own model-sampling node, not in AuraFlow).

We need the correct MiniMax H3 **video-class** node chain in the workflow:
```
CLIPLoader (clip) + UNETLoader (minimax_h3_* unet) + VAELoader (minimax_h3_video_vae_fp16.safetensors)
  → EmptyMiniMaxH3LatentVideo  (NOT EmptySD3LatentImage)
  → MiniMaxH3ModelSampling     (NOT ModelSamplingAuraFlow)
  → MiniMaxH3Sampler / KSampler  (with correct video sampling)
  → MiniMaxH3Decode            (NOT VAEDecode)
  → VHS_VideoCombine → outputs.videos  (NOT SaveImage)
```
We can get exact class_type name + required input schema 2 ways:
  a) **USER PREFERRED (fastest):** Export a WORKING workflow JSON from user's RunPod ComfyUI web UI that produces a correct MP4 output when they click Queue Prompt. Replace our current JSON.
  b) **AUTOMATIC:** Query `GET /object_info/{MiniMaxClassName}` from pod dynamically and build. Requires trial & error.

## State
[OPEN] Round 2 complete. **Infinite spinner FIXED.** Pending: swap image workflow for correct MiniMax-H3 video workflow to resolve KSampler/audio_scale AttributeError → then user gets actual video output.
