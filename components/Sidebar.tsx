import React from 'react';
import type { Agent } from '../types';
import { PlusIcon, SunIcon, MoonIcon } from './Icons';

interface SidebarProps {
  agents: Agent[];
  activeAgentId: string;
  setActiveAgentId: (id: string) => void;
  isSidebarOpen: boolean;
  clearChat: (agentId: string) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  agents,
  activeAgentId,
  setActiveAgentId,
  isSidebarOpen,
  clearChat,
  theme,
  setTheme,
}) => {
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div
      className={`
        bg-light-sidebar dark:bg-dark-sidebar 
        text-light-text dark:text-dark-text
        flex flex-col h-full 
        transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'w-64 p-4' : 'w-0 p-0'}
        overflow-hidden
        absolute md:relative z-30 md:z-0
      `}
    >
      <div className="flex-1 flex flex-col min-w-max">
        <h1 className="text-xl font-bold mb-6">Chilmari AI</h1>
        
        <button 
          onClick={() => clearChat(activeAgentId)}
          className="flex items-center w-full p-2 mb-4 rounded-lg text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          <PlusIcon className="mr-3" />
          New Chat
        </button>

        <nav className="flex-1 space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Agents</p>
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setActiveAgentId(agent.id)}
              className={`
                flex items-center w-full p-2 rounded-lg text-sm text-left
                transition-colors
                ${activeAgentId === agent.id ? 'bg-gray-200 dark:bg-dark-input' : 'hover:bg-gray-100 dark:hover:bg-dark-input'}
              `}
            >
              <agent.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium">{agent.name}</p>
                {agent.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{agent.description}</p>
                )}
              </div>
            </button>
          ))}
        </nav>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2 min-w-max">
         <button
          onClick={toggleTheme}
          className="flex items-center w-full p-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-dark-input transition-colors"
        >
          {theme === 'light' ? <MoonIcon className="mr-3" /> : <SunIcon className="mr-3" />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;