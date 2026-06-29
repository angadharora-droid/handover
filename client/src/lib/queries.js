import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

// ---- Reads ----------------------------------------------------------------

export function useChecklist() {
  return useQuery({
    queryKey: ['checklist'],
    queryFn: () => api.get('/checklist').then((r) => r.data),
    staleTime: Infinity, // the template never changes during a session
  });
}

export function useHandover() {
  return useQuery({
    queryKey: ['handover'],
    queryFn: () => api.get('/handover').then((r) => r.data.handover),
  });
}

export function useEntries() {
  return useQuery({
    queryKey: ['entries'],
    queryFn: () => api.get('/entries').then((r) => r.data.entries),
  });
}

export function useFinalSignoff() {
  return useQuery({
    queryKey: ['finalSignoff'],
    queryFn: () => api.get('/signoffs/final').then((r) => r.data),
  });
}

export function useUsers({ enabled = true } = {}) {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data.users),
    enabled,
  });
}

export function useAudit(params = {}) {
  const { area = '', userId = '' } = params;
  return useQuery({
    queryKey: ['audit', area, userId],
    queryFn: () =>
      api
        .get('/audit', { params: { area: area || undefined, userId: userId || undefined } })
        .then((r) => r.data.logs),
  });
}

export function useDailyLog() {
  return useQuery({
    queryKey: ['audit-daily'],
    queryFn: () => api.get('/audit/daily').then((r) => r.data.days),
  });
}

export function useCustomItems() {
  return useQuery({
    queryKey: ['customItems'],
    queryFn: () => api.get('/custom-items').then((r) => r.data.items),
  });
}

// Photo metadata + thumbnails for one area/room (the client groups by itemId).
export function usePhotos(area, room) {
  return useQuery({
    queryKey: ['photos', area, room || null],
    queryFn: () =>
      api
        .get('/photos', { params: { area, room: room || undefined } })
        .then((r) => r.data.photos),
    enabled: !!area,
  });
}

// Full image (data URL) for a single photo — loaded only when viewed.
export function usePhotoFull(id) {
  return useQuery({
    queryKey: ['photo', id],
    queryFn: () => api.get(`/photos/${id}`).then((r) => r.data.photo),
    enabled: !!id,
    staleTime: Infinity, // image bytes never change once uploaded
  });
}

// ---- Writes ---------------------------------------------------------------

export function useSaveEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.put('/entries', body).then((r) => r.data.entry),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entries'] }),
  });
}

export function useFinalise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/signoffs/final', body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finalSignoff'] });
      qc.invalidateQueries({ queryKey: ['handover'] });
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/users', body).then((r) => r.data.user),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => api.patch(`/users/${id}`, body).then((r) => r.data.user),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useAssignArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ area, userIds }) =>
      api.put(`/assignments/${encodeURIComponent(area)}`, { userIds }).then((r) => r.data.users),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useAddCustomItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/custom-items', body).then((r) => r.data.item),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customItems'] }),
  });
}

export function useDeleteCustomItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/custom-items/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customItems'] });
      qc.invalidateQueries({ queryKey: ['entries'] });
      qc.invalidateQueries({ queryKey: ['photos'] });
    },
  });
}

export function useUploadPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/photos', body).then((r) => r.data.photo),
    onSuccess: (photo) =>
      qc.invalidateQueries({ queryKey: ['photos', photo.area, photo.room || null] }),
  });
}

export function useDeletePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/photos/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['photos'] }),
  });
}
