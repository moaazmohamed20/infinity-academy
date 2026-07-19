import Link from "next/link";
import {
  BriefcaseBusiness,
  Camera,
  Infinity as InfinityIcon,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Play,
} from "lucide-react";

import FooterLinkGroup from "../ui/FooterLinkGroup";

const quickLinks = [
  {
    title: "الرئيسية",
    href: "/",
  },
  {
    title: "جميع الكورسات",
    href: "/courses",
  },
  {
    title: "التصنيفات",
    href: "/categories",
  },
  {
    title: "الاشتراكات",
    href: "/pricing",
  },
];

const importantLinks = [
  {
    title: "من نحن",
    href: "/about",
  },
  {
    title: "تواصل معنا",
    href: "/contact",
  },
  {
    title: "التحقق من الشهادة",
    href: "/verify-certificate",
  },
  {
    title: "الأسئلة الشائعة",
    href: "/faq",
  },
  {
    title: "سياسة الخصوصية",
    href: "/privacy",
  },
];

const socialLinks = [
  {
    title: "فيسبوك",
    href: "#",
    icon: MessageCircle,
  },
  {
    title: "إنستجرام",
    href: "#",
    icon: Camera,
  },
  {
    title: "يوتيوب",
    href: "#",
    icon: Play,
  },
  {
    title: "لينكدإن",
    href: "#",
    icon: BriefcaseBusiness,
  },
];

export default function Footer() {
  const currentYear =
    new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#08080d] px-6 pt-20 text-white">
      <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

      <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative mx-auto grid max-w-7xl gap-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link
            href="/"
            aria-label="العودة إلى الصفحة الرئيسية"
            className="inline-flex items-center gap-3"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40">
              <InfinityIcon size={28} />
            </span>

            <div>
              <h2 className="text-xl font-black">
                Infinity
                <span className="mr-1 text-purple-400">
                  Academy
                </span>
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                تعلم بلا حدود
              </p>
            </div>
          </Link>

          <p className="mt-6 max-w-sm text-sm leading-8 text-zinc-400">
            منصة تعليمية متكاملة تضم كورسات
            ومسارات في مختلف المجالات،
            لمساعدتك على تطوير مهاراتك وتحقيق
            أهدافك.
          </p>

          <div className="mt-6 flex gap-3">
            {socialLinks.map(
              (social) => {
                const Icon = social.icon;

                return (
                  <a
                    key={social.title}
                    href={social.href}
                    aria-label={social.title}
                    title={social.title}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition duration-300 hover:-translate-y-1 hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-white"
                  >
                    <Icon size={18} />
                  </a>
                );
              }
            )}
          </div>
        </div>

        <FooterLinkGroup
          title="روابط سريعة"
          links={quickLinks}
        />

        <FooterLinkGroup
          title="روابط مهمة"
          links={importantLinks}
        />

        <div>
          <h3 className="text-lg font-bold">
            تواصل معنا
          </h3>

          <div className="mt-6 space-y-5 text-sm text-zinc-400">
            <a
              href="mailto:support@infinityacademy.com"
              className="flex items-center gap-3 transition hover:text-purple-300"
            >
              <Mail
                size={18}
                className="shrink-0 text-purple-400"
              />

              <span>
                support@infinityacademy.com
              </span>
            </a>

            <a
              href="tel:+201000000000"
              className="flex items-center gap-3 transition hover:text-purple-300"
            >
              <Phone
                size={18}
                className="shrink-0 text-purple-400"
              />

              <span dir="ltr">
                +20 100 000 0000
              </span>
            </a>

            <div className="flex items-center gap-3">
              <MapPin
                size={18}
                className="shrink-0 text-purple-400"
              />

              <span>القاهرة، مصر</span>
            </div>
          </div>

          <div className="mt-7">
            <label
              htmlFor="newsletter-email"
              className="mb-3 block text-sm font-semibold"
            >
              اشترك في النشرة البريدية
            </label>

            <div className="flex overflow-hidden rounded-xl border border-white/10 bg-white/5 transition focus-within:border-purple-500/60">
              <input
                id="newsletter-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="البريد الإلكتروني"
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
              />

              <button
                type="button"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 px-5 text-sm font-bold text-white transition hover:brightness-110"
              >
                اشتراك
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-16 flex max-w-7xl flex-col gap-4 border-t border-white/10 py-7 text-center text-sm text-zinc-500 md:flex-row md:items-center md:justify-between md:text-right">
        <p>
          © {currentYear} Infinity Academy.
          جميع الحقوق محفوظة.
        </p>

        <div className="flex justify-center gap-5">
          <Link
            href="/terms"
            className="transition hover:text-purple-400"
          >
            الشروط والأحكام
          </Link>

          <Link
            href="/privacy"
            className="transition hover:text-purple-400"
          >
            الخصوصية
          </Link>
        </div>
      </div>
    </footer>
  );
}