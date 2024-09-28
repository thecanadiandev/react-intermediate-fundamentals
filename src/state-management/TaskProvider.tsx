import { useReducer } from "react";
import TasksContext from "./contexts/taskContext";
import tasksReducer from "./reducers/tasksReducer";

interface TaskProviderProps {
  children: React.ReactNode;
}
const TaskProvider = ({ children }: TaskProviderProps) => {
  const [tasks, dispatch] = useReducer(tasksReducer, []);
  return (
    <>
      <TasksContext.Provider
        value={{
          tasks,
          dispatch,
        }}
      >
        {children}
      </TasksContext.Provider>
    </>
  );
};

export default TaskProvider;
