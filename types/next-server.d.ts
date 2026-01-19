/// <reference types="next" />

declare module 'next/server' {
  import type { ReadonlyHeaders, ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/headers';

  export class NextRequest extends Request {
    constructor(input: RequestInfo | URL, init?: RequestInit);
    readonly url: string;
    readonly method: string;
    readonly headers: ReadonlyHeaders;
    readonly cookies: ReadonlyRequestCookies;
    readonly nextUrl: URL;
    json(): Promise<any>;
    text(): Promise<string>;
    formData(): Promise<FormData>;
    arrayBuffer(): Promise<ArrayBuffer>;
    blob(): Promise<Blob>;
  }

  export class NextResponse extends Response {
    static json(body: any, init?: ResponseInit): NextResponse;
    static redirect(url: string | URL, status?: number): NextResponse;
    static rewrite(destination: string | URL): NextResponse;
    static next(init?: ResponseInit): NextResponse;
    cookies: {
      get(name: string): { name: string; value: string } | undefined;
      getAll(): Array<{ name: string; value: string }>;
      has(name: string): boolean;
      set(name: string, value: string, options?: any): void;
      delete(name: string): void;
      clear(): void;
    };
  }

  export interface ResponseInit {
    status?: number;
    statusText?: string;
    headers?: HeadersInit;
  }
}
