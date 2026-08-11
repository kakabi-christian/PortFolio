// src/Models/Contact.ts

export interface Contact {
  id: number;
  sender_name: string;
  sender_email: string;
  subject: string;
  message: string;
  is_read: boolean;
  reply_message?: string | null;
  replied_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactFormData {
  sender_name: string;
  sender_email: string;
  subject: string;
  message: string;
}

export interface ContactReplyData {
  reply_message: string;
}