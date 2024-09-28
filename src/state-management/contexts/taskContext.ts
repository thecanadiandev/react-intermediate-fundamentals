import { Task, TaskAction } from "../reducers/tasksReducer";
import { Dispatch, createContext } from 'react';

interface TasksContextType {
  tasks: Task[],
  dispatch: Dispatch<TaskAction>
}

const TasksContext = createContext<TasksContextType>({} as TasksContextType)

export default TasksContext;