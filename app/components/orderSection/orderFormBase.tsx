'use client'

import { useState } from 'react';
import Image from 'next/image';
import ClientSelectorModal from '@/app/components/orderSection/clientSelectorModal';
import Products from '@/app/components/orderSection/products';
import { useOrderCatalog } from '@/app/hooks/useOrderCatalog';
import { useOrderDetails } from '@/app/hooks/useOrderDetails';
import { useOrderForm } from '@/app/hooks/useOrderForm';
import type { OrderDetail, OrderFormBaseProps, OrderFormValues } from '@/types';

const PAYMENT_METHODS = ['Efectivo', 'Transferencia', 'Debito'] as const;

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

function getEmptyFormValues(): OrderFormValues {
  return {
    customer: null,
    paymentMethod: 'Efectivo',
    lines: [],
  };
}

function mapOrderDetailToFormValues(order: OrderDetail): OrderFormValues {
  return {
    customer: order.customerId !== null
      ? {
          id: order.customerId,
          name: order.customerName,
          whatsapp: order.customerWhatsapp,
        }
      : null,
    paymentMethod: order.paymentMethod !== 'No informado' ? order.paymentMethod : 'Efectivo',
    lines: order.lines.map((line) => ({
      lineId: line.id,
      productId: line.productId ?? line.id,
      productName: line.productName,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      categoryId: null,
    })),
  };
}

export default function OrderFormBase({
  selectedOrderId,
  setMode,
  variant,
}: OrderFormBaseProps) {
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const resolvedOrderId = selectedOrderId ?? null;
  const isEditing = variant === 'edit';

  const orderDetails = useOrderDetails(isEditing ? resolvedOrderId : null);
  const catalog = useOrderCatalog();

  const initialValues =
    isEditing && orderDetails.order
      ? mapOrderDetailToFormValues(orderDetails.order)
      : getEmptyFormValues();

  const {
    addProduct,
    removeLine,
    setCustomer,
    setPaymentMethod,
    submit,
    submitError,
    submitSuccess,
    submitting,
    totalAmount,
    updateLineQuantity,
    values,
  } = useOrderForm({
    initialValues,
    orderId: resolvedOrderId,
    resetKey: isEditing ? `edit-${orderDetails.order?.id ?? 'loading'}` : 'create',
    validProductIds: catalog.products.map((product) => product.id),
    variant,
  });

  const catalogLoading = catalog.categoriesLoading || catalog.productsLoading;
  const catalogError = catalog.categoriesError ?? catalog.productsError;
  const handleRetryCatalog = async () => {
    await Promise.all([catalog.refreshCategories(), catalog.refreshProducts()]);
  };

  const handleSubmit = async () => {
    const wasSuccessful = await submit();
    if (wasSuccessful) {
      setMode('default');
    }
  };

  if (isEditing && resolvedOrderId === null) {
    return (
      <div className="grid h-full place-items-center p-8">
        <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
          <p className="text-lg font-semibold text-neutral-900">
            Seleccioná una orden para editarla.
          </p>
        </div>
      </div>
    );
  }

  if (isEditing && orderDetails.loading) {
    return (
      <div className="grid h-full place-items-center p-8">
        <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
          <p className="text-lg font-semibold text-neutral-900">Cargando orden...</p>
        </div>
      </div>
    );
  }

  if (isEditing && orderDetails.error) {
    return (
      <div className="grid h-full place-items-center p-8">
        <div className="rounded-3xl bg-red-50 p-6 text-center text-red-600 shadow-sm">
          <p className="text-lg font-semibold">{orderDetails.error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid h-full max-h-full min-h-0 grid-cols-2 gap-5 overflow-hidden p-5">
        <div className="flex min-h-0 flex-col gap-8 overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900">
                {isEditing ? 'Editar orden' : 'Nueva orden'}
              </h2>
              <p className="text-sm text-neutral-500">
                {isEditing
                  ? 'El cliente se mantiene fijo y solo podés ajustar pago y productos.'
                  : 'Seleccioná un cliente desde el modal y armá la orden con productos de la API.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMode('default')}
              className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              Cancelar
            </button>
          </div>

          <div className="grid gap-6">
            <div>
              <h3 className="mb-3 text-xl font-semibold text-neutral-900">Cliente</h3>
              <button
                type="button"
                disabled={isEditing}
                onClick={() => {
                  if (!isEditing) {
                    setIsClientModalOpen(true);
                  }
                }}
                className={`flex w-full items-center gap-3 rounded-3xl border px-5 py-4 text-left ${
                  isEditing
                    ? 'cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-500'
                    : 'border-transparent bg-white text-neutral-900 shadow-sm transition hover:border-neutral-300'
                }`}
              >
                <Image src="/profile.svg" alt="profile" width={24} height={24} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium">
                    {values.customer?.name ?? 'Seleccionar cliente'}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {isEditing
                      ? 'El cliente no se puede modificar durante la edición.'
                      : values.customer?.whatsapp ?? 'Abrí el modal para buscar desde la API.'}
                  </p>
                </div>
              </button>
            </div>

            <div>
              <h3 className="mb-3 text-xl font-semibold text-neutral-900">Metodo de pago</h3>
              <div className="grid grid-cols-3 gap-3">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      values.paymentMethod === method
                        ? 'bg-regal-gris-hover text-white'
                        : 'bg-white text-neutral-700 shadow-sm hover:bg-neutral-100'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <Products
              categories={catalog.categories}
              error={catalogError}
              loading={catalogLoading}
              onAddProduct={addProduct}
              onRetry={handleRetryCatalog}
              products={catalog.products}
              selectedCategoryId={selectedCategoryId}
              setSelectedCategoryId={setSelectedCategoryId}
            />
          </div>
        </div>

        <div className="min-h-0 overflow-hidden rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex h-full min-h-0 flex-col gap-5">
            <div>
              <h3 className="text-2xl font-bold text-neutral-900">Resumen</h3>
              <p className="text-sm text-neutral-500">
                {isEditing
                  ? 'Cambios listos para guardar en la orden seleccionada.'
                  : 'Revisá el pedido antes de crear la orden.'}
              </p>
            </div>

            {submitError ? (
              <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-600">{submitError}</div>
            ) : null}

            {submitSuccess ? (
              <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
                {submitSuccess}
              </div>
            ) : null}

            <div className="grid gap-3 rounded-2xl bg-neutral-100 p-4 text-sm text-neutral-600">
              <div className="flex items-center justify-between gap-4">
                <span>Cliente</span>
                <span className="font-medium text-neutral-900">
                  {values.customer?.name ?? 'Sin seleccionar'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Pago</span>
                <span className="font-medium text-neutral-900">{values.paymentMethod}</span>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {values.lines.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 px-4 py-6 text-sm text-neutral-500">
                  Todavía no agregaste productos.
                </div>
              ) : (
                <div className="grid gap-3">
                  {values.lines.map((line) => (
                    <div key={line.productId} className="rounded-2xl border border-neutral-200 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-neutral-900">{line.productName}</p>
                          <p className="text-sm text-neutral-500">
                            {line.unitPrice !== null ? formatCurrency(line.unitPrice) : 'Precio sin definir'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeLine(line.productId)}
                          className="text-sm text-red-500 transition hover:text-red-700"
                        >
                          Quitar
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateLineQuantity(line.productId, line.quantity - 1)}
                            className="h-9 w-9 rounded-full bg-neutral-100 text-lg text-neutral-700"
                          >
                            -
                          </button>
                          <span className="min-w-8 text-center font-medium text-neutral-900">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateLineQuantity(line.productId, line.quantity + 1)}
                            className="h-9 w-9 rounded-full bg-neutral-100 text-lg text-neutral-700"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-semibold text-neutral-900">
                          {formatCurrency((line.unitPrice ?? 0) * line.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-4 border-t border-neutral-200 pt-4">
              <div className="flex items-center justify-between text-lg">
                <span className="font-medium text-neutral-600">Total</span>
                <span className="text-2xl font-bold text-neutral-900">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting || catalogLoading}
                className="rounded-2xl bg-regal-gris-hover px-5 py-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? 'Guardando...'
                  : isEditing
                    ? 'Guardar cambios'
                    : 'Crear orden'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ClientSelectorModal
        isOpen={!isEditing && isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSelect={setCustomer}
        selectedCustomerId={values.customer?.id ?? null}
      />
    </>
  );
}
