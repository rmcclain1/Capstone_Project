// app/index.tsx
import { Redirect } from 'expo-router';
import React from "react";

/**
 * On startup, always redirect root → /login
 * @returns A command to redirect back to the login page
 */
export default function Index() {
    return <Redirect href="/login" />;
}
