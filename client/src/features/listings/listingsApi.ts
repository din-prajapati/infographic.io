import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ListingProfile, ListingRecord, SavedProperty } from '@shared/listingWorkflow';
import { getApiUrl } from '@/lib/api';
import { apiRequest } from '@/lib/queryClient';
import { listingProfilesApi, propertiesApi } from '@/lib/listingApi';
import { useAuth } from '@/lib/auth';
import type { DraftFile } from './draftMedia';

/** Mirrors api/src/modules/properties/properties.service.ts — SavedPropertySummary. */
export interface SavedPropertySummary {
  id: string; version: number; name: string; address: string; status: string;
  transaction: 'sale' | 'rent'; currency: string; amount: string | null; rentalPeriod: ListingRecord['property']['rentalPeriod']; country: string;
  beds: string; baths: string; area: string; areaUnit: string;
  coverUrl: string | null; photoCount: number; designCount?: number; updatedAt: string;
}
export interface PropertyDesignSummary { id: string; name: string; thumbnail: string | null; createdAt: string; updatedAt: string }
export interface Paginated<T> { items: T[]; nextCursor: string | null }

const query = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
  const text = search.toString();
  return text ? `?${text}` : '';
};
export const workspaceApi = {
  library: (search: string, cursor?: string) => apiRequest<Paginated<SavedPropertySummary>>(getApiUrl(`/properties/library${query({ search: search || undefined, cursor, limit: '24' })}`)),
  designs: (propertyId: string, cursor?: string) => apiRequest<Paginated<PropertyDesignSummary> & { total: number }>(getApiUrl(`/properties/${encodeURIComponent(propertyId)}/designs${query({ cursor, limit: '24' })}`)),
};

/** Query keys always include the signed-in user, so one account never sees another's cached records. */
export function useListingKeys() {
  const { user } = useAuth();
  const owner = user?.id ?? 'anonymous';
  return {
    owner,
    library: (search: string) => ['workspace', owner, 'library', search] as const,
    libraryAll: ['workspace', owner, 'library'] as const,
    property: (id: string) => ['workspace', owner, 'property', id] as const,
    designs: (id: string) => ['workspace', owner, 'property-designs', id] as const,
    profile: ['workspace', owner, 'listing-profile'] as const,
  };
}

export function usePropertyLibrary(search: string) {
  const keys = useListingKeys();
  return useInfiniteQuery({
    queryKey: keys.library(search),
    queryFn: ({ pageParam }) => workspaceApi.library(search, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: last => last.nextCursor ?? undefined,
  });
}
export function useProperty(id: string) {
  const keys = useListingKeys();
  return useQuery({ queryKey: keys.property(id), queryFn: () => propertiesApi.get(id), retry: (count, error) => (error as { status?: number }).status !== 404 && count < 2 });
}
export function usePropertyDesigns(id: string) {
  const keys = useListingKeys();
  return useInfiniteQuery({
    queryKey: keys.designs(id),
    queryFn: ({ pageParam }) => workspaceApi.designs(id, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: last => last.nextCursor ?? undefined,
  });
}
export function useListingProfile() {
  const keys = useListingKeys();
  return useQuery({ queryKey: keys.profile, queryFn: () => listingProfilesApi.get() });
}

/** Create or update. Updates send the expected version; a 409 surfaces to the caller and is never retried. */
export function useSaveProperty() {
  const client = useQueryClient();
  const keys = useListingKeys();
  return useMutation({
    mutationFn: ({ record, id, expectedVersion, files }: { record: ListingRecord; id?: string; expectedVersion?: number; files?: DraftFile[] }) => propertiesApi.save(record, { id, expectedVersion, files }),
    onSuccess: (saved: SavedProperty) => {
      client.setQueryData(keys.property(saved.id), saved);
      void client.invalidateQueries({ queryKey: keys.libraryAll });
    },
  });
}
export function useSaveListingProfile() {
  const client = useQueryClient();
  const keys = useListingKeys();
  return useMutation({
    mutationFn: ({ record, expectedVersion, files }: { record: ListingProfile['record']; expectedVersion: number; files?: DraftFile[] }) => listingProfilesApi.save(record, expectedVersion, files),
    onSuccess: (saved: ListingProfile) => client.setQueryData(keys.profile, saved),
  });
}

export const isConflict = (error: unknown) => (error as { status?: number } | null)?.status === 409;
export const isNotFound = (error: unknown) => (error as { status?: number } | null)?.status === 404;
