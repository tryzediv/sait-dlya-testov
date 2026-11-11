import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, jsonSafe } from './lib';

export const options = {
    vus: 5,
    duration: '30s',
    thresholds: {
        http_reg_failed: ['rate < 0.01'],
        http_reg_duration: ['p(95) < 3000'],
        checks: ['rate > 0.99']
    },
};

export default function () {
    const health = http.get(`${BASE_URL}/api/health`);
    console.log(health);
    check(health, { 'health 200': (r) => r.status === 200 });
    if (health.status !== 200) return;


    const products = http.get(`${BASE_URL}/api/products`);
    check(products, { 'catalog 200': (r) => r.status === 200 });
    if (products.status !== 200) return;

    const list = jsonSafe(products);
    check(products, { 'catalog not empty': () => Array.isArray(list) && list.length > 0});
    if (!Array.isArray(list) || list.length === 0) return;

    const productId = list[0].id;
    const product = http.get(`${BASE_URL}/api/products/${productId}`);
    const one = jsonSafe(product);

    check(product, {
        'product 200': (r) => r.status === 200,
        'product id matches': () => one !== null && one.id === productId
    });

    const cart = http.get(`${BASE_URL}/api/cart`, { timeout: '10s' });

    check(cart, { 'cart 200': (r) => r.status === 200 });

    sleep(1);
}