'use server';

import { auth } from '@relipay/nextjs/server';
import { revalidatePath } from 'next/cache';
import { addTodo, toggleTodo, deleteTodo, editTodo, getUserPlan, getTodos, countTasksCreatedThisMonth } from '../../lib/db';

export async function createTodoAction(
  title: string,
  priority: 'low' | 'medium' | 'high',
  dueDate?: string
) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized: You must be signed in to perform this action.');
  }

  const cleanTitle = title.trim();
  if (!cleanTitle) {
    throw new Error('Task title cannot be empty.');
  }

  // 1. Fetch user subscription details
  const planInfo = await getUserPlan(session.user.id, session.accessToken);

  // 2. Enforce tier limits
  if (planInfo.tier === 'free') {
    const totalTodos = await getTodos(session.user.id);
    if (totalTodos.length >= 10) {
      throw new Error(
        'Billing Limit Reached: Free tier accounts are limited to a maximum of 10 tasks. Please upgrade your plan under Billing & Plans to continue.'
      );
    }
  } else if (planInfo.tier === 'monthly') {
    const monthlyCreatedCount = await countTasksCreatedThisMonth(session.user.id);
    if (monthlyCreatedCount >= 30) {
      throw new Error(
        'Billing Limit Reached: Monthly plan accounts are limited to 30 tasks per month. Please upgrade to the Yearly plan under Billing & Plans for unlimited tasks.'
      );
    }
  }

  const result = await addTodo(session.user.id, cleanTitle, priority, dueDate);
  revalidatePath('/dashboard');
  return result;
}

export async function toggleTodoAction(id: string) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized: You must be signed in to perform this action.');
  }

  const result = await toggleTodo(session.user.id, id);
  revalidatePath('/dashboard');
  return result;
}

export async function deleteTodoAction(id: string) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized: You must be signed in to perform this action.');
  }

  const result = await deleteTodo(session.user.id, id);
  revalidatePath('/dashboard');
  return result;
}

export async function editTodoAction(
  id: string,
  title: string,
  priority: 'low' | 'medium' | 'high',
  dueDate?: string
) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized: You must be signed in to perform this action.');
  }

  const cleanTitle = title.trim();
  if (!cleanTitle) {
    throw new Error('Task title cannot be empty.');
  }

  const result = await editTodo(session.user.id, id, cleanTitle, priority, dueDate);
  revalidatePath('/dashboard');
  return result;
}
