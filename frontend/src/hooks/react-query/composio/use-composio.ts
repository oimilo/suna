'use client';

import { useEffect, useState } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  composioApi,
  type ComposioToolkitsResponse,
  type ComposioToolsResponse,
  type CompositoCategoriesResponse,
  type CreateComposioProfileRequest,
  type CreateComposioProfileResponse,
  type DetailedComposioToolkitResponse,
} from './utils';
import { composioKeys } from './keys';

export const useComposioCategories = () => {
  return useQuery({
    queryKey: composioKeys.categories(),
    queryFn: async (): Promise<CompositoCategoriesResponse> => {
      const result = await composioApi.getCategories();
      return result;
    },
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });
};

export const useComposioToolkits = (search?: string, category?: string) => {
  return useQuery({
    queryKey: composioKeys.toolkits(search, category),
    queryFn: async (): Promise<ComposioToolkitsResponse> => {
      const result = await composioApi.getToolkits(search, category);
      return result;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useComposioToolkitsInfinite = (search?: string, category?: string) => {
  return useInfiniteQuery({
    queryKey: ['composio', 'toolkits', 'infinite', search, category],
    queryFn: async ({ pageParam }): Promise<ComposioToolkitsResponse> => {
      const result = await composioApi.getToolkits(search, category, pageParam);
      return result;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor || undefined,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useComposioToolkitIcon = (
  toolkitSlug: string,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: ['composio', 'toolkit-icon', toolkitSlug],
    queryFn: async (): Promise<{ success: boolean; icon_url?: string }> => {
      const result = await composioApi.getToolkitIcon(toolkitSlug);
      return result;
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!toolkitSlug,
    staleTime: 60 * 60 * 1000,
    retry: 2,
  });
};

export const useComposioToolkitDetails = (
  toolkitSlug: string,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: ['composio', 'toolkit-details', toolkitSlug],
    queryFn: async (): Promise<DetailedComposioToolkitResponse> => {
      const result = await composioApi.getToolkitDetails(toolkitSlug);
      return result;
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!toolkitSlug,
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });
};

export const useComposioTools = (
  toolkitSlug: string,
  options?: { enabled?: boolean; limit?: number },
) => {
  return useQuery({
    queryKey: ['composio', 'tools', toolkitSlug, options?.limit],
    queryFn: async (): Promise<ComposioToolsResponse> => {
      const result = await composioApi.getTools(toolkitSlug, options?.limit);
      return result;
    },
    enabled: (options?.enabled ?? true) && !!toolkitSlug,
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });
};

export const useCreateComposioProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      request: CreateComposioProfileRequest,
    ): Promise<CreateComposioProfileResponse> => {
      return await composioApi.createProfile(request);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: composioKeys.profiles.all() });
      toast.success(`Connected to ${variables.profile_name}!`);

      if (data.redirect_url) {
        window.open(
          data.redirect_url,
          '_blank',
          'width=600,height=700,resizable=yes,scrollbars=yes',
        );
      }
    },
    onError: (error) => {
      console.error('Failed to create Composio profile:', error);
      toast.error(error.message || 'Failed to create profile');
    },
  });
};

export const useInvalidateComposioQueries = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: composioKeys.all });
  };
};

export const useCheckProfileNameAvailability = (
  toolkitSlug: string,
  profileName: string,
  options?: {
    enabled?: boolean;
    debounceMs?: number;
  },
) => {
  const [debouncedName, setDebouncedName] = useState(profileName);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(profileName);
    }, options?.debounceMs || 500);

    return () => clearTimeout(timer);
  }, [profileName, options?.debounceMs]);

  return useQuery({
    queryKey: ['composio', 'profile-name-availability', toolkitSlug, debouncedName],
    queryFn: async () => {
      if (!debouncedName || debouncedName.trim().length < 1) {
        return {
          available: true,
          message: '',
          suggestions: [],
        };
      }

      const response = await composioApi.checkProfileNameAvailability(
        toolkitSlug,
        debouncedName,
      );
      return response;
    },
    enabled:
      options?.enabled !== false &&
      !!toolkitSlug &&
      !!debouncedName &&
      debouncedName.trim().length > 0,
    staleTime: 30_000,
    gcTime: 60_000,
  });
};
