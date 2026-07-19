import { randomUUID } from "node:crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";

type PlanKey = "monthly" | "yearly";

type CheckoutRequestBody = {
  plan?: unknown;
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
};

const plans: Record<
  PlanKey,
  {
    name: string;
    amount: number;
    description: string;
  }
> = {
  monthly: {
    name: "الباقة الاحترافية الشهرية",
    amount: 29900,
    description:
      "اشتراك شهري في منصة Infinity Academy",
  },

  yearly: {
    name: "الباقة السنوية",
    amount: 249900,
    description:
      "اشتراك سنوي في منصة Infinity Academy",
  },
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function normalizeEgyptianPhone(
  phone: string
) {
  const cleanedPhone = phone.replace(
    /[^\d+]/g,
    ""
  );

  if (/^01\d{9}$/.test(cleanedPhone)) {
    return `+2${cleanedPhone}`;
  }

  if (/^20\d{10}$/.test(cleanedPhone)) {
    return `+${cleanedPhone}`;
  }

  if (/^\+20\d{10}$/.test(cleanedPhone)) {
    return cleanedPhone;
  }

  return null;
}

function splitFullName(fullName: string) {
  const nameParts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const firstName = nameParts[0] || "Customer";

  const lastName =
    nameParts.slice(1).join(" ") ||
    firstName;

  return {
    firstName,
    lastName,
  };
}

function getEnvironmentVariables() {
  const secretKey =
    process.env.PAYMOB_SECRET_KEY?.trim();

  const publicKey =
    process.env.PAYMOB_PUBLIC_KEY?.trim();

  const integrationIdValue =
    process.env.PAYMOB_INTEGRATION_ID?.trim();

  const integrationId = Number(
    integrationIdValue
  );

  if (
    !secretKey ||
    !publicKey ||
    !integrationIdValue ||
    !Number.isInteger(integrationId) ||
    integrationId <= 0
  ) {
    return null;
  }

  return {
    secretKey,
    publicKey,
    integrationId,
  };
}

export async function POST(
  request: NextRequest
) {
  try {
    const environmentVariables =
      getEnvironmentVariables();

    if (!environmentVariables) {
      return NextResponse.json(
        {
          error:
            "إعدادات Paymob غير مكتملة على السيرفر.",
        },
        {
          status: 500,
        }
      );
    }

    let body: CheckoutRequestBody;

    try {
      body =
        (await request.json()) as CheckoutRequestBody;
    } catch {
      return NextResponse.json(
        {
          error:
            "بيانات الطلب غير صحيحة.",
        },
        {
          status: 400,
        }
      );
    }

    const plan: PlanKey | null =
      body.plan === "yearly"
        ? "yearly"
        : body.plan === "monthly"
          ? "monthly"
          : null;

    const fullName =
      typeof body.fullName === "string"
        ? body.fullName.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    if (!plan) {
      return NextResponse.json(
        {
          error:
            "الباقة المختارة غير صحيحة.",
        },
        {
          status: 400,
        }
      );
    }

    if (fullName.length < 3) {
      return NextResponse.json(
        {
          error:
            "اكتب الاسم بالكامل.",
        },
        {
          status: 400,
        }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          error:
            "اكتب بريدًا إلكترونيًا صحيحًا.",
        },
        {
          status: 400,
        }
      );
    }

    const normalizedPhone =
      normalizeEgyptianPhone(phone);

    if (!normalizedPhone) {
      return NextResponse.json(
        {
          error:
            "اكتب رقم هاتف مصري صحيحًا.",
        },
        {
          status: 400,
        }
      );
    }

    const selectedPlan = plans[plan];

    const {
      firstName,
      lastName,
    } = splitFullName(fullName);

    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      request.nextUrl.origin
    ).replace(/\/+$/, "");

    const specialReference =
      `IA-${Date.now()}-` +
      randomUUID()
        .replace(/-/g, "")
        .slice(0, 10)
        .toUpperCase();

    const paymobResponse = await fetch(
      "https://accept.paymob.com/v1/intention/",
      {
        method: "POST",

        headers: {
          Authorization:
            `Token ${environmentVariables.secretKey}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          amount: selectedPlan.amount,

          currency: "EGP",

          payment_methods: [
            environmentVariables.integrationId,
          ],

          items: [
            {
              name: selectedPlan.name,
              amount: selectedPlan.amount,
              description:
                selectedPlan.description,
              quantity: 1,
            },
          ],

          billing_data: {
            apartment: "NA",
            first_name: firstName,
            last_name: lastName,
            street: "NA",
            building: "NA",
            phone_number: normalizedPhone,
            city: "Cairo",
            country: "EG",
            email,
            floor: "NA",
            state: "Cairo",
          },

          special_reference:
            specialReference,

          notification_url:
            `${siteUrl}/api/paymob/webhook`,

          redirection_url:
            `${siteUrl}/payment/result`,
        }),

        cache: "no-store",
      }
    );

    const responseText =
      await paymobResponse.text();

    let paymobData: unknown = null;

    try {
      paymobData = JSON.parse(
        responseText
      );
    } catch {
      paymobData = null;
    }

    if (!paymobResponse.ok) {
      console.error(
        "Paymob intention error:",
        paymobResponse.status,
        paymobData || responseText
      );

      return NextResponse.json(
        {
          error:
            "تعذر إنشاء عملية الدفع. حاول مرة أخرى.",
        },
        {
          status: 502,
        }
      );
    }

    const clientSecret =
      paymobData &&
      typeof paymobData === "object" &&
      "client_secret" in paymobData &&
      typeof paymobData.client_secret ===
        "string"
        ? paymobData.client_secret
        : "";

    if (!clientSecret) {
      console.error(
        "Paymob response missing client_secret:",
        paymobData
      );

      return NextResponse.json(
        {
          error:
            "لم يتم استلام رابط الدفع من Paymob.",
        },
        {
          status: 502,
        }
      );
    }

    const checkoutUrl =
      "https://accept.paymob.com/unifiedcheckout/" +
      `?publicKey=${encodeURIComponent(
        environmentVariables.publicKey
      )}` +
      `&clientSecret=${encodeURIComponent(
        clientSecret
      )}`;

    return NextResponse.json({
      success: true,
      checkoutUrl,
      reference: specialReference,
    });
  } catch (error) {
    console.error(
      "Create Paymob intention error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "حدث خطأ غير متوقع أثناء إنشاء عملية الدفع.",
      },
      {
        status: 500,
      }
    );
  }
}