import { Navigate, Outlet } from "react-router-dom";
import UserListPage from "./UserList";
import useAuth from "./hooks/useAuth";

const UsersPage = () => {
  return (
    <div>
      <div className="row">
        <div className="col">
          <UserListPage />
        </div>
        <div className="col">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
