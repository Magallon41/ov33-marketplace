import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth, isFirebaseEnabled } from '../utils/firebase';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification, 
  sendPasswordResetEmail,
  updateProfile, 
  onAuthStateChanged 
} from 'firebase/auth';

const AuthContext = createContext();

// NOTA: El modo de respaldo local (localStorage) es SOLO para desarrollo.
// En producción, Firebase Auth y Firestore manejan toda la autenticación y roles.
// Los roles se leen exclusivamente desde el campo 'role' en el documento del usuario en Firestore.

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);


  const fetchAdminData = async () => {
    if (!isFirebaseEnabled || !db) return;
    try {
      const [usersSnap, subsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'newsletter_subscribers'))
      ]);
      const loadedUsers = [];
      usersSnap.forEach(doc => loadedUsers.push({ id: doc.id, ...doc.data() }));
      setUsers(loadedUsers);

      const loadedSubs = [];
      subsSnap.forEach(doc => loadedSubs.push({ id: doc.id, ...doc.data() }));
      setSubscribers(loadedSubs);
    } catch (error) {
      console.warn("Aviso cargando datos de administración:", error);
    }
  };

  // Initialize Auth and Subscribers
  useEffect(() => {
    let unsubscribe = () => {};

    const initAuth = async () => {
      let loadedUsers = [];
      let loadedSubscribers = [];

      // Los usuarios y suscriptores solo se consultan si el usuario autenticado es Admin
      loadedUsers = loadLocalUsers();
      setUsers(loadedUsers);
      loadedSubscribers = loadLocalSubscribers();
      setSubscribers(loadedSubscribers);

      // 3. Setup Firebase Auth listener or fallback to local storage session
      if (isFirebaseEnabled) {
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const idTokenResult = await firebaseUser.getIdTokenResult();
              const isAdmin = !!idTokenResult.claims.admin;

              const userDocRef = doc(db, 'users', firebaseUser.uid);
              const userDocSnap = await getDoc(userDocRef);
              
              let profileData = {};
              if (userDocSnap.exists()) {
                profileData = userDocSnap.data();
              } else {
                // Nuevo usuario: rol por defecto 'customer'.
                profileData = {
                  name: firebaseUser.displayName || 'Cliente ED',
                  email: firebaseUser.email,
                  role: 'customer',
                  acceptsMarketing: false,
                  createdAt: new Date().toISOString()
                };
                await setDoc(userDocRef, profileData);
              }
              
              setCurrentUser({
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                emailVerified: firebaseUser.emailVerified,
                ...profileData,
                role: isAdmin ? 'admin' : (profileData.role || 'customer')
              });
            } catch (error) {
              console.error("Error loading user profile:", error);
              const idTokenResult = await firebaseUser.getIdTokenResult().catch(() => ({ claims: {} }));
              const isAdmin = !!idTokenResult.claims.admin;
              setCurrentUser({
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                emailVerified: firebaseUser.emailVerified,
                name: firebaseUser.displayName || 'Cliente ED',
                role: isAdmin ? 'admin' : 'customer',
                acceptsMarketing: false,
                createdAt: new Date().toISOString()
              });
            }
          } else {
            setCurrentUser(null);
          }
          setLoading(false);
        });
      } else {
        const activeSession = localStorage.getItem('ed_victory_session');
        if (activeSession) {
          setCurrentUser(JSON.parse(activeSession));
        }
        setLoading(false);
      }
    };

    const loadLocalUsers = () => {
      // Modo solo desarrollo — no se usan usuarios por defecto con contraseñas
      const storedUsers = localStorage.getItem('ed_victory_users');
      if (!storedUsers) return [];
      return JSON.parse(storedUsers);
    };

    const loadLocalSubscribers = () => {
      const stored = localStorage.getItem('ed_victory_subscribers');
      return stored ? JSON.parse(stored) : [];
    };

    initAuth();

    return () => unsubscribe();
  }, []);

  // Update localStorage when users change (fallback mode)
  const saveUsers = (updatedUsers) => {
    setUsers(updatedUsers);
    localStorage.setItem('ed_victory_users', JSON.stringify(updatedUsers));
  };

  // Login
  const login = async (email, password) => {
    if (isFirebaseEnabled) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const idTokenResult = await user.getIdTokenResult();
        const isAdmin = !!idTokenResult.claims.admin;
        
        const userDocSnap = await getDoc(doc(db, 'users', user.uid));
        const profileData = userDocSnap.exists() 
          ? userDocSnap.data() 
          : { name: user.displayName || 'Cliente ED', role: 'customer' };
        
        return {
          id: user.uid,
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          ...profileData,
          role: isAdmin ? 'admin' : (profileData.role || 'customer')
        };
      } catch (error) {
        console.error("Error during Firebase login:", error);
        throw error;
      }
    } else {
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        throw new Error('El correo electrónico no está registrado.');
      }
      if (user.password !== password) {
        throw new Error('La contraseña es incorrecta.');
      }

      setCurrentUser(user);
      localStorage.setItem('ed_victory_session', JSON.stringify(user));
      return user;
    }
  };

  // Register
  const register = async (name, email, password, acceptsMarketing = false) => {
    if (isFirebaseEnabled) {
      try {
        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Set display name in Firebase Auth
        await updateProfile(user, { displayName: name });

        // 3. Save additional fields in Firestore
        // El rol siempre es 'customer' al registrarse. El admin asigna roles manualmente desde Firestore.
        const profile = {
          name,
          email: email.toLowerCase(),
          role: 'customer',
          acceptsMarketing,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', user.uid), profile);

        // 4. Send verification email
        try {
          await sendEmailVerification(user);
        } catch (verifErr) {
          console.warn("Firebase email verification notice:", verifErr);
        }

        // 5. Send welcome email via Resend
        try {
          fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'welcome',
              to: email.toLowerCase(),
              user: { name, email }
            })
          }).catch(err => console.warn("Resend welcome email notice:", err));
        } catch (e) {
          console.warn("Welcome email dispatch notice:", e);
        }

        // 5. Update local users state so dashboard is updated instantly
        const newUser = { id: user.uid, uid: user.uid, ...profile };
        setUsers(prev => {
          if (!prev.some(u => u.id === user.uid)) {
            return [...prev, newUser];
          }
          return prev;
        });

        return newUser;
      } catch (error) {
        console.error("Error during Firebase registration:", error);
        throw error;
      }
    } else {
      const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        throw new Error('Este correo electrónico ya está registrado.');
      }

      // En modo local (desarrollo) no almacenamos contraseñas
      const newUser = {
        id: 'u_' + Date.now(),
        name,
        email: email.toLowerCase(),
        role: 'customer',
        acceptsMarketing,
        createdAt: new Date().toISOString()
      };

      const updatedUsers = [...users, newUser];
      saveUsers(updatedUsers);
      
      setCurrentUser(newUser);
      localStorage.setItem('ed_victory_session', JSON.stringify(newUser));
      return newUser;
    }
  };

  // Logout
  const logout = async () => {
    if (isFirebaseEnabled) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Error during Firebase logout:", error);
      }
    } else {
      setCurrentUser(null);
      localStorage.removeItem('ed_victory_session');
    }
  };

  // Update user role (Admin only)
  const updateUserRole = async (userId, newRole) => {
    const updatedUsers = users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    );
    saveUsers(updatedUsers);
    
    if (currentUser && (currentUser.id === userId || currentUser.uid === userId)) {
      const updatedSelf = { ...currentUser, role: newRole };
      setCurrentUser(updatedSelf);
      localStorage.setItem('ed_victory_session', JSON.stringify(updatedSelf));
    }

    if (isFirebaseEnabled) {
      try {
        await updateDoc(doc(db, 'users', userId), { role: newRole });
      } catch (error) {
        console.error("Error updating user role in Firestore:", error);
      }
    }
  };

  // Delete user (Admin only)
  const deleteUser = async (userId) => {
    if (currentUser && (currentUser.id === userId || currentUser.uid === userId)) {
      throw new Error('No puedes eliminar tu propio usuario mientras estás en sesión.');
    }
    const updatedUsers = users.filter(user => user.id !== userId);
    saveUsers(updatedUsers);

    if (isFirebaseEnabled) {
      try {
        await deleteDoc(doc(db, 'users', userId));
      } catch (error) {
        console.error("Error deleting user from Firestore:", error);
      }
    }
  };

  // Resend Verification Email
  const resendVerificationEmail = async () => {
    if (isFirebaseEnabled && auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
      } catch (error) {
        console.error("Error sending verification email:", error);
        throw error;
      }
    } else {
      throw new Error('La verificación por correo no está disponible en modo local.');
    }
  };

  // Subscribe to Newsletter
  const subscribeToNewsletter = async (email) => {
    const formattedEmail = email.toLowerCase().trim();
    if (!formattedEmail) {
      throw new Error('Por favor ingresa un correo electrónico válido.');
    }

    const exists = subscribers.some(s => s.email.toLowerCase() === formattedEmail);
    if (exists) {
      throw new Error('Este correo electrónico ya está registrado en el boletín.');
    }

    const newSubscriber = {
      id: 'sub_' + Date.now(),
      email: formattedEmail,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseEnabled) {
      try {
        await setDoc(doc(db, 'newsletter_subscribers', newSubscriber.id), newSubscriber);
      } catch (error) {
        console.error("Error saving subscriber to Firestore:", error);
      }
    }

    const updatedSubscribers = [...subscribers, newSubscriber];
    setSubscribers(updatedSubscribers);
    localStorage.setItem('ed_victory_subscribers', JSON.stringify(updatedSubscribers));
    return newSubscriber;
  };

  // Delete Subscriber (Admin only)
  const deleteSubscriber = async (subId) => {
    const updatedSubscribers = subscribers.filter(s => s.id !== subId);
    setSubscribers(updatedSubscribers);
    localStorage.setItem('ed_victory_subscribers', JSON.stringify(updatedSubscribers));

    if (isFirebaseEnabled) {
      try {
        await deleteDoc(doc(db, 'newsletter_subscribers', subId));
      } catch (error) {
        console.error("Error deleting subscriber from Firestore:", error);
      }
    }
  };

  // Send Password Reset Email
  const resetPassword = async (email) => {
    const formattedEmail = email.toLowerCase().trim();
    if (!formattedEmail) {
      throw new Error('Por favor ingresa un correo electrónico válido.');
    }
    if (isFirebaseEnabled) {
      try {
        await sendPasswordResetEmail(auth, formattedEmail);
      } catch (error) {
        console.error("Error sending password reset email:", error);
        throw error;
      }
    } else {
      // Simulación en modo local
      const exists = users.some(u => u.email.toLowerCase() === formattedEmail);
      if (!exists) {
        throw new Error('El correo electrónico no está registrado.');
      }
      return true;
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      users,
      subscribers,
      loading,
      login,
      register,
      logout,
      updateUserRole,
      deleteUser,
      resendVerificationEmail,
      resetPassword,
      subscribeToNewsletter,
      deleteSubscriber
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
