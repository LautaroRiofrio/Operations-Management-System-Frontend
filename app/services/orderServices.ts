import {api} from './api';

export async function getOrderByState(state: number = 1){
    const {data} = await api.get(`/order/state/${state}`);
    return data;
}

export async function getOrderById(id: number){
    const {data} = await api.get(`/order/${id}`);
    return data;
}
