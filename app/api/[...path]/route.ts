import { NextRequest, NextResponse } from 'next/server';

async function proxyRequest(
  request: NextRequest,
  path: string[]
) {
  try {
    const pathname = path.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/${pathname}${searchParams ? `?${searchParams}` : ''}`;

    const headers = new Headers(request.headers);
    headers.delete('host');

    const body = ['GET', 'HEAD'].includes(request.method)
      ? undefined
      : await request.text();

    const response = await fetch(url, {
      method: request.method,
      headers,
      body,
    });

    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('[v0] Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path);
}
