/**
 * 角色权限管理 Store
 * Role & Permission Management Store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Role,
  AdminUser,
  PermissionModuleConfig,
  CreateRoleRequest,
  UpdateRoleRequest,
  CreateAdminRequest,
  UpdateAdminRequest,
  RoleFilter,
  AdminFilter,
} from '@/types/backoffice/role';
import {
  mockRoles,
  mockAdminUsers,
  permissionModules,
  getMockRoles,
  getMockRoleById,
  createMockRole,
  updateMockRole,
  deleteMockRole,
  getMockAdmins,
  getMockAdminById,
  createMockAdmin,
  updateMockAdmin,
  deleteMockAdmin,
  resetMockAdminPassword,
} from '@/lib/backoffice/mock-roles';

// ============================================================
// 角色管理 State
// ============================================================

interface RoleState {
  // 角色列表
  roles: Role[];
  isLoadingRoles: boolean;
  rolesError: string | null;
  
  // 当前编辑的角色
  currentRole: Role | null;
  
  // 权限模块
  permissionModules: PermissionModuleConfig[];
  
  // Actions - 角色
  fetchRoles: (filter?: RoleFilter) => Promise<void>;
  fetchRoleById: (id: string) => Promise<Role | null>;
  createRole: (data: CreateRoleRequest) => Promise<Role | null>;
  updateRole: (id: string, data: UpdateRoleRequest) => Promise<Role | null>;
  deleteRole: (id: string) => Promise<boolean>;
  setCurrentRole: (role: Role | null) => void;
  
  // 权限检查
  getRolePermissions: (roleId: string) => Role['permissions'];
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set, get) => ({
      // Initial state
      roles: mockRoles,
      isLoadingRoles: false,
      rolesError: null,
      currentRole: null,
      permissionModules: permissionModules,

      // Fetch roles list
      fetchRoles: async (filter?: RoleFilter) => {
        set({ isLoadingRoles: true, rolesError: null });
        try {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 300));
          const roles = getMockRoles(filter?.keyword, filter?.status);
          set({ roles, isLoadingRoles: false });
        } catch (error) {
          set({ 
            rolesError: error instanceof Error ? error.message : 'Failed to fetch roles',
            isLoadingRoles: false 
          });
        }
      },

      // Fetch single role
      fetchRoleById: async (id: string) => {
        try {
          await new Promise(resolve => setTimeout(resolve, 200));
          const role = getMockRoleById(id);
          if (role) {
            set({ currentRole: role });
          }
          return role || null;
        } catch (error) {
          console.error('Failed to fetch role:', error);
          return null;
        }
      },

      // Create role
      createRole: async (data: CreateRoleRequest) => {
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          const newRole = createMockRole({
            ...data,
            userCount: 0,
            isSystem: false,
            status: 'active',
          });
          set(state => ({
            roles: [newRole, ...state.roles],
          }));
          return newRole;
        } catch (error) {
          console.error('Failed to create role:', error);
          return null;
        }
      },

      // Update role
      updateRole: async (id: string, data: UpdateRoleRequest) => {
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          const updatedRole = updateMockRole(id, data);
          if (updatedRole) {
            set(state => ({
              roles: state.roles.map(r => r.id === id ? updatedRole : r),
              currentRole: state.currentRole?.id === id ? updatedRole : state.currentRole,
            }));
          }
          return updatedRole || null;
        } catch (error) {
          console.error('Failed to update role:', error);
          return null;
        }
      },

      // Delete role
      deleteRole: async (id: string) => {
        try {
          await new Promise(resolve => setTimeout(resolve, 400));
          const success = deleteMockRole(id);
          if (success) {
            set(state => ({
              roles: state.roles.filter(r => r.id !== id),
              currentRole: state.currentRole?.id === id ? null : state.currentRole,
            }));
          }
          return success;
        } catch (error) {
          console.error('Failed to delete role:', error);
          return false;
        }
      },

      // Set current role
      setCurrentRole: (role: Role | null) => {
        set({ currentRole: role });
      },

      // Get role permissions
      getRolePermissions: (roleId: string) => {
        const role = getMockRoleById(roleId);
        return role?.permissions || [];
      },
    }),
    {
      name: 'backoffice-roles',
      partialize: (state) => ({
        roles: state.roles,
        permissionModules: state.permissionModules,
      }),
    }
  )
);

// ============================================================
// 管理员管理 State
// ============================================================

interface AdminState {
  // 管理员列表
  admins: AdminUser[];
  isLoadingAdmins: boolean;
  adminsError: string | null;
  
  // 当前编辑的管理员
  currentAdmin: AdminUser | null;
  
  // Actions - 管理员
  fetchAdmins: (filter?: AdminFilter) => Promise<void>;
  fetchAdminById: (id: string) => Promise<AdminUser | null>;
  createAdmin: (data: CreateAdminRequest) => Promise<AdminUser | null>;
  updateAdmin: (id: string, data: UpdateAdminRequest) => Promise<AdminUser | null>;
  deleteAdmin: (id: string) => Promise<boolean>;
  resetPassword: (id: string, newPassword: string) => Promise<boolean>;
  setCurrentAdmin: (admin: AdminUser | null) => void;
  toggleAdminStatus: (id: string) => Promise<AdminUser | null>;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      // Initial state
      admins: mockAdminUsers,
      isLoadingAdmins: false,
      adminsError: null,
      currentAdmin: null,

      // Fetch admins list
      fetchAdmins: async (filter?: AdminFilter) => {
        set({ isLoadingAdmins: true, adminsError: null });
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          const admins = getMockAdmins(filter?.keyword, filter?.roleId, filter?.status);
          set({ admins, isLoadingAdmins: false });
        } catch (error) {
          set({ 
            adminsError: error instanceof Error ? error.message : 'Failed to fetch admins',
            isLoadingAdmins: false 
          });
        }
      },

      // Fetch single admin
      fetchAdminById: async (id: string) => {
        try {
          await new Promise(resolve => setTimeout(resolve, 200));
          const admin = getMockAdminById(id);
          if (admin) {
            set({ currentAdmin: admin });
          }
          return admin || null;
        } catch (error) {
          console.error('Failed to fetch admin:', error);
          return null;
        }
      },

      // Create admin
      createAdmin: async (data: CreateAdminRequest) => {
        try {
          await new Promise(resolve => setTimeout(resolve, 600));
          
          // Get role info
          const { roles } = useRoleStore.getState();
          const role = roles.find(r => r.id === data.roleId);
          if (!role) throw new Error('Role not found');
          
          const newAdmin = createMockAdmin({
            ...data,
            role,
            status: 'active',
          });
          
          set(state => ({
            admins: [newAdmin, ...state.admins],
          }));
          
          // Update role store user count
          useRoleStore.setState(state => ({
            roles: state.roles.map(r => 
              r.id === role.id ? { ...r, userCount: r.userCount + 1 } : r
            ),
          }));
          
          return newAdmin;
        } catch (error) {
          console.error('Failed to create admin:', error);
          return null;
        }
      },

      // Update admin
      updateAdmin: async (id: string, data: UpdateAdminRequest) => {
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Get role info if roleId changed
          const role = data.roleId ? useRoleStore.getState().roles.find(r => r.id === data.roleId) : undefined;
          
          const updates: Partial<AdminUser> = { ...data };
          if (role) {
            updates.role = role;
          }
          
          const updatedAdmin = updateMockAdmin(id, updates);
          if (updatedAdmin) {
            set(state => ({
              admins: state.admins.map(a => a.id === id ? updatedAdmin : a),
              currentAdmin: state.currentAdmin?.id === id ? updatedAdmin : state.currentAdmin,
            }));
            
            // Sync role user counts
            const { roles } = useRoleStore.getState();
            const updatedRoles = roles.map(r => {
              const count = getMockAdmins(undefined, r.id).length;
              return { ...r, userCount: count };
            });
            useRoleStore.setState({ roles: updatedRoles });
          }
          return updatedAdmin || null;
        } catch (error) {
          console.error('Failed to update admin:', error);
          return null;
        }
      },

      // Delete admin
      deleteAdmin: async (id: string) => {
        try {
          await new Promise(resolve => setTimeout(resolve, 400));
          const success = deleteMockAdmin(id);
          if (success) {
            const deletedAdmin = get().admins.find(a => a.id === id);
            set(state => ({
              admins: state.admins.filter(a => a.id !== id),
              currentAdmin: state.currentAdmin?.id === id ? null : state.currentAdmin,
            }));
            
            // Update role user count
            if (deletedAdmin) {
              useRoleStore.setState(state => ({
                roles: state.roles.map(r => 
                  r.id === deletedAdmin.role.id 
                    ? { ...r, userCount: Math.max(0, r.userCount - 1) } 
                    : r
                ),
              }));
            }
          }
          return success;
        } catch (error) {
          console.error('Failed to delete admin:', error);
          return false;
        }
      },

      // Reset password
      resetPassword: async (id: string, newPassword: string) => {
        try {
          await new Promise(resolve => setTimeout(resolve, 400));
          return resetMockAdminPassword(id, newPassword);
        } catch (error) {
          console.error('Failed to reset password:', error);
          return false;
        }
      },

      // Set current admin
      setCurrentAdmin: (admin: AdminUser | null) => {
        set({ currentAdmin: admin });
      },

      // Toggle admin status
      toggleAdminStatus: async (id: string) => {
        try {
          const admin = get().admins.find(a => a.id === id);
          if (!admin) return null;
          
          const newStatus = admin.status === 'active' ? 'inactive' : 'active';
          return get().updateAdmin(id, { status: newStatus });
        } catch (error) {
          console.error('Failed to toggle admin status:', error);
          return null;
        }
      },
    }),
    {
      name: 'backoffice-admins',
      partialize: (state) => ({
        admins: state.admins,
      }),
    }
  )
);
