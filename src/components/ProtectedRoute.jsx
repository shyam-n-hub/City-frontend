import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser, isAdmin } = useContext(AuthContext);

  // If user is not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If user is admin, they shouldn't access normal user routes
  if (isAdmin) {
    return <Navigate to="/admin-home" />;
  }

  return children;
}