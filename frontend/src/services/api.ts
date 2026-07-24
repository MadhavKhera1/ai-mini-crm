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

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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

  importCustomers: async (file: File): Promise<{
    total: number;
    imported: number;
    skipped: number;
    failed: number;
    errors: string[];
  }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await client.post("/customers/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
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

  importPreview: async (
    customerId: number,
    file: File
  ): Promise<{
    overview: {
      meeting_summary: string;
      key_topics: string[];
      action_items: string[];
      overall_sentiment: string;
    };
    notes: {
      content: string;
      confidence: number;
      is_duplicate: boolean;
    }[];
  }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await client.post(`/customers/${customerId}/notes/import-preview`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  importConfirm: async (customerId: number, notes: string[]): Promise<{ imported: number }> => {
    const response = await client.post(`/customers/${customerId}/notes/import-confirm`, { notes });
    return response.data;
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
