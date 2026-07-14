import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createAuthUser,
  getAuthUsers,
  getAuthUser,
  loginUser,
  refreshAccessToken,
} from "@/services/api";
import { useAuthStore } from "@/store/authStore";

export function useLogin() {
  return useMutation({
    mutationFn: ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => loginUser(email, password),
  });
}

export function useCreateAccount() {
  return useMutation({
    mutationFn: createAuthUser,
  });
}

export function useAuthUser() {
  const accessToken = useAccessToken();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const storedUser = useAuthStore((state) => state.user);

  const query = useQuery({
    queryKey: ["auth-user"],
    queryFn: () => getAuthUser(),
    enabled: hasHydrated && !!accessToken && !storedUser,
    initialData: storedUser ?? undefined,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query,
    hasAccessToken: !!accessToken,
  };
}

export function useAccessToken() {
  return useAuthStore((state) => state.accessToken);
}

export function useAuthUsers() {
  return useQuery({
    queryKey: ["auth-users"],
    queryFn: getAuthUsers,
    staleTime: 1000 * 60 * 5,
  });
}

export function useRefreshToken() {
  return useMutation({
    mutationFn: (refreshToken: string) =>
      refreshAccessToken(refreshToken),
  });
}
