import { create } from 'zustand';
import { GitHubRepository, GitHubPullRequest } from '../types/github';

interface AppState {
  // Navigation
  currentView: 'dashboard' | 'repository' | 'pull-request' | 'settings';
  sidebarCollapsed: boolean;
  
  // Repository & PR state
  selectedRepository: GitHubRepository | null;
  selectedPullRequest: GitHubPullRequest | null;
  repositories: GitHubRepository[];
  
  // UI state
  theme: 'dark' | 'light';
  layoutMode: 'split' | 'unified' | 'side-by-side';
  isLoading: boolean;
  
  // Actions
  setCurrentView: (view: AppState['currentView']) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSelectedRepository: (repo: GitHubRepository | null) => void;
  setSelectedPullRequest: (pr: GitHubPullRequest | null) => void;
  setRepositories: (repos: GitHubRepository[]) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setLayoutMode: (mode: AppState['layoutMode']) => void;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  currentView: 'dashboard',
  sidebarCollapsed: false,
  selectedRepository: null,
  selectedPullRequest: null,
  repositories: [],
  theme: 'dark',
  layoutMode: 'split',
  isLoading: false,
  
  // Actions
  setCurrentView: (currentView) => set({ currentView }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setSelectedRepository: (selectedRepository) => set({ selectedRepository }),
  setSelectedPullRequest: (selectedPullRequest) => set({ selectedPullRequest }),
  setRepositories: (repositories) => set({ repositories }),
  setTheme: (theme) => set({ theme }),
  setLayoutMode: (layoutMode) => set({ layoutMode }),
  setLoading: (isLoading) => set({ isLoading }),
}));