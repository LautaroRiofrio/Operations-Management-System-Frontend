import type { Dispatch, SetStateAction } from 'react';

export type OrderMode = 'default' | 'ver' | 'editar' | 'crear';

export type SetOrderMode = Dispatch<SetStateAction<OrderMode>>;

export type RawOrderRecord = Record<string, unknown>;

export type OrderListItem = {
  id: number;
  orderNumber: string;
  customerName: string;
  deliveryLabel: string;
  totalLabel: string;
  state: number | null;
  raw: RawOrderRecord;
};

export type OrderDetail = {
  id: number;
  orderNumber: string;
  customerId: number | null;
  customerName: string;
  customerWhatsapp: string;
  paymentMethod: string;
  deliveryLabel: string;
  totalLabel: string;
  state: number | null;
  notes: string | null;
  lines: {
    id: number;
    productId: number | null;
    productName: string;
    quantity: number;
    unitPrice: number | null;
    subtotalLabel: string;
  }[];
  raw: RawOrderRecord;
};

export type OrderSectionProps = {
  mode: OrderMode;
  selectedOrderId?: number | null;
  setMode: SetOrderMode;
};

export type OrderCardProps = {
  order: OrderListItem;
  isSelected: boolean;
  onSelect: (orderId: number) => void;
};
