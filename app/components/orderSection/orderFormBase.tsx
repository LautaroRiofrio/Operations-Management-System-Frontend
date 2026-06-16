'use client'

import { useEffect, useState } from 'react';
import Image from 'next/image';
import ConfirmationDialog from '@/app/components/confirmationDialog';
import ClientSelectorModal from '@/app/components/orderSection/clientSelectorModal';
import CreateClientModal from '@/app/components/orderSection/createClientModal';
import Products from '@/app/components/orderSection/products';
import { useConfirmationDialog } from '@/app/hooks/useConfirmationDialog';
import { useOrderCatalog } from '@/app/hooks/useOrderCatalog';
import { useOrderDetails } from '@/app/hooks/useOrderDetails';
import { useOrderForm } from '@/app/hooks/useOrderForm';
import type { OrderDetail, OrderFormBaseProps, OrderFormValues } from '@/types';

const PAYMENT_METHODS = [
  { label: 'Efectivo', value: 'efectivo' },
  { label: 'Transferencia', value: 'transferencia' },
  { label: 'Debito', value: 'debito' },
] as const;
const DEFAULT_NEW_ORDER_STATE_ID = 1;

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
    estimatedDelivery: '',
    lines: [],
    paymentMethod: 'efectivo',
    stateId: null,
  };
}

function formatDateTimeLocal(value: string | null): string {
  if (!value) {
    return '';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');
  const hours = String(parsedDate.getHours()).padStart(2, '0');
  const minutes = String(parsedDate.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
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
    estimatedDelivery: formatDateTimeLocal(order.estimatedDeliveryValue),
    lines: order.lines.map((line) => ({
      lineId: line.id,
      productId: line.productId ?? line.id,
      productName: line.productName,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      categoryId: null,
    })),
    paymentMethod: order.paymentMethod !== 'No informado' ? order.paymentMethod.toLowerCase() : 'efectivo',
    stateId: order.state,
  };
}

export default function OrderFormBase({
  defaultStateId,
  onUnsavedChangesChange,
  selectedOrderId,
  setMode,
  variant,
}: OrderFormBaseProps) {
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const resolvedOrderId = selectedOrderId ?? null;
  const isEditing = variant === 'edit';
  const {
    askForConfirmation,
    closeConfirmation,
    confirm,
    confirmation,
    isConfirming,
  } = useConfirmationDialog();

  const orderDetails = useOrderDetails(isEditing ? resolvedOrderId : null);
  const catalog = useOrderCatalog();

  const initialValues =
    isEditing && orderDetails.order
      ? mapOrderDetailToFormValues(orderDetails.order)
      : {
          ...getEmptyFormValues(),
          stateId: DEFAULT_NEW_ORDER_STATE_ID,
        };

  const {
    addProduct,
    hasUnsavedChanges,
    removeLine,
    setCustomer,
    setEstimatedDelivery,
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
    resetKey: isEditing ? `edit-${orderDetails.order?.id ?? 'loading'}` : `create-${defaultStateId ?? 'none'}`,
    validProductIds: catalog.products.map((product) => product.id),
    variant,
  });

  useEffect(() => {
    onUnsavedChangesChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onUnsavedChangesChange]);

  const catalogLoading = catalog.productsLoading;
  const catalogError = catalog.productsError;

  const handleRetryCatalog = async () => {
    await Promise.all([catalog.refreshCategories(), catalog.refreshProducts()]);
  };

  const handleSubmit = async () => {
    askForConfirmation({
      confirmLabel: isEditing ? 'Guardar cambios' : 'Crear orden',
      message: isEditing
        ? 'Quieres guardar los cambios realizados en esta orden?'
        : 'Quieres crear esta orden con los datos cargados?',
      onConfirm: async () => {
        const wasSuccessful = await submit();
        if (wasSuccessful) {
          onUnsavedChangesChange?.(false);
          setMode('default');
        }
      },
      title: isEditing ? 'Confirmar edicion' : 'Confirmar creacion',
    });
  };

  const handleCancel = () => {
    if (!hasUnsavedChanges) {
      onUnsavedChangesChange?.(false);
      setMode('default');
      return;
    }

    askForConfirmation({
      cancelLabel: isEditing ? 'Continuar editando' : 'Continuar creando',
      confirmLabel: 'Descartar cambios',
      message: isEditing
        ? 'Hay cambios sin guardar. Quieres seguir editando esta orden o descartar los cambios?'
        : 'Hay cambios sin guardar. Quieres seguir creando esta orden o descartar los cambios?',
      onConfirm: () => {
        onUnsavedChangesChange?.(false);
        setMode('default');
      },
      title: 'Descartar cambios',
      tone: 'danger',
    });
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
      <div className="flex flex-1 flex-col gap-5 p-4 sm:p-5 xl:h-full xl:max-h-full xl:min-h-0 xl:flex-row">
        <div className="flex flex-1 min-h-0 flex-col gap-6 sm:gap-8">
          {/* titulo */}
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
                {isEditing ? 'Editar orden' : 'Nueva orden'}
              </h2>
            </div>

            <button type="button" onClick={handleCancel} className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50" >
              Cancelar
            </button>
          </div>

          <div className="grid gap-6">
            {/* cliente */}
            <div className=''>
              <h3 className="mb-3 text-xl font-semibold text-neutral-900">Cliente</h3>
              <button type="button" disabled={isEditing} onClick={() => { if (!isEditing) { setIsClientModalOpen(true); } }} className={`flex w-full items-center gap-3 rounded-3xl border px-5 py-4 text-left ${isEditing ? 'cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-500' : 'border-transparent bg-white text-neutral-900 shadow-sm transition hover:border-neutral-300' }`} >
                <Image src="/profile.svg" alt="profile" width={24} height={24} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium">
                    {values.customer?.name ?? 'Seleccionar cliente'}
                  </p>
                  {isEditing ? (
                    <p className="text-sm text-neutral-500">
                      El cliente no se puede modificar durante la edición.
                    </p>
                  ) : values.customer?.whatsapp ? (
                    <p className="text-sm text-neutral-500">{values.customer.whatsapp}</p>
                  ) : null}
                </div>
              </button>
            </div>
            
            <div className=''>
              <h3 className="mb-3 text-xl font-semibold text-neutral-900">Entrega estimada</h3>
              <input
                type="datetime-local"
                value={values.estimatedDelivery}
                onChange={(event) => setEstimatedDelivery(event.target.value)}
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 shadow-sm outline-none transition focus:border-neutral-400"
              />
            </div>

            <div className=''>
              <h3 className="mb-3 text-xl font-semibold text-neutral-900">Metodo de pago</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {PAYMENT_METHODS.map((method) => (
                  <button key={method.value} type="button" onClick={() => setPaymentMethod(method.value)} className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${values.paymentMethod === method.value ? 'bg-regal-gris-hover text-white' : 'bg-white text-neutral-700 shadow-sm hover:bg-neutral-100' }`} >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* <div className="min-h-0 flex-1"> */}
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
          {/* </div> */}
        </div>

        {/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */}
        <div className="flex min-h-0 flex-1 flex-col rounded-3xl bg-white p-4 shadow-sm sm:p-5">
          <div className="flex min-h-0 flex-col gap-5 xl:h-full">
            {/* Titulo */}
            <div className=''>
              <h3 className="text-xl font-bold text-neutral-900 sm:text-2xl">Resumen</h3>
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
            {/* Resumen cliente */}
            <div className="flex flex-col gap-3 rounded-2xl bg-neutral-100 p-4 text-sm text-neutral-600 ">
              <div className="flex items-center justify-between gap-4">
                <span>Cliente</span>
                <span className="font-medium text-neutral-900">
                  {values.customer?.name ?? 'Sin seleccionar'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Entrega</span>
                <span className="font-medium text-neutral-900">
                  {values.estimatedDelivery
                    ? new Intl.DateTimeFormat('es-AR', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(values.estimatedDelivery))
                    : 'Sin definir'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Pago</span>
                <span className="font-medium text-neutral-900">
                  {PAYMENT_METHODS.find((method) => method.value === values.paymentMethod)?.label ?? values.paymentMethod}
                </span>
              </div>
            </div>

            {/* Resumen productos */}
            <div className="min-h-0 overflow-y-auto xl:h-full xl:pr-1">
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

                        <button type="button" onClick={() => removeLine(line.productId)} className="text-sm text-red-500 transition hover:text-red-700" >
                          Quitar
                        </button>
                      </div>

                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => updateLineQuantity(line.productId, line.quantity - 1)} className="h-9 w-9 rounded-full bg-neutral-100 text-lg text-neutral-700" >
                            -
                          </button>
                          <span className="min-w-8 text-center font-medium text-neutral-900">
                            {line.quantity}
                          </span>
                          <button type="button" onClick={() => updateLineQuantity(line.productId, line.quantity + 1)} className="h-9 w-9 rounded-full bg-neutral-100 text-lg text-neutral-700" >
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
            {/* Total y boton "crear orden" */}
            <div className="grid gap-4 border-t border-neutral-200 pt-4">
              <div className="flex items-center justify-between gap-4 text-lg">
                <span className="font-medium text-neutral-600">Total</span>
                <span className="text-2xl font-bold text-neutral-900">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              <button type="button" onClick={() => void handleSubmit()} disabled={submitting || catalogLoading} className="rounded-2xl bg-regal-gris-hover px-5 py-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50" >
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
        onCreateRequest={() => setIsCreateClientModalOpen(true)}
        onSelect={setCustomer}
        selectedCustomerId={values.customer?.id ?? null}
      />
      <CreateClientModal
        isOpen={!isEditing && isCreateClientModalOpen}
        onClose={() => setIsCreateClientModalOpen(false)}
        onCreated={(customer) => {
          setCustomer(customer);
          setIsCreateClientModalOpen(false);
        }}
      />
      <ConfirmationDialog
        cancelLabel={confirmation?.cancelLabel}
        confirmLabel={confirmation?.confirmLabel}
        isConfirming={isConfirming}
        isOpen={confirmation !== null}
        message={confirmation?.message ?? ''}
        onCancel={closeConfirmation}
        onConfirm={() => void confirm()}
        title={confirmation?.title}
        tone={confirmation?.tone}
      />
    </>
  );
}
