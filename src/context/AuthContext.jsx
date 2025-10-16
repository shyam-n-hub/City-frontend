import { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { auth, db as database } from "../firebase-config";
import { ref, set, get } from "firebase/database";

export const AuthContext = createContext();

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const adminEmails = [
    "shyam44n@gmail.com",
    "admin2@example.com", 
    "admin3@example.com",
    "admin4@example.com"
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Check if user is admin
        const userIsAdmin = adminEmails.includes(user.email);
        setIsAdmin(userIsAdmin);
        
        // Store user info in localStorage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('uid', user.uid);
        localStorage.setItem('isAdmin', userIsAdmin.toString());
        
        // Get additional user data from database
        try {
          const userRef = ref(database, `users/${user.uid}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            const userData = snapshot.val();
            localStorage.setItem('userData', JSON.stringify(userData));
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        // Clear stored data on logout
        setIsAdmin(false);
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('uid');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        localStorage.removeItem('firebaseAuthUser');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Store authentication token
      const token = await user.getIdToken();
      localStorage.setItem('authToken', token);
      
      return userCredential;
    } catch (error) {
      throw error;
    }
  };

  const signup = async (email, password, name) => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user data
      const userData = {
        name: name,
        email: email,
        profileImage: "/default-image.jpg",
        resumeLink: "",
        createdAt: new Date().toISOString(),
      };
      
      // Store user data in database
      await set(ref(database, `users/${user.uid}`), userData);
      
      // Store authentication token
      const token = await user.getIdToken();
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('firebaseAuthUser', JSON.stringify(userData));
      
      return userCredential;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value = {
    currentUser,
    isAdmin,
    loading,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};