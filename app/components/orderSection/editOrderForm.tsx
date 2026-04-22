'use client'

import OrderFormBase from '@/app/components/orderSection/orderFormBase';
import type { OrderSectionProps } from '@/types';

const EditOrderForm = ({ selectedOrderId, setMode }: OrderSectionProps) => {
  return <OrderFormBase selectedOrderId={selectedOrderId} setMode={setMode} variant="edit" />;
};

export default EditOrderForm;
