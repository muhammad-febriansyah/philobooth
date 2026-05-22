import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        grecaptcha?: {
            ready: (cb: () => void) => void;
            execute: (
                siteKey: string,
                options: { action: string },
            ) => Promise<string>;
        };
    }
}

/**
 * Load Google reCAPTCHA v3 script once, return helper to execute & get token.
 *
 * @example
 *   const { active, execute } = useRecaptcha({
 *       enabled: recaptchaEnabled,
 *       siteKey: recaptchaSiteKey,
 *   });
 *
 *   async function submit() {
 *       const token = active ? await execute('login') : '';
 *       form.post('/login', { ..., recaptcha_token: token });
 *   }
 */
export function useRecaptcha({
    enabled,
    siteKey,
}: {
    enabled?: boolean;
    siteKey?: string | null;
}) {
    const active = !!(enabled && siteKey);
    const loadedRef = useRef(false);

    useEffect(() => {
        if (!active || loadedRef.current) return;

        const id = 'pb-recaptcha-script';

        if (document.getElementById(id)) {
            loadedRef.current = true;

            return;
        }

        const script = document.createElement('script');
        script.id = id;
        script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
        loadedRef.current = true;
    }, [active, siteKey]);

    async function execute(action: string): Promise<string> {
        if (!active || !window.grecaptcha || !siteKey) {
            return '';
        }

        return new Promise((resolve) => {
            window.grecaptcha!.ready(() => {
                window
                    .grecaptcha!.execute(siteKey, { action })
                    .then(resolve)
                    .catch(() => resolve(''));
            });
        });
    }

    return { active, execute };
}
