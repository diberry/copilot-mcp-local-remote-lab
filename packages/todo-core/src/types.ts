export type Todo = Readonly<{
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}>;
export type TodoState = Readonly<{ version: number; todos: readonly Todo[] }>;
export interface TodoStorage {
  read(): TodoState;
  write(todos: readonly Todo[]): TodoState;
}
export type Clock = () => string;
