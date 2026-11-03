import { apiClient } from "./client";

const client = apiClient;

describe('GET /api/health', () => {
    it('возвращать Ок и статус 200', async() => {
        const res = await client.get('/api/health');
        expect(res.status).toBe(200);
        expect(res.data.status).toBe('ok');
    });
});
