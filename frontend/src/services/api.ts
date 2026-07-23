import axios from "axios";
import type {
  Customer,
  CustomerCreate,
  CustomerUpdate,
  Note,
  NoteCreate,
  NoteUpdate,
  AISummary,
} from "../types";

const API_BASE_URL = "http://localhost:8000";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const customerApi = {
  getAll: async (): Promise<Customer[]> => {
    const response = await client.get<Customer[]>("/customers");
    return response.data;
  },

  getById: async (id: number): Promise<Customer> => {
    const response = await client.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  create: async (data: CustomerCreate): Promise<Customer> => {
    const response = await client.post<Customer>("/customers", data);
    return response.data;
  },

  update: async (id: number, data: CustomerUpdate): Promise<Customer> => {
    const response = await client.put<Customer>(`/customers/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await client.delete(`/customers/${id}`);
  },
};

export const noteApi = {
  getByCustomerId: async (customerId: number): Promise<Note[]> => {
    const response = await client.get<Note[]>(`/customers/${customerId}/notes`);
    return response.data;
  },

  create: async (customerId: number, data: NoteCreate): Promise<Note> => {
    const response = await client.post<Note>(`/customers/${customerId}/notes`, data);
    return response.data;
  },

  update: async (noteId: number, data: NoteUpdate): Promise<Note> => {
    const response = await client.put<Note>(`/notes/${noteId}`, data);
    return response.data;
  },

  delete: async (noteId: number): Promise<void> => {
    await client.delete(`/notes/${noteId}`);
  },
};

export const aiApi = {
  getSummary: async (customerId: number): Promise<AISummary | null> => {
    try {
      const response = await client.get<AISummary>(`/customers/${customerId}/ai-summary`);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  },

  generateSummary: async (customerId: number): Promise<AISummary> => {
    const response = await client.post<AISummary>(`/customers/${customerId}/ai-summary/generate`);
    return response.data;
  },
};

export default client;
