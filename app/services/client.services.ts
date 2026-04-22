import { api } from './api';
import type { CreateCustomerInput } from '@/types';

function normalizeWhatsapp(value: CreateCustomerInput['whatsapp']): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsedValue = Number(value.replace(/\D/g, ''));
    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  throw new Error('El WhatsApp debe ser un numero valido.');
}

export async function searchClients() {
  const { data } = await api.get('/clients');
  return data;
}

export async function createClient(payload: CreateCustomerInput) {
  const { data } = await api.post('/clients', {
    nombre: payload.name.trim(),
    whatsapp: normalizeWhatsapp(payload.whatsapp),
  });

  return data;
}
