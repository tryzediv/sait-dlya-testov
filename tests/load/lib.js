export const BASE_URL = 'http://195.63.138.24:4000';

export function jsonSafe(res) {
    try {
        return res.json();
    } catch (error) {
        return error;
    }
}

