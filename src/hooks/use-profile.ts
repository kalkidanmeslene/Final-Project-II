"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/fetch-json";
import type { UserProfile } from "@/lib/profile/profile.types";

export const profileQueryKey = ["profile"] as const;

type ProfileResponse = { profile: UserProfile };
type UpdateProfileInput = {
  fullName: string;
  email: string;
  phoneNumber: string;
  preferredLanguage: string;
  bio: string;
};
type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

async function fetchProfile() {
  const data = await fetchJson<ProfileResponse>("/api/profile");
  return data.profile;
}

export function useProfile() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: profileQueryKey,
    queryFn: fetchProfile,
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      fetchJson<ProfileResponse>("/api/profile", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: profileQueryKey });
      const previous = queryClient.getQueryData<UserProfile>(profileQueryKey);
      if (previous) {
        queryClient.setQueryData<UserProfile>(profileQueryKey, {
          ...previous,
          fullName: input.fullName,
          email: input.email || null,
          phoneNumber: input.phoneNumber || null,
          preferredLanguage: input.preferredLanguage,
          bio: input.bio || null,
          updatedAt: new Date().toISOString(),
        });
      }
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(profileQueryKey, context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(profileQueryKey, data.profile);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      fetchJson<{ message: string }>("/api/profile/password", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      return fetchJson<ProfileResponse>("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
    },
    onMutate: async (file) => {
      await queryClient.cancelQueries({ queryKey: profileQueryKey });
      const previous = queryClient.getQueryData<UserProfile>(profileQueryKey);
      const previewUrl = URL.createObjectURL(file);
      if (previous) {
        queryClient.setQueryData<UserProfile>(profileQueryKey, {
          ...previous,
          profilePictureUrl: previewUrl,
        });
      }
      return { previous, previewUrl };
    },
    onError: (_err, _file, context) => {
      if (context?.previewUrl) URL.revokeObjectURL(context.previewUrl);
      if (context?.previous) {
        queryClient.setQueryData(profileQueryKey, context.previous);
      }
    },
    onSuccess: (data, _file, context) => {
      if (context?.previewUrl) URL.revokeObjectURL(context.previewUrl);
      queryClient.setQueryData(profileQueryKey, data.profile);
    },
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateProfile: updateMutation,
    changePassword: passwordMutation,
    uploadAvatar: avatarMutation,
  };
}
