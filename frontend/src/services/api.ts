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
  getSummary: async (customerId: number, customerName: string, notes: Note[]): Promise<AISummary> => {
    try {
      // Try hitting the backend API
      const response = await client.get<AISummary>(`/customers/${customerId}/ai-summary`);
      return response.data;
    } catch {
      // Fallback: Generate custom mock AI summary on the client side if the backend is not yet updated
      return generateMockAISummary(customerName, notes);
    }
  },
};

// Generates dynamic mock summaries on the frontend in case the backend Gemini API is not yet active
function generateMockAISummary(customerName: string, notes: Note[]): AISummary {
  if (notes.length === 0) {
    return {
      summary: `${customerName} is a newly added contact. Add conversation logs or notes to enable AI analysis and recommendations.`,
      insights: [
        "No historical interactions found.",
        "Add a note summarizing your last conversation or next steps.",
      ],
      action_items: [
        "Reach out to establish contact.",
        "Verify contact details and role in the organization.",
      ],
      last_updated: new Date().toISOString(),
    };
  }

  // Combine note texts to detect keywords
  const combinedNotes = notes.map((n) => n.content.toLowerCase()).join(" ");

  const insights: string[] = [];
  const actionItems: string[] = [];
  let summary = "";

  if (combinedNotes.includes("budget") || combinedNotes.includes("price") || combinedNotes.includes("cost")) {
    insights.push("Customer is budget-sensitive and asked about pricing structure.");
    actionItems.push("Prepare a custom pricing proposal with tier options.");
  }

  if (combinedNotes.includes("competitor") || combinedNotes.includes("alternative")) {
    insights.push("Evaluating competitors. Looking for custom feature support.");
    actionItems.push("Send competitor comparison document highlighting our unique selling points.");
  }

  if (combinedNotes.includes("decision maker") || combinedNotes.includes("approve")) {
    insights.push("Needs approval from stakeholders. Not the sole decision maker.");
    actionItems.push("Schedule a demo for the wider team and leadership.");
  }

  if (combinedNotes.includes("demo") || combinedNotes.includes("showed")) {
    insights.push("Completed product demo. Showed high interest in automation capabilities.");
    actionItems.push("Follow up on specific questions raised during the product demo.");
  }

  // Default insights and action items
  if (insights.length === 0) {
    insights.push("Regular communication active. Relationship shows stable progression.");
    insights.push("Customer is evaluating the CRM for internal process optimization.");
  }
  if (actionItems.length === 0) {
    actionItems.push("Schedule a bi-weekly catch-up call to review progress.");
    actionItems.push("Identify their main technical bottlenecks to offer solutions.");
  }

  summary = `${customerName} is actively engaged. Based on ${notes.length} log(s), they are in the process of evaluating our solutions. ${
    insights.join(" ")
  }`;

  return {
    summary,
    insights,
    action_items: actionItems,
    last_updated: new Date().toISOString(),
  };
}

export default client;
