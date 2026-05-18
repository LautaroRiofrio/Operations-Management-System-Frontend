'use client'

import OrderFormBase from '@/app/components/orderSection/orderFormBase';
import type { OrderFormBaseProps, OrderSectionProps } from '@/types';

const EditOrderForm = ({
  onUnsavedChangesChange,
  selectedOrderId,
  setMode,
}: OrderSectionProps & Pick<OrderFormBaseProps, 'onUnsavedChangesChange'>) => {
  return (
    <OrderFormBase
      onUnsavedChangesChange={onUnsavedChangesChange}
      selectedOrderId={selectedOrderId}
      setMode={setMode}
      variant="edit"
    />
  );
};

export default EditOrderForm;
