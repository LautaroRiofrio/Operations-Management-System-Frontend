'use client'

import OrderFormBase from '@/app/components/orderSection/orderFormBase';
import type { OrderSectionProps } from '@/types';

const OrderForm = ({ setMode }: OrderSectionProps) => {
  return <OrderFormBase setMode={setMode} variant="create" />;
};

export default OrderForm;
