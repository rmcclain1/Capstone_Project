import { api } from '@/lib/api';

export async function fetchPantryItems() {
  const { data } = await api.get('/api/v1/pantries');
  return data;
}
export async function addPantryItem(name: string, quantity: number) {
  const { data } = await api.post('/api/v1/pantries', { name, quantity });
  return data;
}

export async function updatePantryItem(id: number, name: string, quantity: number) {
  const { data } = await api.put(`/api/v1/pantries/${id}`, { name, quantity });
  return data;
}
export async function deletePantryItem(id: number) {
  const { data } = await api.delete(`/api/v1/pantries/${id}`);
  return data;
}
