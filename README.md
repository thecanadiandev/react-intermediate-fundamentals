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
