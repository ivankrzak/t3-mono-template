"use client";

import type { AuthError } from "firebase/auth";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";

import type { User } from "@acme/db";

import {
  firebaseAuth,
  signInWithPassword as firebaseSignInWithPassword,
  firebaseSignOut,
  signInWithGooglePopUp,
  signUpWithPassword,
} from "~/lib/firebase/firebaseClientAuth";
import { useTRPC } from "~/trpc/react";

interface AuthContextType {
  userData: User | null;
  isLoading: boolean;
  isFirebaseInitializing: boolean;
  signOut: (shouldRedirect?: boolean) => Promise<void>;
  signInWithEmailAndPassword: ({
    email,
    password,
    shouldRedirect,
  }: {
    email: string;
    password: string;
    shouldRedirect?: boolean;
  }) => Promise<boolean>;
  createUserWithGoogleOAuth: () => Promise<boolean>;
  refetchAndSetUserData: () => Promise<void>;
}

const AuthContext = createContext({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userData, setUserData] = useState<User | null>(null);
  const [isFirebaseInitializing, setIsFirebaseInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthSignUp, setIsOAuthSignUp] = useState(false);
  const trpcClient = useTRPC();
  const router = useRouter();

  const loginMutation = useMutation(trpcClient.auth.login.mutationOptions());
  const signUpMutation = useMutation(trpcClient.auth.signUp.mutationOptions());
  const logoutMutation = useMutation(trpcClient.auth.signOut.mutationOptions());
  const userMeQuery = useQuery(
    trpcClient.user.userMe.queryOptions(undefined, {
      retry: false,
    }),
  );

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
  //     setUser(user);
  //     setIsLoading(false);
  //   });

  //   // Cleanup subscription on unmount
  //   return () => unsubscribe();
  // }, []);

  const signInWithEmailAndPassword = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      const session = await firebaseSignInWithPassword({ email, password });
      const accessToken = await session.user.getIdToken();
      if (accessToken) {
        await loginMutation.mutateAsync({ token: accessToken });
        return true;
      }
      return false;
    } catch (error) {
      const err = error as AuthError;
      switch (err.code) {
        case "auth/invalid-email":
        case "auth/wrong-password":
        case "auth/user-not-found":
          alert({
            description: "Neplatný email alebo heslo",
          });
          break;
        case "auth/network-request-failed":
          alert({
            description:
              "Vyskytla sa chyba s intenetovým pripojením. Prosím skúste znova.",
          });
          break;
        default:
          // Sentry.captureException(err);
          alert({
            description: "Neplatný email alebo heslo",
          });
      }

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createUserWithGoogleOAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsOAuthSignUp(true);

      await signInWithGooglePopUp()
        .then(async (result) => {
          if (result.user.email) {
            await signUpMutation.mutateAsync({
              email: result.user.email,
              firebaseUid: result.user.uid,
              image: result.user.photoURL ?? "",
              name: result.user.displayName ?? "",
            });
          }
        })
        .catch((error) => {
          console.log("error", error);
          return false;
        })
        .finally(() => {
          setIsOAuthSignUp(false);
        });
      return true;
    } catch (error) {
      console.log("error", error);
      // Sentry.captureException(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [signUpMutation]);

  const createUserWithEmailAndPassword = useCallback(
    async ({
      email,
      password,
      name,
      image,
    }: {
      email: string;
      password: string;
      name: string;
      image: string;
    }) => {
      try {
        setIsLoading(true);
        const firebaseUser = await signUpWithPassword({ email, password });
        const response = await signUpMutation.mutateAsync({
          email,
          firebaseUid: firebaseUser.user.uid,
          image,
          name,
        });

        if (!response.email) {
          alert("could not create account");
          return;
        }

        const userToken = await firebaseUser.user.getIdToken();
        await loginMutation.mutateAsync({ token: userToken });
      } catch (error) {
        console.log("error", error);
        // Sentry.captureException(error);
      } finally {
        setIsLoading(false);
      }
    },
    [loginMutation, signUpMutation],
  );

  const signOut = useCallback(
    async (shouldRedirect = true) => {
      try {
        setIsLoading(true);
        await firebaseSignOut();
        await logoutMutation.mutateAsync();
        if (shouldRedirect) {
          void router.push("/");
        }
      } catch (error) {
        console.log("error", error);
        // Sentry.captureException(error);
      } finally {
        void router.push("/");
        setIsLoading(false);
      }
    },
    [logoutMutation, router],
  );

  const refetchAndSetUserData = useCallback(async () => {
    try {
      const refetchedUser = (await userMeQuery.refetch()).data;

      if (!refetchedUser) {
        alert({ description: "Refetch user me failed" });
      }

      if (refetchedUser) {
        // Sentry.setUser({ email: response.data.userMe.email });
        setUserData(refetchedUser);
      } else {
        alert({ description: "Refetch user me failed" });
      }
    } catch (error) {
      console.log("error", error);
      // Sentry.captureException(error);
      await signOut();
    }
  }, [signOut, userMeQuery]);

  useEffect(() => {
    if (!isOAuthSignUp) {
      const subscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
        if (firebaseUser) {
          void (async () => {
            await refetchAndSetUserData();
            setIsFirebaseInitializing(false);
          })();
        } else {
          setUserData(null);
          setIsFirebaseInitializing(false);
        }
      });
      return subscribe;
    }
  }, [isOAuthSignUp]);

  const value = {
    userData,
    isFirebaseInitializing,
    isLoading,
    signInWithEmailAndPassword,
    signOut,
    refetchAndSetUserData,
    createUserWithEmailAndPassword,
    createUserWithGoogleOAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};
