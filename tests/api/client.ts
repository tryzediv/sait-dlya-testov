import axios, { AxiosInstance } from 'axios'

export const apiClient: AxiosInstance = axios.create({
    baseURL: 'http://195.63.138.24:4000',
    timeout: 5000,
    validateStatus: () => true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

