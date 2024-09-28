
interface Action {
  type: 'INCREMENT' | 'DECREMENT' | 'RESET';
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
}
export default counterReducer