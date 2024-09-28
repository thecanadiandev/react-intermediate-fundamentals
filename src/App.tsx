import "./App.css";
import Counter from "./state-management/Counter";
import HomePage from "./state-management/HomePage";
import NavBar from "./state-management/NavBar";
import TaskProvider from "./state-management/TaskProvider";

function App() {
  return (
    <>
      <NavBar />
      <Counter />
    </>
  );
}

export default App;
