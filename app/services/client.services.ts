import { api } from './api';

export async function searchClients(){
    const {data} = await api.get(`/clients`);
    return data;
}