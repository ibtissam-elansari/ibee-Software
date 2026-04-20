// src/hooks/useMe.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth';

export function useMe() {
  return useQuery({
    queryKey : ['me'],
    queryFn  : authApi.getMe,
    staleTime: 60_000,
    retry    : 1,
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => authApi.updateUser(id, data),
    onSuccess  : () => {
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
