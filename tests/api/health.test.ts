import { healthApi } from "./client";


describe('GET /api/health', () => {
    it('возвращать Ок и статус 200', async() => {
        const res = await healthApi.get();
        expect(res.status).toBe(200);
        expect(res.data.status).toBe('ok');
    });
});
