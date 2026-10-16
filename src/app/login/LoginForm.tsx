"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { loginAction } from "./actions";
import { AUTH_INPUT } from "@/lib/theme";

const DEVICE_TOKEN_KEY = "fixitn_device";

function getOrCreateDeviceToken(): string {
  let token = localStorage.getItem(DEVICE_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
  }
  return token;
}

export function LoginForm() {
  const [deviceToken, setDeviceToken] = useState("");
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    setDeviceToken(getOrCreateDeviceToken());
  }, []);

  return (
    <form action={loginAction} className="flex flex-col gap-4">
      <input type="hidden" name="deviceToken" value={deviceToken} />

      {error && (
        <p className="rounded-xl bg-danger/20 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="phone" className="text-sm font-medium text-white">
          Phone number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          placeholder="2XXXXXXX"
          className={`mt-1.5 ${AUTH_INPUT}`}
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-white">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-brand-orange"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="••••••••"
          className={`mt-1.5 ${AUTH_INPUT}`}
        />
      </div>

      <Button type="submit" size="lg" fullWidth className="mt-2">
        Log In
      </Button>

      <p className="text-center text-sm text-white/70">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-brand-orange">
          Sign up
        </Link>
      </p>
    </form>
  );
}