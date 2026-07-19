export type Course = {
  slug: string;
  title: string;
  instructor: string;
  category: string;
  image: string;
  rating: number;
  students: string;
  duration: string;
  lessons: number;
};

export const courses: Course[] = [
  {
    slug: "ai",
    title: "احتراف الذكاء الاصطناعي من الصفر",
    instructor: "Infinity Academy",
    category: "الذكاء الاصطناعي",
    image: "/images/courses/ai.jpg",
    rating: 4.9,
    students: "12,500",
    duration: "24 ساعة",
    lessons: 85,
  },
  {
    slug: "programming",
    title: "تعلم البرمجة وتطوير المواقع",
    instructor: "Infinity Academy",
    category: "البرمجة",
    image: "/images/courses/programming.jpg",
    rating: 4.8,
    students: "9,800",
    duration: "32 ساعة",
    lessons: 110,
  },
  {
    slug: "languages",
    title: "احتراف اللغة الإنجليزية",
    instructor: "Infinity Academy",
    category: "اللغات",
    image: "/images/courses/languages.jpg",
    rating: 4.9,
    students: "15,200",
    duration: "40 ساعة",
    lessons: 130,
  },
  {
    slug: "content",
    title: "صناعة المحتوى والربح من الإنترنت",
    instructor: "Infinity Academy",
    category: "صناعة المحتوى",
    image: "/images/courses/content.jpg",
    rating: 4.7,
    students: "8,700",
    duration: "18 ساعة",
    lessons: 65,
  },
  {
    slug: "marketing",
    title: "التسويق الإلكتروني باحتراف",
    instructor: "Infinity Academy",
    category: "التسويق الإلكتروني",
    image: "/images/courses/marketing.jpg",
    rating: 4.8,
    students: "7,900",
    duration: "21 ساعة",
    lessons: 72,
  },
  {
    slug: "cybersecurity",
    title: "الأمن السيبراني من البداية",
    instructor: "Infinity Academy",
    category: "الأمن السيبراني",
    image: "/images/courses/cybersecurity.jpg",
    rating: 4.9,
    students: "6,400",
    duration: "35 ساعة",
    lessons: 95,
  },
  {
    slug: "design",
    title: "التصميم الجرافيكي الشامل",
    instructor: "Infinity Academy",
    category: "التصميم",
    image: "/images/courses/design.jpg",
    rating: 4.7,
    students: "5,600",
    duration: "20 ساعة",
    lessons: 68,
  },
  {
    slug: "video",
    title: "المونتاج وصناعة الفيديو",
    instructor: "Infinity Academy",
    category: "المونتاج",
    image: "/images/courses/video.jpg",
    rating: 4.8,
    students: "8,200",
    duration: "26 ساعة",
    lessons: 80,
  },
  {
    slug: "music",
    title: "الإنتاج الموسيقي والهندسة الصوتية",
    instructor: "Infinity Academy",
    category: "الإنتاج الموسيقي",
    image: "/images/courses/music.jpg",
    rating: 4.9,
    students: "4,900",
    duration: "28 ساعة",
    lessons: 90,
  },
  {
    slug: "ecommerce",
    title: "التجارة الإلكترونية من الصفر",
    instructor: "Infinity Academy",
    category: "التجارة الإلكترونية",
    image: "/images/courses/ecommerce.jpg",
    rating: 4.8,
    students: "7,100",
    duration: "19 ساعة",
    lessons: 70,
  },
  {
    slug: "realestate",
    title: "التسويق العقاري الاحترافي",
    instructor: "Infinity Academy",
    category: "التسويق العقاري",
    image: "/images/courses/realestate.jpg",
    rating: 4.7,
    students: "3,800",
    duration: "15 ساعة",
    lessons: 55,
  },
  {
    slug: "business",
    title: "إدارة الأعمال وريادة المشاريع",
    instructor: "Infinity Academy",
    category: "إدارة الأعمال",
    image: "/images/courses/business.jpg",
    rating: 4.8,
    students: "5,300",
    duration: "22 ساعة",
    lessons: 75,
  },
];

export type Category = "الكل" | string;

export const categories: Category[] = [
  "الكل",
  ...Array.from(new Set(courses.map((course) => course.category))),
];

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find((course) => course.slug === slug);
}