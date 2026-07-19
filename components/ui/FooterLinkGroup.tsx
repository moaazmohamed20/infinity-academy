import Link from "next/link";

type FooterLink = {
  title: string;
  href: string;
};

type FooterLinkGroupProps = {
  title: string;
  links: FooterLink[];
};

export default function FooterLinkGroup({
  title,
  links,
}: FooterLinkGroupProps) {
  return (
    <div>
      <h3 className="text-lg font-bold text-white">
        {title}
      </h3>

      <nav className="mt-6" aria-label={title}>
        <ul className="flex flex-col items-start gap-4">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="group flex items-center gap-2 text-sm text-zinc-400 transition duration-300 hover:-translate-x-1 hover:text-purple-400"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-700 transition duration-300 group-hover:bg-purple-400" />

                {link.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}