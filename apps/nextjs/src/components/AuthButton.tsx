"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import {
  firebaseSignOut,
  signInWithGooglePopUp,
  signInWithPassword,
} from "~/lib/firebase/firebaseClientAuth";
import { useAuth } from "~/providers/AuthProvider";
import { useTRPC } from "~/trpc/react";

export function AuthButtons() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const trpcClient = useTRPC();

  const loginMutation = useMutation(trpcClient.auth.login.mutationOptions());
  const logoutMutation = useMutation(trpcClient.auth.signOut.mutationOptions());

  const handlePasswordSignIn = async (email: string, password: string) => {
    const session = await signInWithPassword({ email, password });
    const accessToken = await session.user.getIdToken();
    if (accessToken) {
      void loginMutation.mutateAsync({ token: accessToken });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const session = await signInWithGooglePopUp();
      const accessToken = await session.user.getIdToken();
      if (accessToken) {
        void loginMutation.mutateAsync({ token: accessToken });
      }
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut();
      await logoutMutation.mutateAsync();
      // User state will update via onAuthStateChanged in useAuth
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.displayName ?? user.email}</p>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      ) : (
        <>
          <button onClick={handleGoogleSignIn}>Sign In with Google</button>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={async () => {
              await handlePasswordSignIn(email, password);
            }}
          >
            Sign In
          </button>
        </>
      )}
    </div>
  );
}
