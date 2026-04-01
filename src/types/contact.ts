export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  created_at: string;
  updated_at: string;
}

export interface ContactResponse {
  success: boolean;
  data: Contact[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    per_page: number;
  };
}

export interface ContactUpdateResponse {
  success: boolean;
  message: string;
  data: Contact;
}