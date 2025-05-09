"use client";

import { useState } from "react";

import { useAuth } from "~/providers/AuthProvider";

export function AuthButtons() {
  const {
    userData,
    isLoading,
    signInWithEmailAndPassword,
    createUserWithGoogleOAuth,
    signOut,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      {userData ? (
        <div>
          <p>Welcome, {userData.name ?? userData.email}</p>
          <button
            onClick={() => {
              void signOut();
            }}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => {
              void createUserWithGoogleOAuth();
            }}
          >
            Sign In with Google
          </button>
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
              await signInWithEmailAndPassword({ email, password });
            }}
          >
            Sign In
          </button>
        </>
      )}
    </div>
  );
}
