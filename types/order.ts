import type { Dispatch, SetStateAction } from 'react';
import type { Category, ProductExpanded } from './admin';

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

export type OrderCustomerOption = {
  id: number;
  name: string;
  whatsapp?: string | null;
};

export type OrderFormLine = {
  lineId: number | null;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number | null;
  categoryId: number | null;
};

export type OrderFormValues = {
  customer: OrderCustomerOption | null;
  paymentMethod: string;
  lines: OrderFormLine[];
};

export type OrderMutationInput = {
  customerId: number;
  paymentMethod: string;
  lines: {
    lineId?: number | null;
    productId: number;
    quantity: number;
  }[];
};

export type CreateCustomerInput = {
  name: string;
  whatsapp?: string | number | null;
};

export type OrderFormBaseProps = {
  selectedOrderId?: number | null;
  setMode: SetOrderMode;
  variant: 'create' | 'edit';
};

export type OrderProductCatalogProps = {
  categories: Category[];
  error: string | null;
  loading: boolean;
  onAddProduct: (product: ProductExpanded) => void;
  onRetry: () => Promise<void>;
  products: ProductExpanded[];
  selectedCategoryId: number | 'all';
  setSelectedCategoryId: Dispatch<SetStateAction<number | 'all'>>;
};
