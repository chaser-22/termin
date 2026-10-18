import { ViewTransition, type ReactNode } from "react";

/**
 * Wraps a page so it glides in when you navigate to it and fades out when you
 * leave (styles: .page-in / .page-out in globals.css). Updates on the same
 * page, like saving a form, don't animate the whole page.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      {children}
    </ViewTransition>
  );
}
