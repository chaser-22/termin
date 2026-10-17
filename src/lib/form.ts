import { startTransition, type FormEvent } from "react";

/**
 * onSubmit handler that runs a useActionState action without React's automatic
 * form reset, so typed values survive a validation error.
 *
 * Always pair it with `action={action}` on the form: before the page's scripts
 * load, that makes the browser POST to the server action instead of falling back
 * to a GET that would put the typed fields (names, phone numbers) in the URL.
 */
export function submitKeepingValues(action: (data: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
}
