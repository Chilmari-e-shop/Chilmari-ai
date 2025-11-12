import React from 'react';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
  image?: string; // base64 encoded string
  isError?: boolean;
  sources?: {
    title: string;
    uri: string;
  }[];
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

export type ChatHistory = {
  [agentId: string]: Message[];
};
