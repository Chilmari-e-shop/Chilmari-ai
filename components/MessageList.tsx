import React, { useRef, useEffect, useState } from 'react';
import type { Message, Agent } from '../types';
import { UserIcon, CopyIcon, CheckIcon, SearchIcon } from './Icons';
import ImageZoomModal from './ImageZoomModal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageListProps {
  messages: Message[];
  agent: Agent;
  isLoading: boolean;
}

const CodeBlock: React.FC<any> = ({ node, inline, className, children, ...props }) => {
  const [isCopied, setIsCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const textToCopy = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return !inline && match ? (
    <div className="bg-black/70 rounded-md my-2 relative">
      <div className="flex items-center justify-between px-4 py-1 border-b border-gray-600">
        <span className="text-gray-300 text-xs">{match[1]}</span>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-1 text-gray-300 hover:text-white text-xs"
        >
          {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
          {isCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto" {...props}>
        <code className={`language-${match[1]}`}>{children}</code>
      </pre>
    </div>
  ) : (
    <code className="bg-gray-200 dark:bg-gray-800 rounded-sm px-1 py-0.5 text-sm" {...props}>
      {children}
    </code>
  );
};


const MessageItem: React.FC<{ message: Message; agentIcon: React.FC<React.SVGProps<SVGSVGElement>> }> = ({ message, agentIcon: AgentIcon }) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  return (
    <div className={`flex items-start gap-4 my-4 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
      {message.sender === 'ai' && <AgentIcon className="w-8 h-8 flex-shrink-0 mt-1" />}
      
      <div className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
        <div 
          className={`
            max-w-xl p-3 rounded-2xl
            ${message.sender === 'user' 
              ? 'bg-blue-500 text-white rounded-br-none' 
              : 'bg-light-input dark:bg-dark-input rounded-bl-none'}
            ${message.isError ? 'bg-red-500 !text-white' : ''}
          `}
        >
          {message.image && (
             <img 
               src={message.image} 
               alt="Content" 
               className="rounded-lg mb-2 max-w-xs cursor-pointer"
               onClick={() => setZoomedImage(message.image!)}
             />
          )}
          {message.text && (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-0 prose-pre:my-0">
               <ReactMarkdown
                 remarkPlugins={[remarkGfm]}
                 components={{
                   code: CodeBlock
                 }}
               >
                 {message.text}
               </ReactMarkdown>
            </div>
          )}
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 max-w-xl">
            <h4 className="font-semibold mb-1 flex items-center gap-1.5">
              <SearchIcon className="w-3 h-3" />
              Sources:
            </h4>
            <ul className="list-disc list-inside space-y-1">
              {message.sources.map((source, index) => (
                <li key={index} className="truncate">
                  <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {message.sender === 'user' && <UserIcon className="w-8 h-8 flex-shrink-0 bg-gray-300 dark:bg-gray-600 rounded-full p-1 mt-1" />}
      
      {zoomedImage && (
        <ImageZoomModal 
          isOpen={!!zoomedImage} 
          onClose={() => setZoomedImage(null)} 
          imageUrl={zoomedImage}
        />
      )}
    </div>
  );
};

const ThinkingIndicator: React.FC<{ agent: Agent }> = ({ agent }) => {
  const AgentIcon = agent.icon;
  return (
    <div className="flex items-start gap-4 my-4 animate-fade-in">
      <AgentIcon className="w-8 h-8 flex-shrink-0 mt-1" />
      <div className="flex flex-col items-start">
        <div className="max-w-xl p-3 rounded-2xl bg-light-input dark:bg-dark-input rounded-bl-none">
          <div className="flex items-center justify-center space-x-1.5 h-5">
            <span className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse-fast"></span>
            <span className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse-fast" style={{ animationDelay: '0.2s' }}></span>
            <span className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse-fast" style={{ animationDelay: '0.4s' }}></span>
          </div>
        </div>
      </div>
    </div>
  );
};


const MessageList: React.FC<MessageListProps> = ({ messages, agent, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <agent.icon className="w-16 h-16 mb-4" />
          <h3 className="text-xl font-semibold">Start chatting with {agent.name}</h3>
          <p className="text-sm mt-1">Send a message to begin the conversation.</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} agentIcon={agent.icon} />
          ))}
          {isLoading && <ThinkingIndicator agent={agent} />}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default MessageList;
