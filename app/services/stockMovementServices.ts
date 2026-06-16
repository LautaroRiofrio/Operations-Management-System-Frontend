import { api } from '@/app/services/api';
import { administrativePaths } from '@/app/services/openapiPaths';
import type {
  MessageResponse,
  PaginatedResponse,
  StockMovement,
  StockMovementCreateInput,
  StockMovementListQuery,
  StockMovementType,
  StockMovementTypeInput,
  StockMovementTypeListQuery,
  StockMovementUpdateInput,
} from '@/types';

export async function getStockMovementTypes(params?: StockMovementTypeListQuery) {
  const { data } = await api.get<PaginatedResponse<StockMovementType>>(
    administrativePaths.stockMovementTypes.collection,
    { params },
  );
  return data;
}

export async function getStockMovementTypeById(id: number) {
  const { data } = await api.get<StockMovementType>(
    administrativePaths.stockMovementTypes.detail(id),
  );
  return data;
}

export async function createStockMovementType(payload: StockMovementTypeInput) {
  const { data } = await api.post<StockMovementType>(
    administrativePaths.stockMovementTypes.collection,
    payload,
  );
  return data;
}

export async function updateStockMovementType(id: number, payload: StockMovementTypeInput) {
  const { data } = await api.put<StockMovementType>(
    administrativePaths.stockMovementTypes.detail(id),
    payload,
  );
  return data;
}

export async function deleteStockMovementType(id: number) {
  const { data } = await api.delete<MessageResponse>(
    administrativePaths.stockMovementTypes.detail(id),
  );
  return data;
}

export async function getStockMovements(params?: StockMovementListQuery) {
  const { data } = await api.get<PaginatedResponse<StockMovement>>(
    administrativePaths.stockMovements.collection,
    { params },
  );
  return data;
}

export async function getStockMovementById(id: number) {
  const { data } = await api.get<StockMovement>(administrativePaths.stockMovements.detail(id));
  return data;
}

export async function createStockMovement(payload: StockMovementCreateInput) {
  const { data } = await api.post<StockMovement>(
    administrativePaths.stockMovements.collection,
    payload,
  );
  return data;
}

export async function updateStockMovement(id: number, payload: StockMovementUpdateInput) {
  const { data } = await api.put<StockMovement>(
    administrativePaths.stockMovements.detail(id),
    payload,
  );
  return data;
}

export async function deleteStockMovement(id: number) {
  const { data } = await api.delete<MessageResponse>(administrativePaths.stockMovements.detail(id));
  return data;
}
