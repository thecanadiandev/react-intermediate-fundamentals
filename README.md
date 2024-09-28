# React Query

Is a library for managing data fetching, caching etc. Redux is a state management library. It is not great for caching. It comes with a steep learning curve & boilerplate code. Do not use redux for caching purpose.

To install, `npm i @tanstack/react-query@4.28`

To setup

```js
// main.ts
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient();

ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

### Problem with traditional approach

```js
const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    axios
      .get('https://jsonplaceholder.typicode.com/todos')
      .then((res) => setTodos(res.data))
      .catch((error) => setError(error));
  }, []);
}
```

The problem with coupling state with effect within a component is that,

- component gets exposed to the API endpoint logic.
- we cannot cancel the request when component is unmounted
- By default, strict mode runs twice, so we need to cancel the request, since each component runs twice.
- Querying logic is leaked to component
- Need to move them to hook to make the component clean.
- No retry.
- No auto refresh. If the data changes while the page is shown, it doesnt refresh
- No caching.
- Rather than writing more code to address, we can use React Query. Redux is a state management library.
  Not a cache, just an object. Also, needs more boilerplate code. So redux is no longer needed for caching. Do not use redux just for caching.

### React Query points

- For react query, if the component is unmounted, or if number of observers becomes zero, the query becomes inactive and is garbage collected and removed from cache.
- All queries will be inactive after 5 mins. (configurable)
- RQ automatially refreshes stale data in 3 situations
  - when network is reconnected
  - component is mounted
  - window is refocused
- If data is stale, RQ attempts to fetch fresh data from backend while returning same data from cache to components.

### Fetch data

- we no longer need the state slices with useState or effect hook.
- we get auto retry, cache, auto refresh after a time

```js
const TodoList = () => {

  const fetchTodos = () => axios
    .get<Todo[]>('https://jsonplaceholder.typicode.com/todos').then(res => res.data);

  const {data: todos, error, isLoading } = useQuery<Todo[], Error>({
    queryKey: ["todos"],
    queryFn: fetchTodos
  });

  if(isLoading) return <p> loading.. </p>

  return (
    <>
     { todos?.map(todo => <li> ... </li>)}
     { error && <p> { error.message } </p> }
    </>
  )

};
```

### Custom Query hook

- to have seperation of concerns.
- after 10 seconds, the query becomes stale below.

```js
// useTodos.ts
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const useTodos = () => {
  const fetchTodos = () =>
    axios
      .get<Todo[]>('https://jsonplaceholder.typicode.com/todos')
      .then((res) => res.data);

  return useQuery<Todo[], Error>({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    staleTime: 10 * 1000
  });
}
export default useTodos;

// and in component
const { data, error, isLoading } = useTodos()
```

### Adding dev tools

`npm i @tanstack/react-query-devtools@4.28`

and to wire them up,

```js
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient();

ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools/>
    </QueryClientProvider>

  </React.StrictMode>
);
```

This is only for dev build, and wont be included for prod build.
This brings a lotus kind of tool , if we click on it, brings a list. It gives the details of observers, and if 0, it becomes an inactive query and gets garbage collected. All queries have a default cache time of 5 mins. If inactive for 5 mins, they becomes inactive.

### Customize query settings

- per query/ global.
- check Network tab, to see retries. ( provide an invalid endpoint )

```js
// main.ts => Global settings

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      cacheTime: 300_000, // 5 min, inactive, removed from cache and garbage collected.
      staleTime: 10 * 1000, // how long data is considered fresh. After 10 sec, its considered stale data
      // refetchOnWindowFocus: false,
      // refetchOnReconnect: false,
      // refetchOnMount: true
    },
  },
});

// per component

const usePosts = () => useQuery<Post[], Error>({
  queryKey: ['posts'],
  queryFn: () => axios
    .get<Post[]>('https://jsonplaceholder.typicode.com/posts').then(res => res.data),
  staleTime: 1 * 60 * 1000 // 1 minute
})

// in component
const {data, error, isLoading } = usePosts()
```

React query does auto refresh under 3 situations

- when network is reconnected
- component is mounted
- window is refocused. (It is not a bug)

With refetch, RQ tries to fetch the data from backend, while serving the stale one to the component from cache.
Once we have latest data, it updates the cache, notify the component, and re-renders.

### Parameterized queries

- if we need to fetch nested data
- queryKey is created differently when dealing with hierarchial data.

```js

const usePosts = (userId: number | undefined) => useQuery<Post[], Error>({
  queryKey: userId ? ['users', userId, 'posts'] : ['posts'],
  queryFn: () => axios
    .get<Post[]>('https://jsonplaceholder.typicode.com/posts', {
      params: {
        userId
      }
    }).then(res => res.data),
  staleTime: 1 * 60 * 1000 // 1 minute
})

// and in component
const [userId, setUserId] = useState<number>(null);
const { data } = usePosts(userId)
```

The moment the data is in cache, we get instant access to it.

### Paginated query

- to paginate, we define the input as a query object.

```js
interface PostQuery {
  page: number;
  pageSize: number;
}
const usePosts = (query: PostQuery) => useQuery<Post[], Error>({
  queryKey: ['posts', query],
  queryFn: () => axios
    .get<Post[]>('https://jsonplaceholder.typicode.com/posts', {
      params: {
        _start: (query.page - 1) + query.pageSize,
        _limit: query.pageSize
      }
    }).then(res => res.data),
  staleTime: 1 * 60 * 1000, // 1 minute
  keepPreviousData: true // allows smooth shift when clicking next without a flash & jerk.
})

// and in component
const pageSize = 10;
const [page, setPage] = useState(1)l

const { data, error, isLoading } = usePosts({
    page,
    pageSize,
  });
```

### Infinite queries

```js
interface PostQuery {
  pageSize: number;
}

const usePosts = (query: PostQuery) => useInfiniteQuery<Post[], Error>({
  queryKey: ['posts', query],
  // RQ auto passes pageParam
  queryFn: ({ pageParam = 1 }) => axios
    .get<Post[]>('https://jsonplaceholder.typicode.com/posts', {
      params: {
        _start: (pageParam - 1) + query.pageSize,
        _limit: query.pageSize
      }
    }).then(res => res.data),
  staleTime: 1 * 60 * 1000, // 1 minute
  keepPreviousData: true,
  getNextPageParam: (lastPage, allPages) => {
    // logic specific for jsonplaceholder site.
    // logic depends on backend.
    return lastPage.length > 0 ? allPages.length + 1 : undefined
  }
})

// and in component

const PostList = () => {
  const pageSize = 10;
  const { data, error, isLoading, fetchNextPage, isFetchingNextPage } =
    usePosts({
      pageSize,
    });

  return (
    <>
      <ul className="list-group">
        {data.pages.map((page, index) => (
          <React.Fragment key={index}>
            {page.map((post) => (
              <li key={post.id} className="list-group-item">
                {post.title}
              </li>
            ))}
          </React.Fragment>
        ))}
      </ul>

      <button
        onClick={() => fetchNextPage()}
        disabled={isFetchingNextPage}
        className="btn btn-primary my-3 ms-1"
      >
        Load more
      </button>
    </>
  );
};
```

### Mutate data

```js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { Todo } from "./hooks/useTodos";
import axios from "axios";

const TodoForm = () => {
  const queryClient = useQueryClient();
  const addTodo = useMutation({
    mutationFn: (todo: Todo) =>
      axios
        .post<Todo>("https://jsonplaceholder.typicode.com/todos", todo)
        .then((res) => res.data),
    onSuccess: (savedTodo, newTodo) => {
      // INVALIDATE CACHE: SO REFETCH WILL BRING LATEST
      // queryClient.invalidateQueries({
      //   queryKey: ['todos'] // wont work with JSON placeholder
      // })
      // UPDATE DATA IN CACHE DIRECTLY
      queryClient.setQueryData<Todo[]>(["todos"], (todos) => {
        return [savedTodo, ...(todos || [])];
      });
    },
  });
  const ref = useRef<HTMLInputElement>(null);

  return (
    <form
      className="row mb-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (ref.current && ref.current.value) {
          addTodo.mutate({
            id: 0,
            title: ref.current?.value,
            completed: false,
            userId: 1,
          });
        }
      }}
    >
      ...
    </form>
  );
};

export default TodoForm;

```

### Mutation error handling

```js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { Todo } from "./hooks/useTodos";
import axios from "axios";

const TodoForm = () => {
  const queryClient = useQueryClient();
  const addTodo = useMutation<Todo, Error, Todo>({
    mutationFn: (todo: Todo) =>
      axios
        .post<Todo>("https://jsonplaceholder.typicode.com/todos", todo)
        .then((res) => res.data),
    onSuccess: (savedTodo, newTodo) => {
      queryClient.setQueryData<Todo[]>(["todos"], (todos) => {
        return [savedTodo, ...(todos || [])];
      });
      if (ref.current) ref.current.value = "";
    },
  });
  const ref = useRef<HTMLInputElement>(null);

  return (
    <>
      {addTodo.error && (
        <div className="alert alert-danger"> {addTodo.error.message} </div>
      )}
      <form
        className="row mb-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (ref.current && ref.current.value) {
            addTodo.mutate({
              id: 0,
              title: ref.current?.value,
              completed: false,
              userId: 1,
            });
          }
        }}
      >
        <div className="col">
          <input ref={ref} type="text" className="form-control" />
        </div>
        <div className="col">
          <button className="btn btn-primary">Add</button>
        </div>
      </form>
    </>
  );
};

export default TodoForm;

```

### Showing progress

```js
<button disabled={addTodo.isLoading} className="btn btn-primary">
  {addTodo.isLoading ? "Loading" : "Add"}
</button>
```

### Optimistic updates

```js

const addTodo = useMutation<Todo, Error, Todo, AddTodoContext>({
    mutationFn: (todo: Todo) =>
      axios
        .post<Todo>("https://jsonplaceholder.typicode.com/todosx", todo)
        .then((res) => res.data),
        // STEP 1: Implement this hook.
    onMutate: (newTodo: Todo) => {
      // Crete a context
      const previousTodos = queryClient.getQueryData<Todo[]>(["todos"]) || [];
      // OPTIMISTIC UPDATE - Update query cache right away
      queryClient.setQueryData<Todo[]>(["todos"], (todos) => {
        return [newTodo, ...(todos || [])];
      });
      if (ref.current) ref.current.value = "";
      // STEP 2: Return a context object
      return {
        previousTodos,
      };
    },
    onSuccess: (savedTodo, newTodo) => {
      // REPLACE THE OBJECT WITH THE ONE FROM SERVER
      // STEP 4: Replace the new todo with one received from server.
      queryClient.setQueryData<Todo[]>(["todos"], (todos) =>
        todos?.map((todo) => (todo === newTodo ? savedTodo : todo))
      );
    },
    onError: (error, newTodo, context) => {
      if (!context) {
        return;
      }
      // STEP 3: Rollback to previous todos from context
      queryClient.setQueryData<Todo[]>(["todos"], context.previousTodos);
    },
  });
```

### Custom mutation hook

The component should delegate the logic to a hook

```js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Todo } from "./useTodos";
import axios from "axios";
import { CACHE_KEY_TODOS } from "../constants";

interface AddTodoContext {
  previousTodos: Todo[];
}

const useAddTodo = (onAdd: () => void) => {
  const queryClient = useQueryClient();
  return useMutation<Todo, Error, Todo, AddTodoContext>({
    mutationFn: (todo: Todo) =>
      axios
        .post<Todo>("https://jsonplaceholder.typicode.com/todos", todo)
        .then((res) => res.data),
    onMutate: (newTodo: Todo) => {
      const previousTodos = queryClient.getQueryData<Todo[]>(CACHE_KEY_TODOS) || [];
      // OPTIMISTIC UPDATE
      queryClient.setQueryData<Todo[]>(CACHE_KEY_TODOS, (todos = []) => {
        return [newTodo, ...todos];
      });

      onAdd();

      return {
        previousTodos,
      };
    },
    onSuccess: (savedTodo, newTodo) => {
      // REPLACE THE OBJECT WITH THE ONE FROM SERVER
      queryClient.setQueryData<Todo[]>(CACHE_KEY_TODOS, (todos) =>
        todos?.map((todo) => (todo === newTodo ? savedTodo : todo))
      );
    },
    onError: (error, newTodo, context) => {
      if (!context) {
        return;
      }
      queryClient.setQueryData<Todo[]>(CACHE_KEY_TODOS, context.previousTodos);
    },
  });
}

export default useAddTodo;

// and in component
const TodoForm = () => {
  const ref = useRef<HTMLInputElement>(null);
  const addTodo = useAddTodo(() => {
    if (ref.current) ref.current.value = "";
  });
  ...
}

// constants.ts

export const CACHE_KEY_TODOS = ['todos']
```

Here, we have single responsibility principle.

- Component deals with markup & ui logic
- Hook for data management.
- This is called separation of concerns.

### Reusable API client

Querying logic is leaked to hooks.

```js
// Create a reusable apiClient.ts

import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://jsonplaceholder.typicode.com",
});

class APIClient<T> {
  endpoint: string;
  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }
  // make sure this is an arrow function
  getAll = () => {
    return axiosInstance.get<T[]>(this.endpoint).then((res) => res.data);
  }
  post = (data: T) => {
    return axiosInstance.post<T>(this.endpoint, data).then((res) => res.data);
  }
}

export default APIClient
```

and in useTodos hook,

```js
import { useQuery } from "@tanstack/react-query";
import { CACHE_KEY_TODOS } from "../constants";
import APIClient from "../services/apiClient";
const apiClient = new APIClient<Todo>('/todos');

export interface Todo {
  id: number;
  title: string;
  userId: number;
  completed: boolean;
}

const useTodos = () => {
  return useQuery<Todo[], Error>({
    queryKey: CACHE_KEY_TODOS,
    queryFn: apiClient.getAll,
    staleTime: 0
  });
}
export default useTodos;

// and in useAddTodos

const apiClient = new APIClient<Todo>('/todos');
mutationFn: apiClient.post,
```

### Reusable HTTP Service

we need a single instance of API client

```js
// todoService.ts

import APIClient from "./apiClient";

export interface Todo {
  id: number;
  title: string;
  userId: number;
  completed: boolean;
}
export default new APIClient() < Todo > "/todos";

//useTodos.ts

import { useQuery } from "@tanstack/react-query";
import { CACHE_KEY_TODOS } from "../constants";
import todoService, { Todo } from "../services/todoService";

const useTodos = () => {
  return useQuery<Todo[], Error>({
    queryKey: CACHE_KEY_TODOS,
    queryFn: todoService.getAll,
    staleTime: 0
  });
}
export default useTodos;

// and in useAddTodo.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CACHE_KEY_TODOS } from "../constants";
import todoService, { Todo } from "../services/todoService";

interface AddTodoContext {
  previousTodos: Todo[];
}

const useAddTodo = (onAdd: () => void) => {
  const queryClient = useQueryClient();
  return useMutation<Todo, Error, Todo, AddTodoContext>({
    mutationFn: todoService.post,
    onMutate: (newTodo: Todo) => {
      const previousTodos = queryClient.getQueryData<Todo[]>(CACHE_KEY_TODOS) || [];
      // OPTIMISTIC UPDATE
      queryClient.setQueryData<Todo[]>(CACHE_KEY_TODOS, (todos = []) => {
        return [newTodo, ...todos];
      });

      onAdd();

      return {
        previousTodos,
      };
    },
    onSuccess: (savedTodo, newTodo) => {
      // REPLACE THE OBJECT WITH THE ONE FROM SERVER
      queryClient.setQueryData<Todo[]>(CACHE_KEY_TODOS, (todos) =>
        todos?.map((todo) => (todo === newTodo ? savedTodo : todo))
      );
    },
    onError: (error, newTodo, context) => {
      if (!context) {
        return;
      }
      queryClient.setQueryData<Todo[]>(CACHE_KEY_TODOS, context.previousTodos);
    },
  });
}

export default useAddTodo;
```

### Application layer

The below hierarchy offers clean single responsibility for all layers.

```
Component - Uses hook to fetch/update data
Custom hooks - Uses services / fetch/update data / logic for managing data in cache
HTTP Services - instances of API client dedicated to working with specific type of objects(todoService, postService etc)
API Client - The bottom layer, who handles sending http requests
```

## State management

A reducer takes state menegment logic outside a component & centralizes it.

```js
// counterReducer.ts

interface Action {
  type: "INCREMENT" | "DECREMENT" | "RESET";
}
const counterReducer = (state: number, action: Action): number => {
  switch (action.type) {
    case "INCREMENT": {
      return state + 1;
    }
    case "DECREMENT": {
      return state - 1;
    }
    case "RESET": {
      return 0;
    }
  }
};
export default counterReducer;

// Counter.tsx

import counterReducer from "./reducers/counterReducer";

const Counter = () => {
  const [value, dispatch] = useReducer(counterReducer, 0);

  return (
    <div>
      Counter ({value})
      <button
        onClick={() => dispatch({ type: "INCREMENT" })}
        className="btn btn-primary mx-1"
      >
        Increment
      </button>
      <button
        onClick={() => dispatch({ type: "RESET" })}
        className="btn btn-primary mx-1"
      >
        Reset
      </button>
    </div>
  );
};
```

### Complex reducer

```js
interface Task {
  id: number;
  title: string;
}

interface AddTask {
  type: "ADD";
  task: Task;
}

interface DeleteTask {
  type: "DELETE";
  taskId: number;
}

type TaskAction = AddTask | DeleteTask;

const tasksReducer = (tasks: Task[], action: TaskAction): Task[] => {
  if (action.type === "ADD") {
    return [action.task, ...tasks];
  }
  if (action.type === "DELETE") {
    return tasks.filter((task) => task.id !== action.taskId);
  } else return tasks;
};
export default tasksReducer;
```

## Context

- Lifting state up to parents isnt easy.
- Passing down as props beings tight coupling.
- Context helps share data without middleman components.
- Context is like a truck for transporting data

```js
// taskContext.ts

import { Task, TaskAction } from "../reducers/tasksReducer";
import { Dispatch, createContext } from 'react';

interface TasksContextType {
  tasks: Task,
  dispatch: Dispatch<TaskAction>
}

const TasksContext = createContext<TasksContextType>({} as TasksContextType)

export default TasksContext;
```

we can wrap the context anywhere in the hierarchy, and the children of that context gets access to it from anywhere down the tree.

```js
function App() {
  const [tasks, dispatch] = useReducer(tasksReducer, []);
  return (
    <>
      <TasksContext.Provider value={{ tasks, dispatch }}>
        <NavBar />
        <HomePage />
      </TasksContext.Provider>
    </>
  );
}
```

and then, we can grab the context and whatever it exposes.

```js
import { useContext } from "react";
import TasksContext from "./contexts/taskContext";

const TaskList = () => {
  const context = useContext(TasksContext);
  return (
    <>
      <button
        onClick={() =>
          context.dispatch({
            type: "ADD",
            task: { id: Date.now(), title: "Task " + Date.now() },
          })
        }
        className="btn btn-primary my-3"
      >
        Add Task
      </button>
      <ul className="list-group">
        {context.tasks.map((task) => (
          <li
            key={task.id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <span className="flex-grow-1">{task.title}</span>
            <button
              className="btn btn-outline-danger"
              onClick={() =>
                context.dispatch({ type: "DELETE", taskId: task.id })
              }
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </>
  );
};

export default TaskList;
```

or we can also use the Consumer type syntax within the JSX

```js
const NavBar = () => {
  return (
    <TasksContext.Consumer>
      {(context) => {
        return (
          <nav className="navbar d-flex justify-content-between">
            <span className="badge text-bg-secondary">
              {context.tasks.length}
            </span>
            <LoginStatus />
          </nav>
        );
      }}
    </TasksContext.Consumer>
  );
};
```

### Provider approach

```js
// TaskProvider.tsx

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

// and consume them in components

import TaskProvider from "./state-management/TaskProvider";

function App() {
  return (
    <TaskProvider>
      <NavBar />
      <HomePage />
    </TaskProvider>
  );
}
```
