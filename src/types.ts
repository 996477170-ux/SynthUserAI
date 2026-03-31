import { GoogleGenAI } from "@google/genai";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface Project {
  id: string;
  purpose: string;
  shortTitle?: string;
  goals: { id: string; content: string }[];
  suggestedDimensions?: { id: string; name: string; desc: string }[];
  status: 'draft' | 'ready' | 'completed';
  createdAt: string;
}

export interface SyntheticUser {
  id: string;
  projectId: string;
  name: string;
  age: number;
  gender: string;
  cityTier: string;
  occupation: string;
  coreTraits: {
    [key: string]: {
      label: string;
      detail: string;
    };
  };
  background: string;
  boundKnowledge: {
    scenarios: { content: string; usageGuide: string }[];
    painPoints: { content: string; personalTake: string }[];
    quotes: { originalQuote: string; adaptedExpression: string; usageContext: string }[];
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderType: 'user' | 'synthetic_user';
  syntheticUserId?: string;
  content: string;
  imageUrl?: string;
  mimeType?: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  projectId: string;
  type: 'one_on_one' | 'focus_group';
  participantIds: string[];
  createdAt: string;
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  status: 'ready' | 'processing' | 'failed';
  metadata: {
    businessLine: string;
    tags: string[];
  };
  createdAt: string;
}
