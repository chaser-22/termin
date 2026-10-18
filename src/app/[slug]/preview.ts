"use client";

import { createContext } from "react";

/** Inside the invitation preview: called instead of saving a booking. */
export const PreviewContext = createContext<null | (() => void)>(null);
