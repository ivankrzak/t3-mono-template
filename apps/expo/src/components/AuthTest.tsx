import { useState } from "react";
import { Button, KeyboardAvoidingView, TextInput, View } from "react-native";
import { FirebaseError } from "@firebase/util";
import auth from "@react-native-firebase/auth";

import { setToken } from "~/utils/session-store";

export const AuthTest = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signUp = async () => {
    setLoading(true);
    try {
      await auth().createUserWithEmailAndPassword(email, password);
      alert("User account created & signed in!");
    } catch (error: unknown) {
      if (
        error instanceof FirebaseError &&
        error.code === "auth/email-already-in-use"
      ) {
        alert("That email address is already in use!");
      } else if (
        error instanceof FirebaseError &&
        error.code === "auth/invalid-email"
      ) {
        alert("That email address is invalid!");
      } else {
        alert(error instanceof Error ? error.message : String(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    setLoading(true);
    try {
      const signedInUser = await auth().signInWithEmailAndPassword(
        email,
        password,
      );
      const token = await signedInUser.user.getIdToken();
      setToken(token);
      alert("User account signed in!");
    } catch (error: unknown) {
      if (
        error instanceof FirebaseError &&
        error.code === "auth/user-not-found"
      ) {
        alert("That email address is not registered!");
      } else if (
        error instanceof FirebaseError &&
        error.code === "auth/wrong-password"
      ) {
        alert("That password is invalid!");
      } else {
        alert(error instanceof Error ? error.message : String(error));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <KeyboardAvoidingView>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button title="Sign Up" onPress={signUp} />
        <Button title="Sign In" onPress={signIn} />
      </KeyboardAvoidingView>
    </View>
  );
};
