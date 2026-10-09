import { NextRequest, NextResponse } from 'next/server';
import { comfyUIService } from '@/lib/services/comfyui-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const promptId = searchParams.get('promptId');

  if (!promptId) {
    return NextResponse.json(
      { error: '"promptId" query parameter is required.' },
      { status: 400 }
    );
  }

  try {
    const result = await comfyUIService.collectOutputsFromHistory(promptId);

    const outputs: string[] = [];
    if (result.status === 'completed' && result.outputUrls.length > 0) {
      for (const url of result.outputUrls) {
        try {
          const dataUri = await comfyUIService.downloadAssetAsDataUri(url);
          outputs.push(dataUri);
        } catch {
          outputs.push(url);
        }
      }
    }

    return NextResponse.json({
      promptId: result.promptId,
      status: result.status,
      outputUrls: result.outputUrls,
      outputs,
      error: result.error,
    });
  } catch (err: any) {
    console.error('[api/comfyui/status] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch ComfyUI status.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === 'health') {
      const health = await comfyUIService.healthCheck();
      return NextResponse.json({ health });
    }

    if (action === 'queue') {
      const queue = await comfyUIService.getQueueStatus();
      return NextResponse.json({ queue });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Request failed.' },
      { status: 500 }
    );
  }
}
