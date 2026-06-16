import { promises as fs } from 'fs';
import path from 'path';
import { relipay } from './relipay';

export interface Todo {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string; // YYYY-MM-DD format
  createdAt: string;
}

export interface MockSubscription {
  userId: string;
  planSlug: 'monthly' | 'yearly';
  status: 'ACTIVE';
  createdAt: string;
}

export interface UserPlanInfo {
  tier: 'free' | 'monthly' | 'yearly';
  isMock: boolean;
  expiresAt: string | null;
}

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'todos.json');
const SUB_FILE_PATH = path.join(process.cwd(), 'data', 'subscriptions.json');

// Helper to read all todos from the JSON file
async function readTodosFile(): Promise<Todo[]> {
  try {
    const data = await fs.readFile(DB_FILE_PATH, 'utf-8');
    return JSON.parse(data) as Todo[];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(DB_FILE_PATH, '[]');
      return [];
    }
    console.error('Error reading todos database file:', error);
    return [];
  }
}

// Helper to write all todos to the JSON file
async function writeTodosFile(todos: Todo[]): Promise<void> {
  try {
    const tempPath = `${DB_FILE_PATH}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(todos, null, 2), 'utf-8');
    await fs.rename(tempPath, DB_FILE_PATH);
  } catch (error) {
    console.error('Error writing to todos database file:', error);
    throw new Error('Database write failure');
  }
}

// Helper to read subscriptions
async function readSubscriptionsFile(): Promise<MockSubscription[]> {
  try {
    const data = await fs.readFile(SUB_FILE_PATH, 'utf-8');
    return JSON.parse(data) as MockSubscription[];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(SUB_FILE_PATH, '[]');
      return [];
    }
    console.error('Error reading subscriptions database file:', error);
    return [];
  }
}

// Helper to write subscriptions
async function writeSubscriptionsFile(subs: MockSubscription[]): Promise<void> {
  try {
    const tempPath = `${SUB_FILE_PATH}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(subs, null, 2), 'utf-8');
    await fs.rename(tempPath, SUB_FILE_PATH);
  } catch (error) {
    console.error('Error writing to subscriptions database file:', error);
    throw new Error('Database write failure');
  }
}

// Get all todos for a specific user
export async function getTodos(userId: string): Promise<Todo[]> {
  const allTodos = await readTodosFile();
  return allTodos.filter(todo => todo.userId === userId);
}

// Count tasks created in the current calendar month
export async function countTasksCreatedThisMonth(userId: string): Promise<number> {
  const userTodos = await getTodos(userId);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11
  
  return userTodos.filter(todo => {
    const date = new Date(todo.createdAt);
    return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
  }).length;
}

// Add a new todo for a specific user
export async function addTodo(
  userId: string,
  title: string,
  priority: 'low' | 'medium' | 'high',
  dueDate?: string
): Promise<Todo> {
  const allTodos = await readTodosFile();
  
  const newTodo: Todo = {
    id: Math.random().toString(36).substring(2, 11),
    userId,
    title,
    completed: false,
    priority,
    dueDate: dueDate || undefined,
    createdAt: new Date().toISOString(),
  };

  allTodos.push(newTodo);
  await writeTodosFile(allTodos);
  return newTodo;
}

// Toggle the completion status of a todo
export async function toggleTodo(userId: string, id: string): Promise<Todo | null> {
  const allTodos = await readTodosFile();
  const index = allTodos.findIndex(todo => todo.id === id && todo.userId === userId);
  
  if (index === -1) return null;
  
  allTodos[index].completed = !allTodos[index].completed;
  await writeTodosFile(allTodos);
  return allTodos[index];
}

// Delete a todo item
export async function deleteTodo(userId: string, id: string): Promise<boolean> {
  const allTodos = await readTodosFile();
  const initialLength = allTodos.length;
  const filteredTodos = allTodos.filter(todo => !(todo.id === id && todo.userId === userId));
  
  if (filteredTodos.length === initialLength) return false;
  
  await writeTodosFile(filteredTodos);
  return true;
}

// Edit an existing todo item's details
export async function editTodo(
  userId: string,
  id: string,
  title: string,
  priority: 'low' | 'medium' | 'high',
  dueDate?: string
): Promise<Todo | null> {
  const allTodos = await readTodosFile();
  const index = allTodos.findIndex(todo => todo.id === id && todo.userId === userId);
  
  if (index === -1) return null;
  
  allTodos[index].title = title;
  allTodos[index].priority = priority;
  allTodos[index].dueDate = dueDate || undefined;
  
  await writeTodosFile(allTodos);
  return allTodos[index];
}

// Persist a mock user subscription locally for sandbox testing
export async function saveMockSubscription(
  userId: string,
  planSlug: 'free' | 'monthly' | 'yearly'
): Promise<void> {
  const allSubs = await readSubscriptionsFile();
  // Filter out any existing subscriptions for the user
  const filtered = allSubs.filter(sub => sub.userId !== userId);
  
  if (planSlug !== 'free') {
    filtered.push({
      userId,
      planSlug,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });
  }
  
  await writeSubscriptionsFile(filtered);
}

// Retrieve the user's active tier (remote ReliPay takes priority, local mock falls back)
export async function getUserPlan(userId: string, accessToken?: string): Promise<UserPlanInfo> {
  // 1. Try querying remote ReliPay server if user has an access token
  if (accessToken) {
    try {
      const activeSub = await relipay.billing.getSubscription(accessToken);
      if (activeSub && activeSub.status === 'ACTIVE') {
        const plans = await relipay.billing.getPlans();
        const activePlan = plans.find(p => p.id === activeSub.planId);
        
        if (activePlan) {
          const planSlug = activePlan.slug.toLowerCase();
          if (planSlug.includes('yearly') || planSlug.includes('800')) {
            return { tier: 'yearly', isMock: false, expiresAt: activeSub.currentPeriodEnd };
          }
          if (planSlug.includes('monthly') || planSlug.includes('100')) {
            return { tier: 'monthly', isMock: false, expiresAt: activeSub.currentPeriodEnd };
          }
        }
      }
    } catch (err) {
      console.error('Failed to resolve active subscription from ReliPay server:', err);
    }
  }

  // 2. Fallback to local mock subscription database
  const allSubs = await readSubscriptionsFile();
  const sub = allSubs.find(s => s.userId === userId && s.status === 'ACTIVE');
  
  if (sub) {
    // Generate a mock expiration date far in the future
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    return {
      tier: sub.planSlug,
      isMock: true,
      expiresAt: nextYear.toISOString(),
    };
  }

  // 3. Default to Free tier
  return {
    tier: 'free',
    isMock: false,
    expiresAt: null,
  };
}
