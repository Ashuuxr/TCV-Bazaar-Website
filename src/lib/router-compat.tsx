/**
 * Compat shim: matches the subset of `react-router` v7 APIs the ported
 * TCV Bazaar screens use, backed by @tanstack/react-router.
 */
import { forwardRef, type ComponentProps } from "react";
import {
  Link as TLink,
  Navigate as TNavigate,
  Outlet as TOutlet,
  useNavigate as tUseNavigate,
  useLocation as tUseLocation,
  useRouter,
  useSearch,
} from "@tanstack/react-router";

export const Outlet = TOutlet;
export const Navigate = TNavigate as unknown as (props: {
  to: string;
  replace?: boolean;
}) => React.ReactElement;

type LinkProps = Omit<ComponentProps<"a">, "href"> & {
  to: string;
  replace?: boolean;
  end?: boolean;
  state?: unknown;
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, replace, end: _end, state: _state, ...rest }, ref) => {
    // TanStack Link accepts absolute path strings for non-parametric routes.
    return (
      <TLink
        ref={ref}
        to={to as never}
        replace={replace}
        {...(rest as Record<string, unknown>)}
      />
    );
  }
);
Link.displayName = "Link";

type NavLinkClass =
  | string
  | ((state: { isActive: boolean; isPending: boolean }) => string);

type NavLinkProps = Omit<LinkProps, "className" | "children"> & {
  className?: NavLinkClass;
  children?:
    | React.ReactNode
    | ((state: { isActive: boolean; isPending: boolean }) => React.ReactNode);
  end?: boolean;
};

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ to, end, className, children, replace, ...rest }, ref) => {
    const loc = tUseLocation();
    const path = to.split("?")[0].split("#")[0];
    const cur = loc.pathname.replace(/\/$/, "") || "/";
    const norm = path.replace(/\/$/, "") || "/";
    const isActive = end ? cur === norm : cur === norm || cur.startsWith(norm + "/");
    const state = { isActive, isPending: false };
    const cls = typeof className === "function" ? className(state) : className;
    const kids = typeof children === "function" ? children(state) : children;
    return (
      <TLink
        ref={ref}
        to={to as never}
        replace={replace}
        className={cls}
        data-active={isActive || undefined}
        {...(rest as Record<string, unknown>)}
      >
        {kids}
      </TLink>
    );
  }
);
NavLink.displayName = "NavLink";

export function useNavigate() {
  const navigate = tUseNavigate();
  return (to: string | number, opts?: { replace?: boolean; state?: unknown }) => {
    if (typeof to === "number") {
      if (typeof window !== "undefined") window.history.go(to);
      return;
    }
    const [pathAndQuery, hash] = to.split("#");
    const [pathname, queryStr] = pathAndQuery.split("?");
    const search: Record<string, string> = {};
    if (queryStr) {
      for (const [k, v] of new URLSearchParams(queryStr).entries()) search[k] = v;
    }
    navigate({
      to: pathname as never,
      search: search as never,
      hash: hash || undefined,
      replace: opts?.replace,
    });
  };
}

export function useLocation() {
  return tUseLocation();
}

/** Minimal useSearchParams shim (get/set/delete only). */
export function useSearchParams(): [
  URLSearchParams,
  (
    next:
      | URLSearchParams
      | Record<string, string>
      | ((prev: URLSearchParams) => URLSearchParams | Record<string, string>),
    opts?: { replace?: boolean }
  ) => void
] {
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const router = useRouter();
  const loc = tUseLocation();

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(search || {})) {
    if (v == null) continue;
    params.set(k, String(v));
  }

  const setParams: ReturnType<typeof useSearchParams>[1] = (next, opts) => {
    const resolved =
      typeof next === "function" ? next(new URLSearchParams(params)) : next;
    let out: Record<string, string> = {};
    if (resolved instanceof URLSearchParams) {
      for (const [k, v] of resolved.entries()) out[k] = v;
    } else {
      out = { ...resolved };
    }
    router.navigate({
      to: loc.pathname as never,
      search: out as never,
      replace: opts?.replace,
    });
  };

  return [params, setParams];
}