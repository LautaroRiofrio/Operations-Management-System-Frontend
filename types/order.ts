import type { Dispatch, SetStateAction } from 'react';

export type OrderMode = 'default' | 'ver' | 'editar' | 'crear';

export type SetOrderMode = Dispatch<SetStateAction<OrderMode>>;


export type OrderSectionProps = {
  mode: OrderMode;
  setMode: SetOrderMode;
};

export type OrderCardProps = {
  mode: OrderMode;
  setMode: SetOrderMode;
  setOrder: () => void;
};
