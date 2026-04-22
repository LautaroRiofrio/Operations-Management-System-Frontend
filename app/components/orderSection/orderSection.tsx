'use client'

import OrderForm from './orderForm';
import EditOrderForm from './editOrderForm';
import EmptyOrder from './emptyOrder';
import ViewOrder from './viewOrder';
import type { OrderSectionProps } from '@/types';

const OrderSection = ({ setMode, mode, selectedOrderId }: OrderSectionProps) => {
  const renderContent = () => {
    switch (mode) {
      case 'crear':
        return <OrderForm setMode={setMode} mode={mode} />;
      case 'editar':
        return <EditOrderForm selectedOrderId={selectedOrderId} setMode={setMode} mode={mode} />;
      case 'ver':
        return <ViewOrder selectedOrderId={selectedOrderId} setMode={setMode} mode={mode} />
      case "default":
      default:
        return <EmptyOrder setMode={setMode} mode={mode} />;
    }
  };

  return (
    <section className="h-full max-h-full min-h-0 overflow-hidden bg-neutral-100">
      {renderContent()}
    </section>
  );
};

export default OrderSection;
