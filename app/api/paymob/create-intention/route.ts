import { randomUUID } from "node:crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlanKey = "monthly" | "yearly";

type CheckoutRequestBody = {
  plan?: unknown;
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  promoCode?: unknown;
};

type PlanRow = {
  plan_key: string;
  name: string;
  price_cents: number;
  currency: string;
  description: string;
  paymob_enabled: boolean;
  is_published: boolean;
};

type PromoReservationRow = {
  promo_code_id: string;
  normalized_code: string;
  discount_amount_cents: number;
  final_amount_cents: number;
};

type PaymobResponse = {
  id?: unknown;
  client_secret?: unknown;
};

function isValidEmail(
  email: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function normalizeEgyptianPhone(
  phone: string
) {
  const cleanedPhone =
    phone.replace(
      /[^\d+]/g,
      ""
    );

  if (
    /^01\d{9}$/.test(
      cleanedPhone
    )
  ) {
    return `+2${cleanedPhone}`;
  }

  if (
    /^20\d{10}$/.test(
      cleanedPhone
    )
  ) {
    return `+${cleanedPhone}`;
  }

  if (
    /^\+20\d{10}$/.test(
      cleanedPhone
    )
  ) {
    return cleanedPhone;
  }

  return null;
}

function splitFullName(
  fullName: string
) {
  const nameParts =
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  const firstName =
    nameParts[0] ||
    "Customer";

  const lastName =
    nameParts
      .slice(1)
      .join(" ") ||
    firstName;

  return {
    firstName,
    lastName,
  };
}

function getPositiveIntegrationId(
  value: string | undefined,
  fallback: number
) {
  const parsedValue =
    Number(value?.trim());

  if (
    Number.isInteger(
      parsedValue
    ) &&
    parsedValue > 0
  ) {
    return parsedValue;
  }

  return fallback;
}

function getEnvironmentVariables() {
  const secretKey =
    process.env
      .PAYMOB_SECRET_KEY
      ?.trim();

  const publicKey =
    process.env
      .PAYMOB_PUBLIC_KEY
      ?.trim();

  const cardIntegrationId =
    getPositiveIntegrationId(
      process.env
        .PAYMOB_INTEGRATION_ID,
      5786780
    );

  const walletIntegrationId =
    getPositiveIntegrationId(
      process.env
        .PAYMOB_WALLET_INTEGRATION_ID,
      5790899
    );

  if (
    !secretKey ||
    !publicKey
  ) {
    return null;
  }

  return {
    secretKey,
    publicKey,
    cardIntegrationId,
    walletIntegrationId,
  };
}

function getPromoErrorMessage(
  errorMessage: string
) {
  const normalizedMessage =
    errorMessage.toLowerCase();

  if (
    normalizedMessage.includes(
      "كود الخصم"
    ) ||
    normalizedMessage.includes(
      "الحد الأقصى"
    ) ||
    normalizedMessage.includes(
      "استخدمت"
    ) ||
    normalizedMessage.includes(
      "الباقة"
    )
  ) {
    return errorMessage;
  }

  return "تعذر تطبيق كود الخصم.";
}

export async function POST(
  request: NextRequest
) {
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

  const supabase =
    await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } =
    await supabase.auth.getClaims();

  if (
    claimsError ||
    !claimsData?.claims
  ) {
    return NextResponse.json(
      {
        error:
          "يجب تسجيل الدخول قبل إتمام الاشتراك.",
      },
      {
        status: 401,
      }
    );
  }

  const claims =
    claimsData.claims as Record<
      string,
      unknown
    >;

  const userId =
    typeof claims.sub ===
    "string"
      ? claims.sub
      : "";

  if (!userId) {
    return NextResponse.json(
      {
        error:
          "تعذر التعرف على حساب المستخدم.",
      },
      {
        status: 401,
      }
    );
  }

  let body:
    CheckoutRequestBody;

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

  const plan:
    PlanKey | null =
    body.plan === "yearly"
      ? "yearly"
      : body.plan ===
          "monthly"
        ? "monthly"
        : null;

  const fullName =
    typeof body.fullName ===
    "string"
      ? body.fullName.trim()
      : "";

  const email =
    typeof body.email ===
    "string"
      ? body.email
          .trim()
          .toLowerCase()
      : "";

  const phone =
    typeof body.phone ===
    "string"
      ? body.phone.trim()
      : "";

  const promoCode =
    typeof body.promoCode ===
    "string"
      ? body.promoCode
          .trim()
          .toUpperCase()
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

  if (
    fullName.length < 3
  ) {
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

  if (
    !isValidEmail(email)
  ) {
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
    normalizeEgyptianPhone(
      phone
    );

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

  const adminSupabase =
    createAdminClient();

  const {
    data: planData,
    error: planError,
  } = await adminSupabase
    .from(
      "subscription_plans"
    )
    .select(
      `
        plan_key,
        name,
        price_cents,
        currency,
        description,
        paymob_enabled,
        is_published
      `
    )
    .eq(
      "plan_key",
      plan
    )
    .eq(
      "is_published",
      true
    )
    .eq(
      "paymob_enabled",
      true
    )
    .maybeSingle();

  if (
    planError ||
    !planData
  ) {
    console.error(
      "Subscription plan load error:",
      planError
    );

    return NextResponse.json(
      {
        error:
          "الباقة غير متاحة للدفع حاليًا.",
      },
      {
        status: 404,
      }
    );
  }

  const selectedPlan =
    planData as PlanRow;

  const originalAmountCents =
    Number(
      selectedPlan.price_cents
    );

  const currency =
    selectedPlan.currency
      .trim()
      .toUpperCase();

  if (
    !Number.isInteger(
      originalAmountCents
    ) ||
    originalAmountCents <= 0
  ) {
    return NextResponse.json(
      {
        error:
          "سعر الباقة غير صحيح.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    currency !== "EGP"
  ) {
    return NextResponse.json(
      {
        error:
          "عملة الباقة غير مدعومة حاليًا.",
      },
      {
        status: 400,
      }
    );
  }

  const {
    firstName,
    lastName,
  } =
    splitFullName(fullName);

  const siteUrl = (
    process.env
      .NEXT_PUBLIC_SITE_URL
      ?.trim() ||
    request.nextUrl.origin
  ).replace(/\/+$/, "");

  const specialReference =
    `IA-${Date.now()}-` +
    randomUUID()
      .replace(/-/g, "")
      .slice(0, 10)
      .toUpperCase();

  const {
    data: paymentRecord,
    error:
      paymentInsertError,
  } = await adminSupabase
    .from(
      "payment_transactions"
    )
    .insert({
      user_id: userId,
      provider: "paymob",
      plan_key: plan,
      status: "pending",

      amount_cents:
        originalAmountCents,

      original_amount_cents:
        originalAmountCents,

      discount_amount_cents:
        0,

      currency,

      special_reference:
        specialReference,

      customer_email:
        email,

      customer_phone:
        normalizedPhone,

      is_test: true,

      hmac_verified:
        false,
    })
    .select("id")
    .single();

  if (
    paymentInsertError ||
    !paymentRecord
  ) {
    console.error(
      "Payment record insert error:",
      paymentInsertError
    );

    return NextResponse.json(
      {
        error:
          "تعذر تسجيل عملية الدفع داخل الموقع.",
      },
      {
        status: 500,
      }
    );
  }

  const paymentRecordId =
    String(
      paymentRecord.id
    );

  async function markPaymentFailed(
    stage: string,
    response?: unknown
  ) {
    await adminSupabase
      .from(
        "payment_transactions"
      )
      .update({
        status: "failed",

        raw_payload: {
          stage,

          response:
            response ?? null,
        },
      })
      .eq(
        "id",
        paymentRecordId
      );

    if (promoCode) {
      await adminSupabase.rpc(
        "finalize_promo_redemption",
        {
          p_special_reference:
            specialReference,

          p_success:
            false,
        }
      );
    }
  }

  let finalAmountCents =
    originalAmountCents;

  let discountAmountCents =
    0;

  let appliedPromoCode =
    "";

  if (promoCode) {
    const {
      data:
        promoReservationData,

      error:
        promoReservationError,
    } =
      await adminSupabase.rpc(
        "reserve_promo_code",
        {
          p_code:
            promoCode,

          p_user_id:
            userId,

          p_plan_key:
            plan,

          p_original_amount_cents:
            originalAmountCents,

          p_payment_transaction_id:
            paymentRecordId,

          p_special_reference:
            specialReference,
        }
      );

    const reservationValue =
      Array.isArray(
        promoReservationData
      )
        ? promoReservationData[0]
        : promoReservationData;

    const reservation =
      reservationValue as
        | PromoReservationRow
        | null;

    if (
      promoReservationError ||
      !reservation
    ) {
      console.error(
        "Promo code reservation error:",
        promoReservationError
      );

      await markPaymentFailed(
        "promo_code_rejected",
        promoReservationError
      );

      return NextResponse.json(
        {
          error:
            getPromoErrorMessage(
              promoReservationError
                ?.message ||
                "تعذر تطبيق كود الخصم."
            ),
        },
        {
          status: 400,
        }
      );
    }

    finalAmountCents =
      Number(
        reservation.final_amount_cents
      );

    discountAmountCents =
      Number(
        reservation.discount_amount_cents
      );

    appliedPromoCode =
      reservation.normalized_code;

    if (
      !Number.isInteger(
        finalAmountCents
      ) ||
      finalAmountCents <= 0 ||
      !Number.isInteger(
        discountAmountCents
      ) ||
      discountAmountCents <=
        0
    ) {
      await markPaymentFailed(
        "invalid_discount_result",
        reservation
      );

      return NextResponse.json(
        {
          error:
            "تعذر حساب قيمة الخصم.",
        },
        {
          status: 500,
        }
      );
    }
  }

  try {
    const itemDescription =
      appliedPromoCode
        ? `${selectedPlan.description} - كود الخصم: ${appliedPromoCode}`
        : selectedPlan.description;

    const paymentMethods = [
      environmentVariables
        .cardIntegrationId,

      environmentVariables
        .walletIntegrationId,
    ];

    const paymobResponse =
      await fetch(
        "https://accept.paymob.com/v1/intention/",
        {
          method: "POST",

          headers: {
            Authorization:
              `Token ${environmentVariables.secretKey}`,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              amount:
                finalAmountCents,

              currency,

              payment_methods:
                paymentMethods,

              items: [
                {
                  name:
                    selectedPlan.name,

                  amount:
                    finalAmountCents,

                  description:
                    itemDescription,

                  quantity: 1,
                },
              ],

              billing_data: {
                apartment:
                  "NA",

                first_name:
                  firstName,

                last_name:
                  lastName,

                street: "NA",
                building: "NA",

                phone_number:
                  normalizedPhone,

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
                `${siteUrl}/api/paymob/return`,
            }),

          cache: "no-store",
        }
      );

    const responseText =
      await paymobResponse.text();

    let paymobData:
      PaymobResponse = {};

    try {
      paymobData =
        JSON.parse(
          responseText
        ) as PaymobResponse;
    } catch {
      paymobData = {};
    }

    if (
      !paymobResponse.ok
    ) {
      console.error(
        "Paymob intention error:",
        paymobResponse.status,
        paymobData
      );

      await markPaymentFailed(
        "create_intention",
        {
          status:
            paymobResponse.status,

          response:
            paymobData,
        }
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
      typeof paymobData
        .client_secret ===
      "string"
        ? paymobData
            .client_secret
        : "";

    if (!clientSecret) {
      await markPaymentFailed(
        "missing_client_secret",
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

    const paymobIntentionId =
      paymobData.id !==
        undefined &&
      paymobData.id !== null
        ? String(
            paymobData.id
          )
        : null;

    await adminSupabase
      .from(
        "payment_transactions"
      )
      .update({
        paymob_intention_id:
          paymobIntentionId,

        raw_payload: {
          stage:
            "intention_created",

          intention_id:
            paymobIntentionId,

          original_amount_cents:
            originalAmountCents,

          discount_amount_cents:
            discountAmountCents,

          final_amount_cents:
            finalAmountCents,

          promo_code:
            appliedPromoCode ||
            null,

          payment_methods:
            paymentMethods,
        },
      })
      .eq(
        "id",
        paymentRecordId
      );

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

      reference:
        specialReference,

      originalAmountCents,

      discountAmountCents,

      finalAmountCents,

      promoCode:
        appliedPromoCode ||
        null,
    });
  } catch (error) {
    console.error(
      "Create Paymob intention error:",
      error
    );

    await markPaymentFailed(
      "unexpected_error"
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