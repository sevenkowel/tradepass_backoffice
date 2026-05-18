/**
 * 安全管理 Store
 */

import { create } from "zustand";
import type {
  SecuritySettings,
  IpRule,
  SecurityEvent,
  SecurityEventFilter,
  UpdateSecuritySettingsRequest,
  CreateIpRuleRequest,
  LoginSecurityStats,
} from "@/types/backoffice/security";
import {
  mockSecuritySettings,
  mockIpRules,
  mockSecurityEvents,
  mockLoginSecurityStats,
} from "@/lib/backoffice/mock-security";

// Security Store State
interface SecurityState {
  // Data
  settings: SecuritySettings | null;
  ipRules: IpRule[];
  events: SecurityEvent[];
  stats: LoginSecurityStats | null;

  // Loading states
  isLoadingSettings: boolean;
  isLoadingRules: boolean;
  isLoadingEvents: boolean;
  isSubmitting: boolean;

  // Actions
  fetchSettings: () => Promise<void>;
  updateSettings: (data: UpdateSecuritySettingsRequest) => Promise<SecuritySettings | null>;

  // IP Rules
  fetchIpRules: () => Promise<void>;
  createIpRule: (data: CreateIpRuleRequest) => Promise<IpRule | null>;
  deleteIpRule: (id: string) => Promise<boolean>;

  // Security Events
  fetchEvents: (filter?: SecurityEventFilter) => Promise<void>;
  resolveEvent: (id: string) => Promise<boolean>;

  // Stats
  fetchStats: () => Promise<void>;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  // Initial state
  settings: null,
  ipRules: [],
  events: [],
  stats: null,
  isLoadingSettings: false,
  isLoadingRules: false,
  isLoadingEvents: false,
  isSubmitting: false,

  // Fetch security settings
  fetchSettings: async () => {
    set({ isLoadingSettings: true });
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      set({ settings: { ...mockSecuritySettings } });
    } finally {
      set({ isLoadingSettings: false });
    }
  },

  // Update security settings
  updateSettings: async (data) => {
    set({ isSubmitting: true });
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      const updatedSettings: SecuritySettings = {
        ...mockSecuritySettings,
        ...data,
        updatedAt: new Date().toISOString(),
        updatedBy: "current-user",
      };

      // Update mock data
      Object.assign(mockSecuritySettings, updatedSettings);
      set({ settings: updatedSettings });

      return updatedSettings;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Fetch IP rules
  fetchIpRules: async () => {
    set({ isLoadingRules: true });
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      set({ ipRules: [...mockIpRules] });
    } finally {
      set({ isLoadingRules: false });
    }
  },

  // Create IP rule
  createIpRule: async (data) => {
    set({ isSubmitting: true });
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newRule: IpRule = {
        id: `ip-${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
        createdBy: "current-user",
      };

      mockIpRules.push(newRule);
      set((state) => ({ ipRules: [...state.ipRules, newRule] }));

      return newRule;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Delete IP rule
  deleteIpRule: async (id) => {
    set({ isSubmitting: true });
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const index = mockIpRules.findIndex((r) => r.id === id);
      if (index === -1) return false;

      mockIpRules.splice(index, 1);
      set((state) => ({ ipRules: state.ipRules.filter((r) => r.id !== id) }));

      return true;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Fetch security events
  fetchEvents: async (filter) => {
    set({ isLoadingEvents: true });
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      let filteredEvents = [...mockSecurityEvents];

      if (filter) {
        if (filter.type) {
          filteredEvents = filteredEvents.filter((e) => e.type === filter.type);
        }

        if (filter.severity && filter.severity !== "all") {
          filteredEvents = filteredEvents.filter((e) => e.severity === filter.severity);
        }

        if (filter.staffId) {
          filteredEvents = filteredEvents.filter((e) => e.staffId === filter.staffId);
        }

        if (filter.resolved !== undefined && filter.resolved !== "all") {
          filteredEvents = filteredEvents.filter((e) => e.resolved === filter.resolved);
        }

        if (filter.startDate) {
          filteredEvents = filteredEvents.filter((e) => e.createdAt >= filter.startDate!);
        }

        if (filter.endDate) {
          filteredEvents = filteredEvents.filter((e) => e.createdAt <= filter.endDate!);
        }
      }

      // Sort by createdAt desc
      filteredEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      set({ events: filteredEvents });
    } finally {
      set({ isLoadingEvents: false });
    }
  },

  // Resolve security event
  resolveEvent: async (id) => {
    set({ isSubmitting: true });
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const event = mockSecurityEvents.find((e) => e.id === id);
      if (!event) return false;

      event.resolved = true;
      event.resolvedAt = new Date().toISOString();
      event.resolvedBy = "current-user";

      set((state) => ({
        events: state.events.map((e) => (e.id === id ? { ...e, resolved: true, resolvedAt: event.resolvedAt, resolvedBy: event.resolvedBy } : e)),
      }));

      return true;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Fetch login security stats
  fetchStats: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    set({ stats: { ...mockLoginSecurityStats } });
  },
}));
