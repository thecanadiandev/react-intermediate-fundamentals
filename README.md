### Explanations

The problem with coupling state with effect within a component is that,

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

- we cannot cancel when unmounted
- By default, strict mode runs twice, so we need to cancel the request, else request runs twice.
- Querying logic is leaked to component
- Need to move them to hook
- No retry.
- No auto refresh. If the data changes while the page is shown, it doesnt refresh
- No caching
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

### Query config

- rather than passing a config to global query client, it is better to do it on a per query basis

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
    }
  }
});

// Per query
const usePosts = () => useQuery<Post[], Error>({
  queryKey: ['posts'],
  queryFn: () => axios
    .get<Post[]>('https://jsonplaceholder.typicode.com/posts').then(res => res.data),
  staleTime: 1 * 60 * 1000 // 1 minute
})

// Another example

const useTodos = () => {
  const fetchTodos = () =>
    axios
      .get<Todo[]>('https://jsonplaceholder.typicode.com/todos')
      .then((res) => res.data);

  // benefits: auto retry, auto refresh , caching,
  return useQuery<Todo[], Error>({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    staleTime: 10 * 1000
  });
}
```

### Parameterized Query

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
```

### Paginated queries

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
  keepPreviousData: true
})

// and in component
const { data, error, isLoading } = usePosts({
    page,
    pageSize,
  });
```

### Infinite Queries

```js
interface PostQuery {
  pageSize: number;
}

const usePosts = (query: PostQuery) => useInfiniteQuery<Post[], Error>({
  queryKey: ['posts', query],
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
