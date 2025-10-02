// app/index.tsx
import { Redirect } from 'expo-router';
import React from "react";

export default function Index() {
    // On startup, always redirect root → /login
    return <Redirect href="/login" />;
}
