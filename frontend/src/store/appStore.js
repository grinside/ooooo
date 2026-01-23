import { create } from 'zustand';

const useAppStore = create((set, get) => ({
  // Loading states
  isLoading: false,
  loadingMessage: '',

  // Sidebar state (for mobile)
  sidebarOpen: false,

  // Theme
  theme: 'light',

  // Affiliate code from URL
  affiliateCode: null,

  // Modal states
  modalOpen: false,
  modalContent: null,

  // Actions
  setLoading: (isLoading, message = '') => {
    set({ isLoading, loadingMessage: message });
  },

  toggleSidebar: () => {
    set({ sidebarOpen: !get().sidebarOpen });
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open });
  },

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    get().setTheme(newTheme);
  },

  setAffiliateCode: (code) => {
    if (code) {
      localStorage.setItem('affiliateCode', code);
      sessionStorage.setItem('affiliateCode', code);
    }
    set({ affiliateCode: code });
  },

  getAffiliateCode: () => {
    // Try to get from state first
    let code = get().affiliateCode;

    // If not in state, try localStorage
    if (!code) {
      code = localStorage.getItem('affiliateCode') ||
             sessionStorage.getItem('affiliateCode');
    }

    // If not in storage, try URL
    if (!code) {
      const urlParams = new URLSearchParams(window.location.search);
      code = urlParams.get('ref') || urlParams.get('affiliate');

      if (code) {
        get().setAffiliateCode(code);
      }
    }

    return code;
  },

  clearAffiliateCode: () => {
    localStorage.removeItem('affiliateCode');
    sessionStorage.removeItem('affiliateCode');
    set({ affiliateCode: null });
  },

  openModal: (content) => {
    set({ modalOpen: true, modalContent: content });
  },

  closeModal: () => {
    set({ modalOpen: false, modalContent: null });
  },

  // Initialize app
  initApp: () => {
    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    get().setTheme(savedTheme);

    // Initialize affiliate code
    get().getAffiliateCode();
  },
}));

export default useAppStore;
