import { useLocation, useParams, useSearchParams } from "react-router-dom";

const UserDetail = () => {
  const params = useParams();
  // searchParams.toString(), serahParams.get('whatever')
  const [searchParams, setSearchParams] = useSearchParams();

  // search,path etc
  const location = useLocation();

  return <p>User {params.id}</p>;
};

export default UserDetail;
