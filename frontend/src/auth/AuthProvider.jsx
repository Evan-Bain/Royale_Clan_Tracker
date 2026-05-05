import { useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "../firebase.js";
import { AuthContext } from "./AuthContext.js";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(auth));

  useEffect(() => {
    if (!auth) {
      return undefined;
    }

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      authLoading,
      isFirebaseConfigured,
      async signUp({ email, password, displayName }) {
        if (!auth) {
          throw new Error("Firebase is not configured.");
        }

        const credential = await createUserWithEmailAndPassword(auth, email, password);

        if (displayName) {
          await updateProfile(credential.user, { displayName });
        }

        return credential.user;
      },
      async login({ email, password }) {
        if (!auth) {
          throw new Error("Firebase is not configured.");
        }

        const credential = await signInWithEmailAndPassword(auth, email, password);
        return credential.user;
      },
      async logout() {
        if (auth) {
          await signOut(auth);
        }
      },
      async getIdToken() {
        if (!auth?.currentUser) {
          return "";
        }

        return auth.currentUser.getIdToken();
      },
    }),
    [authLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
