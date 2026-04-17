import { NextRequest, NextResponse } from 'next/server';

/**
 * DICOM Proxy for Andromeda PACS
 * Fetches remote .dcm files and streams them to bypass CORS.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    try {
        const response = await fetch(targetUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch remote DICOM: ${response.statusText}`);
        }

        const data = await response.arrayBuffer();

        // Return as application/dicom
        return new NextResponse(data, {
            headers: {
                'Content-Type': 'application/dicom',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (error: any) {
        console.error('DICOM Proxy Error:', error);
        return new NextResponse(`Proxy error: ${error.message}`, { status: 500 });
    }
}
