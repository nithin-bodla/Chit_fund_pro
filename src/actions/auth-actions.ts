'use server';

import {
  getUserByUsername,
  getUserById,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserPassword,
} from '@/lib/db';
import {
  verifyPassword,
  hashPassword,
  createSessionCookie,
  clearSessionCookie,
  getSession,
  requireAdmin,
} from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function loginAction(formData: FormData) {
  const username = (formData.get('username') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { success: false, error: 'Username and password are required' };
  }

  const user = await getUserByUsername(username);
  if (!user) {
    return { success: false, error: 'Invalid username or password' };
  }

  const isMatch = await verifyPassword(password, user.password_hash);
  if (!isMatch) {
    return { success: false, error: 'Invalid username or password' };
  }

  await createSessionCookie({
    id: user.id,
    username: user.username,
    role: user.role,
  });

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function logoutAction() {
  await clearSessionCookie();
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function getCurrentUserAction() {
  const session = await getSession();
  return { user: session };
}

export async function getAdminUsersAction() {
  await requireAdmin();
  const users = await getAllUsers();
  return { success: true, data: users };
}

export async function createAdminUserAction(formData: FormData) {
  await requireAdmin();
  const username = (formData.get('username') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!username || !password) {
    return { success: false, error: 'Username and password are required' };
  }
  if (username.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { success: false, error: 'Username can only contain letters, numbers, underscores, and dashes' };
  }
  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }
  if (password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match' };
  }

  const existing = await getUserByUsername(username);
  if (existing) {
    return { success: false, error: `Username "${username}" is already taken` };
  }

  const hash = await hashPassword(password);
  const newUser = await createUser({
    username,
    password_hash: hash,
    role: 'admin',
  });

  revalidatePath('/settings');
  return { success: true, message: `Admin account "${newUser.username}" created successfully!` };
}

export async function updateAdminUserAction(userId: string, formData: FormData) {
  const session = await requireAdmin();
  const newUsername = (formData.get('username') as string)?.trim().toLowerCase();
  const newPassword = (formData.get('newPassword') as string)?.trim();

  const currentUser = await getUserById(userId);
  if (!currentUser) {
    return { success: false, error: 'Admin account not found' };
  }

  if (newUsername && newUsername !== currentUser.username) {
    if (newUsername.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
      return { success: false, error: 'Username can only contain letters, numbers, underscores, and dashes' };
    }
    const existing = await getUserByUsername(newUsername);
    if (existing && existing.id !== userId) {
      return { success: false, error: `Username "${newUsername}" is already taken` };
    }
  }

  let newHash: string | undefined = undefined;
  if (newPassword) {
    if (newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters' };
    }
    newHash = await hashPassword(newPassword);
  }

  const updated = await updateUser(userId, {
    username: newUsername || currentUser.username,
    ...(newHash ? { password_hash: newHash } : {}),
  });

  if (session.id === userId && updated) {
    await createSessionCookie({
      id: updated.id,
      username: updated.username,
      role: updated.role,
    });
  }

  revalidatePath('/', 'layout');
  revalidatePath('/settings');
  return { success: true, message: 'Admin account credentials updated successfully' };
}

export async function deleteAdminUserAction(userId: string) {
  const session = await requireAdmin();
  if (session.id === userId) {
    return { success: false, error: 'You cannot delete your own currently active admin account' };
  }

  try {
    await deleteUser(userId);
    revalidatePath('/settings');
    return { success: true, message: 'Admin account deleted successfully' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete admin account' };
  }
}

export async function updateMyCredentialsAction(formData: FormData) {
  const session = await requireAdmin();
  const newUsername = (formData.get('username') as string)?.trim().toLowerCase();
  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = (formData.get('newPassword') as string)?.trim();
  const confirmPassword = (formData.get('confirmPassword') as string)?.trim();

  if (!currentPassword) {
    return { success: false, error: 'Current password is required to verify identity' };
  }

  const user = await getUserByUsername(session.username);
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const isMatch = await verifyPassword(currentPassword, user.password_hash);
  if (!isMatch) {
    return { success: false, error: 'Current password is incorrect' };
  }

  if (newUsername && newUsername !== user.username) {
    if (newUsername.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
      return { success: false, error: 'Username can only contain letters, numbers, underscores, and dashes' };
    }
    const existing = await getUserByUsername(newUsername);
    if (existing && existing.id !== user.id) {
      return { success: false, error: `Username "${newUsername}" is already taken` };
    }
  }

  let newHash: string | undefined = undefined;
  if (newPassword) {
    if (newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters' };
    }
    if (newPassword !== confirmPassword) {
      return { success: false, error: 'New passwords do not match' };
    }
    newHash = await hashPassword(newPassword);
  }

  const updated = await updateUser(user.id, {
    username: newUsername || user.username,
    ...(newHash ? { password_hash: newHash } : {}),
  });

  if (updated) {
    await createSessionCookie({
      id: updated.id,
      username: updated.username,
      role: updated.role,
    });
  }

  revalidatePath('/', 'layout');
  revalidatePath('/settings');
  return { success: true, message: 'Profile credentials updated successfully' };
}

export async function changePasswordAction(formData: FormData) {
  return updateMyCredentialsAction(formData);
}

