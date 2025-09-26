// apps/backend/types/express/index.d.ts
declare namespace Express {
  export interface Request {
    profile?: {
      id: number;
      user_id: string;
      username: string;
      email: string;
      bio: string | null;
      avatar_url: string | null;
      saved_podcasts: number[];
      liked_podcasts: number[];
      created_at: Date;
      updated_at: Date;
    };
  }
}
