import { NextRequest } from "next/server";

// utils/url.ts
export function getBaseUrl(request: NextRequest) {
    return process.env.NEXT_PUBLIC_BASE_URL ||
        (request.headers.get('host') ?
            `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}` :
            'http://localhost:3000');
}