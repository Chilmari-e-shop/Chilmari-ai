import React, { useState, useRef, useCallback } from 'react';
import { SendIcon, PaperclipIcon, XIcon } from './Icons';
import type { Agent } from '../types';

interface MessageInputProps {
  sendMessage: (text: string, image?: string) => Promise<void>;
  isLoading: boolean;
  agent: Agent;
}

const MessageInput: React.FC<MessageInputProps> = ({ sendMessage, isLoading, agent }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSend = useCallback(async () => {
    if ((!text.trim() && !image) || isLoading) return;
    await sendMessage(text, image || undefined);
    setText('');
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, image, isLoading, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isImageAgent = agent.id === 'imagen-ai';

  return (
    <div className="p-4 bg-light-main dark:bg-dark-main border-t border-gray-200 dark:border-gray-700">
      <div className="relative w-full max-w-4xl mx-auto bg-light-input dark:bg-dark-input rounded-xl border border-gray-300 dark:border-gray-600 shadow-sm">
        {image && (
          <div className="p-2 relative w-24 h-24">
            <img src={image} alt="preview" className="rounded-md object-cover w-full h-full" />
            <button 
              onClick={() => {
                setImage(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }} 
              className="absolute top-0 right-0 bg-black bg-opacity-50 text-white rounded-full p-0.5"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex items-end p-2">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title={isImageAgent ? "Attach an image to edit" : "Attach image"}
          >
            <PaperclipIcon />
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </button>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={isImageAgent ? "Describe an image to create or edit..." : "Type a message..."}
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none max-h-48 px-2 py-1.5"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || (!text.trim() && !image)}
            className="p-2 rounded-lg bg-blue-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <SendIcon />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;