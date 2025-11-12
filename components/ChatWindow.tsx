import React from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { MenuIcon, XIcon } from './Icons';
import type { Agent, Message } from '../types';

interface ChatWindowProps {
  agent: Agent;
  messages: Message[];
  isLoading: boolean;
  sendMessage: (text: string, image?: string) => Promise<void>;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  agent,
  messages,
  isLoading,
  sendMessage,
  isSidebarOpen,
  toggleSidebar,
}) => {
  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-light-main dark:bg-dark-main sticky top-0 z-10">
        <button onClick={toggleSidebar} className="md:hidden mr-4 relative z-40">
          {isSidebarOpen ? <XIcon /> : <MenuIcon />}
        </button>
        <div className="flex items-center">
          <agent.icon className="w-8 h-8 mr-3" />
          <h2 className="text-lg font-semibold">{agent.name}</h2>
        </div>
      </header>
      
      <MessageList messages={messages} agent={agent} isLoading={isLoading} />

      <MessageInput 
        sendMessage={sendMessage} 
        isLoading={isLoading}
        agent={agent}
      />
    </div>
  );
};

export default ChatWindow;