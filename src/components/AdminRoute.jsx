import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { currentUser, isAdmin } = useContext(AuthContext);

  // If user is not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If user is not admin, redirect to home
  if (!isAdmin) {
    return <Navigate to="/adminHome" />;
  }

  return children;
}