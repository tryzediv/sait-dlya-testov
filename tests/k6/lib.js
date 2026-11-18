export const BASE_URL = 'http://89.110.103.68:4000';


export function jsonSafe(res) {
  try {
    return res.json();
  } catch {
    return null;
  }
}
