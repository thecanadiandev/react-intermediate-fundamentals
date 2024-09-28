import useCounterStore from "./counter/store";

const Counter = () => {
  const { counter, max, increment, reset } = useCounterStore();

  return (
    <div>
      Counter ({counter}) Max {max}
      <button onClick={() => increment()} className="btn btn-primary mx-1">
        Increment
      </button>
      <button onClick={() => reset()} className="btn btn-primary mx-1">
        Reset
      </button>
    </div>
  );
};

export default Counter;
