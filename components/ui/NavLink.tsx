"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkProps = {
  href: string;
  title: string;
  mobile?: boolean;
  onClick?: () => void;
};

export default function NavLink({
  href,
  title,
  mobile = false,
  onClick,
}: NavLinkProps) {
  const pathname = usePathname();

  const isActive =
    href === "/"
      ? pathname === "/"
      : pathname === href ||
        pathname.startsWith(`${href}/`);

  if (mobile) {
    return (
      <Link
        href={href}
        onClick={onClick}
        aria-current={isActive ? "page" : undefined}
        className={`rounded-xl px-4 py-3 font-semibold transition duration-300 ${
          isActive
            ? "bg-purple-500/10 text-purple-300"
            : "text-zinc-300 hover:bg-purple-500/10 hover:text-white"
        }`}
      >
        {title}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`relative text-sm font-semibold transition duration-300 after:absolute after:-bottom-2 after:right-0 after:h-[2px] after:rounded-full after:bg-purple-500 after:transition-all after:duration-300 ${
        isActive
          ? "text-white after:w-full"
          : "text-zinc-300 after:w-0 hover:text-white hover:after:w-full"
      }`}
    >
      {title}
    </Link>
  );
}