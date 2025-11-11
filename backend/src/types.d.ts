declare namespace Express {
  export interface User {
    id?: string;
    email?: string;
    name?: string;
    displayName?: string;
    emails?: Array<{ value: string; verified: boolean }>;
  }
}

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      username?: string;
      email: string;
      name: string;
    };
  }
}