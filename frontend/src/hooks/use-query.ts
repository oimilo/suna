'use client';

import {
  focusManager,
  onlineManager,
  useQuery,
  useMutation,
  type QueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import { handleApiError, type ErrorContext } from '@/lib/error-handler';

type QueryKeyValue = readonly unknown[];
type QueryKeyFunction = (...args: any[]) => QueryKeyValue;
type QueryKeyItem = QueryKeyValue | QueryKeyFunction;

export const createQueryKeys = <T extends Record<string, QueryKeyItem>>(keys: T): T => keys;

export function createQueryHook<
  TData,
  TError = Error,
  TQueryKey extends QueryKey = QueryKey,
>(
  queryKey: TQueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<
    UseQueryOptions<TData, TError, TData, TQueryKey>,
    'queryKey' | 'queryFn'
  >,
) {
  return (
    customOptions?: Omit<
      UseQueryOptions<TData, TError, TData, TQueryKey>,
      'queryKey' | 'queryFn'
    >,
  ) => {
    return useQuery<TData, TError, TData, TQueryKey>({
      queryKey,
      queryFn,
      ...options,
      ...customOptions,
    });
  };
}

export function createMutationHook<
  TData,
  TVariables,
  TError = Error,
  TContext = unknown,
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    'mutationFn'
  > & {
    errorContext?: ErrorContext;
  },
) {
  return (
    customOptions?: Omit<
      UseMutationOptions<TData, TError, TVariables, TContext>,
      'mutationFn'
    > & {
      errorContext?: ErrorContext;
    },
  ) => {
    const { errorContext: baseErrorContext, ...baseOptions } = options || {};
    const { errorContext: customErrorContext, ...customMutationOptions } = customOptions || {};
    
    return useMutation<TData, TError, TVariables, TContext>({
      mutationFn,
      onError: (error, variables, context) => {
        const errorContext = customErrorContext || baseErrorContext;
        if (!customMutationOptions?.onError && !baseOptions?.onError) {
          handleApiError(error, errorContext);
        }
        baseOptions?.onError?.(error, variables, context);
        customMutationOptions?.onError?.(error, variables, context);
      },
      ...baseOptions,
      ...customMutationOptions,
    });
  };
}

export function useStableQueryOptions<
  TQueryFnData,
  TError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
) {
  return useMemo(() => options, [options]);
}

export function useStableMutationOptions<TData, TError, TVariables, TContext>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
) {
  return useMemo(() => options, [options]);
}

export function setReactQueryOnline(isOnline: boolean) {
  onlineManager.setOnline(isOnline);
}

export function setReactQueryFocused(isFocused: boolean) {
  focusManager.setFocused(isFocused);
}

export { QueryClient };
