// server/index.ts (Temporary modification for debugging)
console.log('>>> [index.ts START] Attempting to read environment variables...');
console.log('>>> [index.ts] PGDATABASE:', process.env.PGDATABASE);
console.log('>>> [index.ts] PGUSER:', process.env.PGUSER);
console.log('>>> [index.ts] PGHOST:', process.env.PGHOST);
console.log('>>> [index.ts] PGPASSWORD:', process.env.PGPASSWORD ? '******' : 'undefined'); // 비밀번호 값은 숨김
console.log('>>> [index.ts] PGPORT:', process.env.PGPORT);
console.log('>>> [index.ts] DATABASE_URL:', process.env.DATABASE_URL); // 혹시 모르니 DATABASE_URL도 출력
console.log('>>> [index.ts END] Exiting process.');
process.exit(0); // 로그 출력 후 즉시 종료

/* 
// 원래 코드는 잠시 주석 처리
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes, router } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from 'cors';
import { storage } from './storage';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// API 라우트 등록
app.use('/api', router);

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  server.listen({
    port,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
*/
