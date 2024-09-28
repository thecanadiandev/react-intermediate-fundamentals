import useCounterStore from "./counter/store";
import LoginStatus from "./LoginStatus";

const NavBar = () => {
  const counter = useCounterStore((s) => s.counter);
  console.log("NAVBAR..");
  return (
    <>
      <nav className="navbar d-flex justify-content-between">
        <span className="badge text-bg-secondary">{counter}</span>
        <LoginStatus />
      </nav>
    </>
  );
};

export default NavBar;
