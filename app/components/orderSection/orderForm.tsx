'use client'

import OrderFormBase from '@/app/components/orderSection/orderFormBase';
import type { OrderSectionProps } from '@/types';

const OrderForm = ({ defaultStateId, setMode }: OrderSectionProps) => {
  return <OrderFormBase defaultStateId={defaultStateId} setMode={setMode} variant="create" />;
};

export default OrderForm;
