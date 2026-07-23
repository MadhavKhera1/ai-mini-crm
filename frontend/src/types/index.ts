export interface Customer {
  id: number;
  name: string;
  email: string;
  company: string;
  phone: string;
  status: "Lead" | "Contacted" | "Opportunity" | "Customer" | "Closed";
  created_at: string;
  updated_at: string;
}

export interface CustomerCreate {
  name: string;
  email: string;
  company: string;
  phone: string;
  status: string;
}

export interface CustomerUpdate {
  name: string;
  email: string;
  company: string;
  phone: string;
  status: string;
}

export interface Note {
  id: number;
  customer_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface NoteCreate {
  content: string;
}

export interface NoteUpdate {
  content: string;
}

export interface AISummary {
  id?: number;
  customer_id?: number;
  summary: string;
  insights: string[];
  action_items: string[];
  is_outdated?: boolean;
  last_updated: string;
}
