import "./App.css";
import HomePage from "./state-management/HomePage";
import NavBar from "./state-management/NavBar";
import TaskProvider from "./state-management/TaskProvider";

function App() {
  return (
    <TaskProvider>
      <NavBar />
      <HomePage />
    </TaskProvider>
  );
}

export default App;
