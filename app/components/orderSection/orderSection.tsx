'use client'

import OrderForm from './orderForm';
import EditOrderForm from './editOrderForm';
import EmptyOrder from './emptyOrder';
import ViewOrder from './viewOrder';
import type { OrderFormBaseProps, OrderSectionProps } from '@/types';

const OrderSection = ({
  defaultStateId,
  mode,
  onUnsavedChangesChange,
  selectedOrderId,
  setMode,
}: OrderSectionProps & Pick<OrderFormBaseProps, 'onUnsavedChangesChange'>) => {
  const renderContent = () => {
    switch (mode) {
      case 'crear':
        return (
          <OrderForm
            defaultStateId={defaultStateId}
            onUnsavedChangesChange={onUnsavedChangesChange}
            setMode={setMode}
            mode={mode}
          />
        );
      case 'editar':
        return (
          <EditOrderForm
            onUnsavedChangesChange={onUnsavedChangesChange}
            selectedOrderId={selectedOrderId}
            setMode={setMode}
            mode={mode}
          />
        );
      case 'ver':
        return <ViewOrder selectedOrderId={selectedOrderId} setMode={setMode} mode={mode} />
      case "default":
      default:
        return <EmptyOrder setMode={setMode} mode={mode} />;
    }
  };

  return (
    <section className="flex min-h-0 bg-neutral-100 lg:h-full lg:max-h-full">
      {renderContent()}
    </section>
  );
};

export default OrderSection;
