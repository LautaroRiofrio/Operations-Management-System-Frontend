'use client'

import { useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '@/app/services/adminServices';
import {
  createOrderWorkflow,
  updateOrderWorkflow,
} from '@/app/services/orderFormServices';
import type {
  OrderCustomerOption,
  OrderFormLine,
  OrderFormValues,
  OrderMutationInput,
} from '@/types';

type UseOrderFormParams = {
  initialValues: OrderFormValues;
  orderId: number | null;
  resetKey: string;
  validProductIds: number[];
  variant: 'create' | 'edit';
};

type UseOrderFormResult = {
  addProduct: (product: {
    id: number;
    id_categoria: number;
    nombre: string;
    precio: number;
  }) => void;
  removeLine: (productId: number) => void;
  setCustomer: (customer: OrderCustomerOption | null) => void;
  setPaymentMethod: (paymentMethod: string) => void;
  submit: () => Promise<boolean>;
  submitError: string | null;
  submitSuccess: string | null;
  submitting: boolean;
  totalAmount: number;
  updateLineQuantity: (productId: number, nextQuantity: number) => void;
  values: OrderFormValues;
};

function buildMutationInput(values: OrderFormValues): OrderMutationInput | null {
  if (!values.customer) {
    return null;
  }

  const lines = values.lines
    .filter((line) => line.quantity > 0 && Number.isFinite(line.productId))
    .map((line) => ({
      lineId: line.lineId,
      productId: line.productId,
      quantity: line.quantity,
    }));

  if (!values.paymentMethod || lines.length === 0) {
    return null;
  }

  return {
    customerId: values.customer.id,
    paymentMethod: values.paymentMethod,
    lines,
  };
}

export function useOrderForm({
  initialValues,
  orderId,
  resetKey,
  validProductIds,
  variant,
}: UseOrderFormParams): UseOrderFormResult {
  const [values, setValues] = useState<OrderFormValues>(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const previousResetKeyRef = useRef(resetKey);
  const persistedValuesRef = useRef<OrderFormValues>(initialValues);

  useEffect(() => {
    if (previousResetKeyRef.current === resetKey) {
      return;
    }

    previousResetKeyRef.current = resetKey;
    setValues(initialValues);
    persistedValuesRef.current = initialValues;
    setSubmitError(null);
    setSubmitSuccess(null);
  }, [initialValues, resetKey]);

  const totalAmount = values.lines.reduce((total, line) => {
    const lineTotal = (line.unitPrice ?? 0) * line.quantity;
    return total + lineTotal;
  }, 0);

  const setCustomer = (customer: OrderCustomerOption | null) => {
    setValues((currentValues) => ({
      ...currentValues,
      customer,
    }));
  };

  const setPaymentMethod = (paymentMethod: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      paymentMethod,
    }));
  };

  const addProduct = (product: {
    id: number;
    id_categoria: number;
    nombre: string;
    precio: number;
  }) => {
    setValues((currentValues) => {
      const existingLine = currentValues.lines.find((line) => line.productId === product.id);

      if (existingLine) {
        return {
          ...currentValues,
          lines: currentValues.lines.map((line) =>
            line.productId === product.id
              ? { ...line, quantity: line.quantity + 1 }
              : line,
          ),
        };
      }

      const nextLine: OrderFormLine = {
        lineId: null,
        productId: product.id,
        productName: product.nombre,
        quantity: 1,
        unitPrice: typeof product.precio === 'number' ? product.precio : null,
        categoryId: product.id_categoria ?? null,
      };

      return {
        ...currentValues,
        lines: [...currentValues.lines, nextLine],
      };
    });
  };

  const updateLineQuantity = (productId: number, nextQuantity: number) => {
    setValues((currentValues) => ({
      ...currentValues,
      lines: currentValues.lines
        .map((line) =>
          line.productId === productId
            ? { ...line, quantity: Math.max(0, Math.floor(nextQuantity)) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    }));
  };

  const removeLine = (productId: number) => {
    setValues((currentValues) => ({
      ...currentValues,
      lines: currentValues.lines.filter((line) => line.productId !== productId),
    }));
  };

  const submit = async () => {
    const mutationInput = buildMutationInput(values);

    if (!mutationInput) {
      setSubmitSuccess(null);
      setSubmitError('Completa cliente, metodo de pago y al menos un producto.');
      return false;
    }

    if (!mutationInput.customerId) {
      setSubmitSuccess(null);
      setSubmitError('La orden debe tener un cliente valido.');
      return false;
    }

    const validProductsSet = new Set(validProductIds);
    if (mutationInput.lines.some((line) => !validProductsSet.has(line.productId) || line.quantity <= 0)) {
      setSubmitSuccess(null);
      setSubmitError('Hay lineas con productos invalidos. Revisa el pedido e intenta otra vez.');
      return false;
    }

    if (variant === 'edit' && orderId === null) {
      setSubmitSuccess(null);
      setSubmitError('No hay una orden seleccionada para editar.');
      return false;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      if (variant === 'edit' && orderId !== null) {
        const previousMutationInput = buildMutationInput(persistedValuesRef.current);

        if (!previousMutationInput) {
          throw new Error('No se pudo reconstruir el estado anterior de la orden.');
        }

        await updateOrderWorkflow(orderId, {
          current: mutationInput,
          previous: previousMutationInput,
        });
        persistedValuesRef.current = values;
        setSubmitSuccess('La orden se actualizo correctamente.');
      } else {
        await createOrderWorkflow(mutationInput);
        setSubmitSuccess('La orden se creo correctamente.');
        setValues(initialValues);
        persistedValuesRef.current = initialValues;
      }

      window.dispatchEvent(new CustomEvent('orders:changed'));
      return true;
    } catch (requestError) {
      setSubmitSuccess(null);
      setSubmitError(
        getApiErrorMessage(
          requestError,
          variant === 'edit'
            ? 'No se pudo actualizar la orden y sus lineas.'
            : 'No se pudo crear la orden y sus lineas.',
        ),
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
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
  };
}
