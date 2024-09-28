import LoginStatus from "./LoginStatus";
import TasksContext from "./contexts/taskContext";

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

export default NavBar;
