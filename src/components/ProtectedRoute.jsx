import { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ref, get } from "firebase/database";
import { db } from "../firebase-config";

export default function ProtectedRoute({ children }) {
  const { currentUser, isAdmin } = useContext(AuthContext);
  const [userDetailsExist, setUserDetailsExist] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkUserDetails = async () => {
      if (currentUser && !isAdmin) {
        try {
          const userDetailsRef = ref(db, `userDetails/${currentUser.uid}`);
          const snapshot = await get(userDetailsRef);
          setUserDetailsExist(snapshot.exists());
        } catch (error) {
          console.error("Error checking user details:", error);
          setUserDetailsExist(false);
        }
      }
      setChecking(false);
    };

    checkUserDetails();
  }, [currentUser, isAdmin]);

  // If user is not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If user is admin, they shouldn't access normal user routes
  if (isAdmin) {
    return <Navigate to="/admin-home" />;
  }

  // Show loading while checking user details
  if (checking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        width: '100%'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // If user details don't exist, redirect to user details page
  if (userDetailsExist === false) {
    return <Navigate to="/user-details" />;
  }

  return children;
}