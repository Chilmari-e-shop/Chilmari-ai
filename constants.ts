import type { Agent } from './types';
import { H2OIcon, BloomIcon, ImageIcon } from './components/Icons';

export const AGENTS: Agent[] = [
  {
    id: 'h2o-gpt',
    name: 'AK Chat Pro',
    description: 'Real-time info via Google Search',
    icon: H2OIcon,
  },
  {
    id: 'bloom-ai',
    name: 'Ak Chat Flash',
    icon: BloomIcon,
  },
  {
    id: 'imagen-ai',
    name: 'Create with Ak',
    icon: ImageIcon,
  },
];
