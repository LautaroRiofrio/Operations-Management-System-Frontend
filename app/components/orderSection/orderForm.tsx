'use client'

import OrderFormBase from '@/app/components/orderSection/orderFormBase';
import type { OrderFormBaseProps, OrderSectionProps } from '@/types';

const OrderForm = ({
  defaultStateId,
  onUnsavedChangesChange,
  setMode,
}: OrderSectionProps & Pick<OrderFormBaseProps, 'onUnsavedChangesChange'>) => {
  return (
    <OrderFormBase
      defaultStateId={defaultStateId}
      onUnsavedChangesChange={onUnsavedChangesChange}
      setMode={setMode}
      variant="create"
    />
  );
};

export default OrderForm;
