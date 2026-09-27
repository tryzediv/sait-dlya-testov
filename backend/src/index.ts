import { createApp } from './app';

const PORT = Number(process.env.PORT ?? 4000);

const app = createApp();

app.listen(PORT, () => {
  console.log(`[backend] listening on :${PORT}, docs at /api/docs`);
});
