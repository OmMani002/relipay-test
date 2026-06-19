'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { Todo } from '../../lib/db';
import { 
  createTodoAction, 
  toggleTodoAction, 
  deleteTodoAction, 
  editTodoAction 
} from './todo-actions';

interface TodoWorkspaceProps {
  initialTodos: Todo[];
  user: {
    email: string;
    id: string;
  };
  planInfo: {
    tier: 'free' | 'monthly' | 'yearly';
    isMock: boolean;
    expiresAt: string | null;
  };
  monthlyCreatedCount: number;
}

export default function TodoWorkspace({ 
  initialTodos, 
  user, 
  planInfo, 
  monthlyCreatedCount 
}: TodoWorkspaceProps) {
  // Local state for interactive todos list
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  
  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`todos_${user.id}`);
    if (saved) {
      try {
        setTodos(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved todos');
      }
    } else {
      setTodos(initialTodos);
      localStorage.setItem(`todos_${user.id}`, JSON.stringify(initialTodos));
    }
  }, [user.id, initialTodos]);

  // Transition state for background server actions
  const [isPending, startTransition] = useTransition();

  // Task creation form state
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'priority' | 'dueDate'>('createdAt');

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editDueDate, setEditDueDate] = useState('');

  // Statistics
  const totalTasks = todos.length;
  const completedTasks = todos.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Enforce tier limits client-side
  const isFreeLimitReached = planInfo.tier === 'free' && totalTasks >= 10;
  const isMonthlyLimitReached = planInfo.tier === 'monthly' && monthlyCreatedCount >= 30;
  const isCreationLocked = isFreeLimitReached || isMonthlyLimitReached;

  // Handler for adding a new todo
  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isCreationLocked) return;

    setErrorMsg(null);
    const title = newTitle.trim();
    const priority = newPriority;
    const dueDate = newDueDate;

    // Reset inputs immediately for UX
    setNewTitle('');
    setNewDueDate('');

    // Update client state & localStorage immediately
    const tempId = Math.random().toString(36).substring(2, 11);
    const newTodo: Todo = {
      id: tempId,
      userId: user.id,
      title,
      completed: false,
      priority,
      dueDate: dueDate || undefined,
      createdAt: new Date().toISOString(),
    };
    
    const updated = [newTodo, ...todos];
    setTodos(updated);
    localStorage.setItem(`todos_${user.id}`, JSON.stringify(updated));

    startTransition(async () => {
      try {
        const result = await createTodoAction(title, priority, dueDate || undefined);
        // Replace tempId with the real server-generated id
        if (result && result.id) {
          setTodos(prev => {
            const final = prev.map(t => t.id === tempId ? { ...t, id: result.id } : t);
            localStorage.setItem(`todos_${user.id}`, JSON.stringify(final));
            return final;
          });
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to add task.');
        // Revert on error
        setTodos(prev => {
          const reverted = prev.filter(t => t.id !== tempId);
          localStorage.setItem(`todos_${user.id}`, JSON.stringify(reverted));
          return reverted;
        });
      }
    });
  };

  // Handler for toggling status (optimistic)
  const handleToggleTodo = (id: string) => {
    const originalTodos = [...todos];
    
    // Update client state & localStorage immediately
    const updated = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTodos(updated);
    localStorage.setItem(`todos_${user.id}`, JSON.stringify(updated));

    startTransition(async () => {
      try {
        await toggleTodoAction(id);
      } catch (err: any) {
        setErrorMsg('Failed to update task status.');
        // Revert on error
        setTodos(originalTodos);
        localStorage.setItem(`todos_${user.id}`, JSON.stringify(originalTodos));
      }
    });
  };

  // Handler for deleting a todo (optimistic)
  const handleDeleteTodo = (id: string) => {
    const originalTodos = [...todos];

    // Update client state & localStorage immediately
    const updated = todos.filter(t => t.id !== id);
    setTodos(updated);
    localStorage.setItem(`todos_${user.id}`, JSON.stringify(updated));

    startTransition(async () => {
      try {
        await deleteTodoAction(id);
      } catch (err: any) {
        setErrorMsg('Failed to delete task.');
        // Revert on error
        setTodos(originalTodos);
        localStorage.setItem(`todos_${user.id}`, JSON.stringify(originalTodos));
      }
    });
  };

  // Enable edit mode
  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditPriority(todo.priority);
    setEditDueDate(todo.dueDate || '');
  };

  // Cancel edit mode
  const cancelEditing = () => {
    setEditingId(null);
  };

  // Handler for saving edits (optimistic)
  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim()) return;

    const originalTodos = [...todos];

    // Update client state & localStorage immediately
    const updated = todos.map(t => t.id === id ? { 
      ...t, 
      title: editTitle.trim(), 
      priority: editPriority, 
      dueDate: editDueDate || undefined 
    } : t);
    setTodos(updated);
    localStorage.setItem(`todos_${user.id}`, JSON.stringify(updated));

    setEditingId(null);

    startTransition(async () => {
      try {
        await editTodoAction(id, editTitle, editPriority, editDueDate || undefined);
      } catch (err: any) {
        setErrorMsg('Failed to save task modifications.');
        setTodos(originalTodos);
        localStorage.setItem(`todos_${user.id}`, JSON.stringify(originalTodos));
      }
    });
  };

  // Filter and sort tasks
  const getFilteredAndSortedTodos = () => {
    let result = todos;

    // 1. Text Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(query));
    }

    // 2. Status Filter
    if (statusFilter === 'pending') {
      result = result.filter(t => !t.completed);
    } else if (statusFilter === 'completed') {
      result = result.filter(t => t.completed);
    }

    // 3. Sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'createdAt') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newest first
      }
      
      if (sortBy === 'priority') {
        const priorityVal = { high: 3, medium: 2, low: 1 };
        return priorityVal[b.priority] - priorityVal[a.priority]; // High priority first
      }

      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(); // Soonest first
      }

      return 0;
    });
  };

  const processedTodos = getFilteredAndSortedTodos();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
      {/* LEFT COLUMN: User profile & Stats (4 cols) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* User & Plan Info Card */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-zinc-900 bg-zinc-950/45">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-lg text-white uppercase shadow-md select-none">
              {user.email.substring(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-white truncate">Personal Workspace</h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-bold uppercase tracking-wider">
                  {planInfo.tier === 'free' ? 'Free Plan' : planInfo.tier === 'monthly' ? '₹100 Monthly' : '₹800 Yearly'}
                </span>
                {planInfo.isMock && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] font-semibold uppercase tracking-wider">
                    Sandbox
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="glass-panel rounded-2xl p-6 space-y-6 border border-zinc-900 bg-zinc-950/45">
          <h3 className="text-xs font-bold tracking-wider text-zinc-400 uppercase">Task Stats</h3>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-black/35 p-3 rounded-xl border border-[hsl(var(--card-border))]">
              <div className="text-2xl font-black text-white">{totalTasks}</div>
              <div className="text-[10px] font-semibold text-zinc-500 uppercase mt-0.5">Total</div>
            </div>
            <div className="bg-black/35 p-3 rounded-xl border border-[hsl(var(--card-border))]">
              <div className="text-2xl font-black text-emerald-400">{completedTasks}</div>
              <div className="text-[10px] font-semibold text-zinc-500 uppercase mt-0.5">Done</div>
            </div>
            <div className="bg-black/35 p-3 rounded-xl border border-[hsl(var(--card-border))]">
              <div className="text-2xl font-black text-indigo-400">{pendingTasks}</div>
              <div className="text-[10px] font-semibold text-zinc-500 uppercase mt-0.5">Pending</div>
            </div>
          </div>

          <div className="progress-container relative">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 mb-2">
              <span>Completion Rate</span>
              <span className="font-mono text-indigo-400">{completionPercentage}%</span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Todo Workspace (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Error message alert */}
        {errorMsg && (
          <div className="error-message flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-300 hover:text-white text-xs font-bold">Dismiss</button>
          </div>
        )}

        {/* Task Creator Card */}
        <div className="glass-panel rounded-2xl p-6 relative border border-zinc-900 bg-zinc-950/45">
          <h3 className="text-lg font-bold text-white mb-4">Add a New Task</h3>
          
          <form onSubmit={handleAddTodo} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={isCreationLocked ? "Task limit reached. Upgrade to unlock." : "What needs to be done?"}
                className="form-input flex-1 py-2 px-4 disabled:opacity-50"
                disabled={isPending || isCreationLocked}
                required
              />
              <button 
                type="submit" 
                className="btn-primary py-2 px-6 text-sm flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                disabled={isPending || !newTitle.trim() || isCreationLocked}
              >
                {isPending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                )}
                Add Task
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Priority Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase">Priority Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewPriority(p)}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold border capitalize transition-all ${
                        newPriority === p
                          ? p === 'high'
                            ? 'bg-red-500/15 border-red-500/30 text-red-400'
                            : p === 'medium'
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                            : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                          : 'bg-black/20 border-zinc-800 text-zinc-400 hover:bg-black/30'
                      }`}
                      disabled={isCreationLocked}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date Picker */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase">Due Date (Optional)</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="form-input py-1.5 px-3 text-xs w-full text-zinc-300 placeholder-zinc-600 block disabled:opacity-50"
                  disabled={isPending || isCreationLocked}
                />
              </div>
            </div>
          </form>

          {/* Creation locked warning card */}
          {isCreationLocked && (
            <div className="mt-4 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3 animate-fade-in">
              <svg className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">Task Creation Locked</h4>
                <p className="text-[10px] text-zinc-400 leading-normal">
                  {isFreeLimitReached 
                    ? 'Free Tier accounts have a limit of 10 tasks total. You are currently utilizing all 10 slots.' 
                    : `Monthly Tier accounts have a limit of 30 tasks per month. You have created ${monthlyCreatedCount} tasks this month.`}
                </p>
                <div className="pt-1">
                  <Link href="/dashboard/billing" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline">
                    Upgrade Subscription Tier &rarr;
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Task List Workspace */}
        <div className="glass-panel rounded-2xl p-6 space-y-6 border border-zinc-900 bg-zinc-950/45">
          
          {/* Filters and Search toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[hsl(var(--card-border))] pb-4">
            
            {/* Left toolbar filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['all', 'pending', 'completed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`todo-filter-btn capitalize ${statusFilter === filter ? 'active' : ''}`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Right toolbar controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="form-input py-1 px-3 pl-8 text-xs w-full sm:w-44"
                />
                <svg className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Sort selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="form-input py-1 px-3 text-xs bg-zinc-900 border-zinc-800 text-zinc-300 font-semibold cursor-pointer outline-none rounded-lg"
              >
                <option value="createdAt">Sort: Created</option>
                <option value="priority">Sort: Priority</option>
                <option value="dueDate">Sort: Due Date</option>
              </select>
            </div>
          </div>

          {/* List items */}
          <div className="space-y-3">
            {processedTodos.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-full bg-zinc-900/60 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-zinc-300">No tasks found</h4>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Try adjusting your search query or filter settings.' 
                      : 'You are all caught up! Create a new task above to get started.'}
                  </p>
                </div>
              </div>
            ) : (
              processedTodos.map((todo) => {
                const isEditing = editingId === todo.id;

                return (
                  <div 
                    key={todo.id} 
                    className={`glass-panel todo-item-card rounded-xl p-4 flex flex-col gap-3 border ${
                      todo.completed ? 'opacity-75 border-zinc-900 bg-zinc-950/20' : 'border-zinc-900 bg-zinc-950/45'
                    }`}
                  >
                    {isEditing ? (
                      /* EDITING MODE ROW */
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="form-input flex-1 py-1 px-3 text-sm"
                            required
                          />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              {(['low', 'medium', 'high'] as const).map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => setEditPriority(p)}
                                  className={`py-1 px-2.5 rounded-md text-[10px] font-bold border capitalize transition-all ${
                                    editPriority === p
                                      ? p === 'high'
                                        ? 'bg-red-500/15 border-red-500/30 text-red-400'
                                        : p === 'medium'
                                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                        : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                                      : 'bg-black/20 border-zinc-800 text-zinc-500 hover:text-zinc-400'
                                  }`}
                                >
                                  {p}
                                </button>
                              ))}
                            </div>

                            <input
                              type="date"
                              value={editDueDate}
                              onChange={(e) => setEditDueDate(e.target.value)}
                              className="form-input py-1 px-2.5 text-[10px] text-zinc-300 w-32 border-zinc-800"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSaveEdit(todo.id)}
                              className="btn-primary py-1 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 shadow-none"
                              disabled={!editTitle.trim()}
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="btn-secondary py-1 px-3 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* STANDARD VIEW ROW */
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => handleToggleTodo(todo.id)}
                            className="todo-checkbox mt-0.5"
                          />
                          
                          <div className="min-w-0 flex-1">
                            <p className={`todo-title text-sm font-semibold break-words leading-relaxed text-zinc-200 ${
                              todo.completed ? 'completed' : ''
                            }`}>
                              {todo.title}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                todo.priority === 'high' 
                                  ? 'badge-priority-high' 
                                  : todo.priority === 'medium'
                                  ? 'badge-priority-medium'
                                  : 'badge-priority-low'
                              }`}>
                                {todo.priority}
                              </span>

                              {todo.dueDate && (
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                                  todo.completed 
                                    ? 'bg-zinc-900 border border-zinc-800 text-zinc-500' 
                                    : new Date(todo.dueDate).getTime() < new Date().setHours(0,0,0,0)
                                    ? 'bg-red-500/10 border border-red-500/25 text-red-400'
                                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                                }`}>
                                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {new Date(todo.dueDate).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEditing(todo)}
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                            title="Modify Task"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          
                          <button
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="p-1 rounded hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
                            title="Remove Task"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
