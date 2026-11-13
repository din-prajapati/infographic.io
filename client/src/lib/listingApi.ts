import type { ListingProfile, ListingRecord, SavedProperty } from '@shared/listingWorkflow';
import { getApiUrl } from './api';
import { apiRequest } from './queryClient';

export const propertiesApi = {
  list: (search = '') => apiRequest<SavedProperty[]>(getApiUrl(`/properties?search=${encodeURIComponent(search)}`)),
  get: (id: string) => apiRequest<SavedProperty>(getApiUrl(`/properties/${encodeURIComponent(id)}`)),
  save: (record: ListingRecord, options: { id?: string; expectedVersion?: number } = {}) => {
    if (options.id && !options.expectedVersion) return Promise.reject(new Error('Reload the saved property before updating'));
    return apiRequest<SavedProperty>(getApiUrl(options.id ? `/properties/${encodeURIComponent(options.id)}` : '/properties'), {
      method: options.id ? 'PUT' : 'POST',
      body: JSON.stringify(options.id ? { record, expectedVersion: options.expectedVersion } : { record }),
    });
  },
};
export const listingProfilesApi = {
  get: () => apiRequest<ListingProfile>(getApiUrl('/listing-profiles')),
  save: (record: ListingProfile['record'], expectedVersion: number) => apiRequest<ListingProfile>(getApiUrl('/listing-profiles'), {
    method: 'PUT', body: JSON.stringify({ record, expectedVersion }),
  }),
};
