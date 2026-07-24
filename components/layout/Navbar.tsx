"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Heart,
  Infinity as InfinityIcon,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  User,
  X,
} from "lucide-react";

import Button from "../ui/Button";
import NavLink from "../ui/NavLink";
import { navigationLinks } from "@/data/navigation";
import { createClient } from "@/lib/supabase/client";

type UserRole = "admin" | "student" | null;

export default function Navbar() {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [isAuthenticated, setIsAuthenticated] =
    useState(false);

  const [userRole, setUserRole] =
    useState<UserRole>(null);

  const [authReady, setAuthReady] =
    useState(false);

  const [isSigningOut, setIsSigningOut] =
    useState(false);

  const isAdmin = userRole === "admin";

  const accountPanelHref = isAdmin
    ? "/admin"
    : "/dashboard";

  const accountPanelTitle = isAdmin
    ? "لوحة الإدارة"
    : "لوحة التحكم";

  const closeMenu = () => {
    setMenuOpen(false);
  };

  useEffect(() => {
    let isMounted = true;

    const loadUserRole = async (
      userId: string | null
    ) => {
      if (!userId) {
        if (isMounted) {
          setUserRole(null);
        }

        return;
      }

      const {
        data: profile,
        error,
      } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error(
          "تعذر تحميل صلاحية المستخدم:",
          error
        );

        setUserRole("student");
        return;
      }

      setUserRole(
        profile?.role === "admin"
          ? "admin"
          : "student"
      );
    };

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      setIsAuthenticated(Boolean(user));

      await loadUserRole(
        user?.id ?? null
      );

      if (isMounted) {
        setAuthReady(true);
      }
    };

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) {
          return;
        }

        const user =
          session?.user ?? null;

        setIsAuthenticated(Boolean(user));
        setAuthReady(false);

        void loadUserRole(
          user?.id ?? null
        ).finally(() => {
          if (isMounted) {
            setAuthReady(true);
          }
        });
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      const { error } =
        await supabase.auth.signOut({
          scope: "local",
        });

      if (error) {
        throw error;
      }

      setIsAuthenticated(false);
      setUserRole(null);
      closeMenu();

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error(
        "تعذر تسجيل الخروج:",
        error
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#09090B]/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link
          href="/"
          onClick={closeMenu}
          aria-label="Infinity Academy - الصفحة الرئيسية"
          className="flex items-center gap-3"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-900/30">
            <InfinityIcon
              size={27}
              className="text-white"
            />
          </span>

          <div className="hidden sm:block">
            <p className="text-xl font-black text-white">
              Infinity
              <span className="mr-1 text-purple-400">
                Academy
              </span>
            </p>

            <p className="mt-1 text-[11px] text-zinc-500">
              تعلم بلا حدود
            </p>
          </div>
        </Link>

        <nav
          className="hidden items-center gap-7 lg:flex"
          aria-label="القائمة الرئيسية"
        >
          {navigationLinks.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              title={link.title}
            />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="البحث"
            title="البحث"
            className="hidden h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition duration-300 hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-white xl:flex"
          >
            <Search size={19} />
          </button>

          <button
            type="button"
            aria-label="المفضلة"
            title="المفضلة"
            className="hidden h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition duration-300 hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-white xl:flex"
          >
            <Heart size={19} />
          </button>

          <div className="hidden md:block">
            {!authReady ? (
              <div className="h-11 w-32 animate-pulse rounded-xl border border-white/10 bg-white/5" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Button
                  href={accountPanelHref}
                  variant="secondary"
                  className="h-11 px-4 text-sm"
                >
                  {isAdmin ? (
                    <ShieldCheck size={18} />
                  ) : (
                    <LayoutDashboard size={18} />
                  )}

                  {accountPanelTitle}
                </Button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  aria-busy={isSigningOut}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 text-sm font-bold text-red-300 transition hover:border-red-500/50 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSigningOut ? (
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <LogOut size={18} />
                  )}

                  {isSigningOut
                    ? "جارٍ الخروج..."
                    : "تسجيل الخروج"}
                </button>
              </div>
            ) : (
              <Button
                href="/login"
                variant="secondary"
                className="h-11 px-4 text-sm"
              >
                <User size={18} />
                تسجيل الدخول
              </Button>
            )}
          </div>

          <div className="hidden sm:block">
            <Button
              href="/pricing"
              className="h-11 px-5 text-sm"
            >
              اشترك الآن
            </Button>
          </div>

          <button
            type="button"
            onClick={() =>
              setMenuOpen(
                (current) => !current
              )
            }
            aria-label={
              menuOpen
                ? "إغلاق القائمة"
                : "فتح القائمة"
            }
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition duration-300 hover:border-purple-500/50 hover:bg-purple-500/10 lg:hidden"
          >
            {menuOpen ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="mobile-menu"
          className="border-t border-white/10 bg-[#0D0D14] px-5 py-5 shadow-2xl shadow-black/40 lg:hidden"
        >
          <nav
            className="mx-auto flex max-w-7xl flex-col gap-2"
            aria-label="قائمة الهاتف"
          >
            {navigationLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                title={link.title}
                mobile
                onClick={closeMenu}
              />
            ))}
          </nav>

          <div className="mx-auto mt-5 grid max-w-7xl gap-3 sm:grid-cols-2">
            {!authReady ? (
              <div className="h-12 animate-pulse rounded-xl border border-white/10 bg-white/5" />
            ) : isAuthenticated ? (
              <>
                <Link
                  href={accountPanelHref}
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/10 px-3 py-3 text-sm font-semibold text-white transition hover:bg-purple-500/20"
                >
                  {isAdmin ? (
                    <ShieldCheck size={17} />
                  ) : (
                    <LayoutDashboard size={17} />
                  )}

                  {accountPanelTitle}
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSigningOut ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <LogOut size={17} />
                  )}

                  {isSigningOut
                    ? "جارٍ الخروج..."
                    : "تسجيل الخروج"}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={closeMenu}
                className="flex items-center justify-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/10 px-3 py-3 text-sm font-semibold text-white transition hover:bg-purple-500/20"
              >
                <User size={17} />
                تسجيل الدخول
              </Link>
            )}

            <Link
              href="/pricing"
              onClick={closeMenu}
              className={`flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-3 text-sm font-bold text-white shadow-lg shadow-purple-950/40 transition hover:brightness-110 ${
                isAuthenticated
                  ? "sm:col-span-2"
                  : ""
              }`}
            >
              اشترك الآن
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}