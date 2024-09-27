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
