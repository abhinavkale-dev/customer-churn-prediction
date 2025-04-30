// Type definitions for Next.js
declare module 'next/server' {
  export class NextResponse<T = any> {
    static json<T>(body: T, init?: ResponseInit): NextResponse<T>;
    static redirect(url: string, init?: ResponseInit): NextResponse;
    static rewrite(url: string, init?: ResponseInit): NextResponse;
    static next(init?: ResponseInit): NextResponse;
  }
} 