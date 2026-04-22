import { createClient, searchClients } from '@/app/services/client.services';
import {
  extractCollection,
  isRecord,
  normalizeClient,
} from '@/app/services/orderFormUtils';
import type { CreateCustomerInput, OrderCustomerOption } from '@/types';

export async function listClientOptions(): Promise<OrderCustomerOption[]> {
  const response = await searchClients();
  return extractCollection(response)
    .map(normalizeClient)
    .filter((client): client is OrderCustomerOption => client !== null);
}

export async function createClientOption(
  input: CreateCustomerInput,
): Promise<OrderCustomerOption> {
  const created = await createClient(input);
  const normalized =
    normalizeClient(created) ?? normalizeClient(isRecord(created) ? created.data : null);

  if (normalized) {
    return normalized;
  }

  const refreshedClients = await listClientOptions();
  const targetWhatsapp = String(input.whatsapp ?? '').trim();
  const matchedClient = refreshedClients.find((client) => {
    const sameName = client.name.trim().toLowerCase() === input.name.trim().toLowerCase();
    const sameWhatsapp = (client.whatsapp ?? '').trim() === targetWhatsapp;
    return sameName && sameWhatsapp;
  });

  if (!matchedClient) {
    throw new Error('No se pudo resolver el cliente recien creado.');
  }

  return matchedClient;
}
