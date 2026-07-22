import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PaymentRecord = {
  id: string;
  user_id: string;
  amount_cents: number;
  currency: string;
  special_reference: string;
  is_test: boolean;
};

function getFirstParam(
  params: URLSearchParams,
  names: string[]
): string {
  for (const name of names) {
    const value =
      params.get(name)?.trim();

    if (value) {
      return value;
    }
  }

  return "";
}

function toBoolean(
  value: string
): boolean {
  return (
    value.trim().toLowerCase() ===
      "true" ||
    value.trim() === "1"
  );
}

function uniqueValues(
  ...values: string[]
): string[] {
  return [
    ...new Set(
      values.filter(
        (value) =>
          value !== undefined &&
          value !== null
      )
    ),
  ];
}

/*
 * دعم شكلي Paymob:
 *
 * الشكل الحالي:
 * amount
 * integration_id
 * source_data_pan
 *
 * والشكل التقليدي:
 * amount_cents
 * integration
 * source_data.pan
 */
function createHmacCandidates(
  params: URLSearchParams
): string[] {
  const amountValues =
    uniqueValues(
      params.get("amount") ?? "",
      params.get("amount_cents") ?? ""
    );

  const integrationValues =
    uniqueValues(
      params.get("integration_id") ??
        "",
      params.get("integration") ?? ""
    );

  const orderValues =
    uniqueValues(
      params.get("order") ?? "",
      params.get("order_id") ?? ""
    );

  const panValues =
    uniqueValues(
      params.get(
        "source_data_pan"
      ) ?? "",

      params.get(
        "source_data.pan"
      ) ?? "",

      params.get(
        "source_data[pan]"
      ) ?? ""
    );

  const subTypeValues =
    uniqueValues(
      params.get(
        "source_data_sub_type"
      ) ?? "",

      params.get(
        "source_data.sub_type"
      ) ?? "",

      params.get(
        "source_data[sub_type]"
      ) ?? ""
    );

  const typeValues =
    uniqueValues(
      params.get(
        "source_data_type"
      ) ?? "",

      params.get(
        "source_data.type"
      ) ?? "",

      params.get(
        "source_data[type]"
      ) ?? ""
    );

  const candidates =
    new Set<string>();

  for (
    const amountValue of
    amountValues
  ) {
    for (
      const integrationValue of
      integrationValues
    ) {
      for (
        const orderValue of
        orderValues
      ) {
        for (
          const panValue of
          panValues
        ) {
          for (
            const subTypeValue of
            subTypeValues
          ) {
            for (
              const typeValue of
              typeValues
            ) {
              const values = [
                amountValue,

                params.get(
                  "created_at"
                ) ?? "",

                params.get(
                  "currency"
                ) ?? "",

                params.get(
                  "error_occured"
                ) ?? "",

                params.get(
                  "has_parent_transaction"
                ) ?? "",

                params.get("id") ?? "",

                integrationValue,

                params.get(
                  "is_3d_secure"
                ) ?? "",

                params.get(
                  "is_auth"
                ) ?? "",

                params.get(
                  "is_capture"
                ) ?? "",

                params.get(
                  "is_refunded"
                ) ?? "",

                params.get(
                  "is_standalone_payment"
                ) ?? "",

                params.get(
                  "is_voided"
                ) ?? "",

                orderValue,

                params.get(
                  "owner"
                ) ?? "",

                params.get(
                  "pending"
                ) ?? "",

                panValue,

                subTypeValue,

                typeValue,

                params.get(
                  "success"
                ) ?? "",
              ];

              candidates.add(
                values.join("")
              );
            }
          }
        }
      }
    }
  }

  return [...candidates];
}

function safeCompareHex(
  firstHex: string,
  secondHex: string
): boolean {
  try {
    const firstBuffer =
      Buffer.from(
        firstHex,
        "hex"
      );

    const secondBuffer =
      Buffer.from(
        secondHex,
        "hex"
      );

    if (
      firstBuffer.length !==
      secondBuffer.length
    ) {
      return false;
    }

    return timingSafeEqual(
      firstBuffer,
      secondBuffer
    );
  } catch {
    return false;
  }
}

function verifyHmac(
  params: URLSearchParams,
  hmacSecret: string
): boolean {
  const receivedHmac =
    params
      .get("hmac")
      ?.trim()
      .toLowerCase() ?? "";

  if (
    !/^[a-f0-9]{128}$/.test(
      receivedHmac
    )
  ) {
    return false;
  }

  const candidates =
    createHmacCandidates(params);

  return candidates.some(
    (candidate) => {
      const calculatedHmac =
        createHmac(
          "sha512",
          hmacSecret
        )
          .update(candidate)
          .digest("hex");

      return safeCompareHex(
        calculatedHmac,
        receivedHmac
      );
    }
  );
}

function createResultUrl(
  request: NextRequest
): URL {
  const siteUrl = (
    process.env
      .NEXT_PUBLIC_SITE_URL
      ?.trim() ||
    request.nextUrl.origin
  ).replace(/\/+$/, "");

  const resultUrl =
    new URL(
      "/payment/result",
      siteUrl
    );

  request.nextUrl
    .searchParams
    .forEach(
      (value, key) => {
        resultUrl.searchParams.set(
          key,
          value
        );
      }
    );

  return resultUrl;
}

async function getCurrentUserId(): Promise<string> {
  try {
    const supabase =
      await createClient();

    const {
      data,
    } =
      await supabase.auth
        .getClaims();

    const claims =
      data?.claims as
        | Record<
            string,
            unknown
          >
        | undefined;

    return typeof claims?.sub ===
      "string"
      ? claims.sub
      : "";
  } catch {
    return "";
  }
}

async function findPaymentRecord(
  params: URLSearchParams,
  amountCents: number,
  currency: string
): Promise<PaymentRecord | null> {
  const adminSupabase =
    createAdminClient();

  const columns = `
    id,
    user_id,
    amount_cents,
    currency,
    special_reference,
    is_test
  `;

  /*
   * Paymob تعرض هذه القيمة في لوحة التحكم
   * باسم Merchant Order ID.
   */
  const specialReference =
    getFirstParam(
      params,
      [
        "merchant_order_id",
        "special_reference",
        "merchant_order_reference",
      ]
    );

  if (specialReference) {
    const {
      data,
      error,
    } = await adminSupabase
      .from(
        "payment_transactions"
      )
      .select(columns)
      .eq(
        "special_reference",
        specialReference
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return data as PaymentRecord;
    }
  }

  /*
   * لو مرجع العملية لم يصل،
   * نبحث داخل عمليات المستخدم الحالي فقط.
   *
   * لا نقبل النتيجة إلا عند وجود
   * عملية Pending واحدة مطابقة.
   */
  const userId =
    await getCurrentUserId();

  if (!userId) {
    return null;
  }

  const oldestAllowedDate =
    new Date(
      Date.now() -
        30 * 60 * 1000
    ).toISOString();

  const {
    data,
    error,
  } = await adminSupabase
    .from(
      "payment_transactions"
    )
    .select(columns)
    .eq(
      "user_id",
      userId
    )
    .eq(
      "status",
      "pending"
    )
    .eq(
      "amount_cents",
      amountCents
    )
    .eq(
      "currency",
      currency
    )
    .gte(
      "created_at",
      oldestAllowedDate
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    )
    .limit(2);

  if (error) {
    throw error;
  }

  if (
    data &&
    data.length >= 1
  ) {
    return data[0] as PaymentRecord;
  }

  return null;
}

export async function GET(
  request: NextRequest
) {
  const resultUrl =
    createResultUrl(request);

  const hmacSecret =
    process.env.PAYMOB_HMAC
      ?.trim();

  const cardIntegrationId =
    Number(
      process.env
        .PAYMOB_INTEGRATION_ID
        ?.trim() || "5786780"
    );

  const walletIntegrationId =
    Number(
      process.env
        .PAYMOB_WALLET_INTEGRATION_ID
        ?.trim() || "5790899"
    );

  const allowedIntegrationIds = [
    cardIntegrationId,
    walletIntegrationId,
  ];

  if (
    !hmacSecret ||
    allowedIntegrationIds.some(
      (integrationId) =>
        !Number.isInteger(
          integrationId
        ) ||
        integrationId <= 0
    )
  ) {
    resultUrl.searchParams.set(
      "verified",
      "false"
    );

    resultUrl.searchParams.set(
      "verification_error",
      "missing_configuration"
    );

    return NextResponse.redirect(
      resultUrl,
      303
    );
  }

  const params =
    request.nextUrl.searchParams;

  /*
   * أول وأهم خطوة:
   * التحقق من HMAC.
   */
  const isHmacValid =
    verifyHmac(
      params,
      hmacSecret
    );

  if (!isHmacValid) {
    console.error(
      "Invalid Paymob response callback HMAC."
    );

    resultUrl.searchParams.set(
      "verified",
      "false"
    );

    resultUrl.searchParams.set(
      "verification_error",
      "invalid_hmac"
    );

    return NextResponse.redirect(
      resultUrl,
      303
    );
  }

  const transactionId =
    getFirstParam(
      params,
      ["id", "transaction_id"]
    );

  const callbackAmount =
    Number(
      getFirstParam(
        params,
        [
          "amount_cents",
          "amount",
        ]
      )
    );

  const callbackCurrency =
    getFirstParam(
      params,
      ["currency"]
    ).toUpperCase();

  const callbackIntegrationId =
    Number(
      getFirstParam(
        params,
        [
          "integration_id",
          "integration",
        ]
      )
    );

  if (
    !transactionId ||
    !Number.isInteger(
      callbackAmount
    ) ||
    callbackAmount <= 0 ||
    !callbackCurrency ||
    !Number.isInteger(
      callbackIntegrationId
    )
  ) {
    resultUrl.searchParams.set(
      "verified",
      "false"
    );

    resultUrl.searchParams.set(
      "verification_error",
      "invalid_callback_data"
    );

    return NextResponse.redirect(
      resultUrl,
      303
    );
  }

  if (
    !allowedIntegrationIds.includes(
      callbackIntegrationId
    )
  ) {
    resultUrl.searchParams.set(
      "verified",
      "false"
    );

    resultUrl.searchParams.set(
      "verification_error",
      "integration_mismatch"
    );

    return NextResponse.redirect(
      resultUrl,
      303
    );
  }

  try {
    const paymentRecord =
      await findPaymentRecord(
        params,
        callbackAmount,
        callbackCurrency
      );

    if (!paymentRecord) {
      console.error(
        "Payment record was not found from response callback.",
        {
          transactionId,
          callbackAmount,
          callbackCurrency,
        }
      );

      resultUrl.searchParams.set(
        "verified",
        "false"
      );

      resultUrl.searchParams.set(
        "verification_error",
        "payment_not_found"
      );

      return NextResponse.redirect(
        resultUrl,
        303
      );
    }

    if (
      callbackAmount !==
      Number(
        paymentRecord.amount_cents
      )
    ) {
      resultUrl.searchParams.set(
        "verified",
        "false"
      );

      resultUrl.searchParams.set(
        "verification_error",
        "amount_mismatch"
      );

      return NextResponse.redirect(
        resultUrl,
        303
      );
    }

    if (
      callbackCurrency !==
      paymentRecord.currency
        .toUpperCase()
    ) {
      resultUrl.searchParams.set(
        "verified",
        "false"
      );

      resultUrl.searchParams.set(
        "verification_error",
        "currency_mismatch"
      );

      return NextResponse.redirect(
        resultUrl,
        303
      );
    }

    const success =
      toBoolean(
        params.get("success") ??
          ""
      );

    const pending =
      toBoolean(
        params.get("pending") ??
          ""
      );

    const errorOccurred =
      toBoolean(
        params.get(
          "error_occured"
        ) ?? ""
      );

    const isRefunded =
      toBoolean(
        params.get(
          "is_refunded"
        ) ?? ""
      );

    const isVoided =
      toBoolean(
        params.get(
          "is_voided"
        ) ?? ""
      );

    const isSuccessful =
      success &&
      !pending &&
      !errorOccurred &&
      !isRefunded &&
      !isVoided;

    const orderId =
      getFirstParam(
        params,
        ["order", "order_id"]
      );

    const paymentMethod = [
      getFirstParam(
        params,
        [
          "source_data_type",
          "source_data.type",
          "source_data[type]",
        ]
      ),

      getFirstParam(
        params,
        [
          "source_data_sub_type",
          "source_data.sub_type",
          "source_data[sub_type]",
        ]
      ),
    ]
      .filter(Boolean)
      .join(" - ");

    const rawPayload =
      Object.fromEntries(
        params.entries()
      );

    const adminSupabase =
      createAdminClient();

    const {
      error,
    } = await adminSupabase.rpc(
      "process_paymob_payment",
      {
        p_special_reference:
          paymentRecord
            .special_reference,

        p_success:
          isSuccessful,

        p_paymob_transaction_id:
          transactionId,

        p_paymob_order_id:
          orderId || null,

        p_payment_method:
          paymentMethod || null,

        p_is_test:
          paymentRecord.is_test,

        p_raw_payload:
          rawPayload,
      }
    );

    if (error) {
      console.error(
        "Paymob response callback processing error:",
        error
      );

      resultUrl.searchParams.set(
        "verified",
        "false"
      );

      resultUrl.searchParams.set(
        "verification_error",
        "database_update_failed"
      );

      return NextResponse.redirect(
        resultUrl,
        303
      );
    }

    const {
      error: promoFinalizeError,
    } = await adminSupabase.rpc(
      "finalize_promo_redemption",
      {
        p_special_reference:
          paymentRecord
            .special_reference,

        p_success:
          isSuccessful,
      }
    );

    if (promoFinalizeError) {
      console.error(
        "Promo redemption finalization error:",
        promoFinalizeError
      );

      resultUrl.searchParams.set(
        "verified",
        "false"
      );

      resultUrl.searchParams.set(
        "verification_error",
        "promo_update_failed"
      );

      return NextResponse.redirect(
        resultUrl,
        303
      );
    }

    console.log(
      "Paymob response callback processed successfully.",
      {
        transactionId,
        specialReference:
          paymentRecord
            .special_reference,
        isSuccessful,
      }
    );

    resultUrl.searchParams.set(
      "verified",
      "true"
    );

    resultUrl.searchParams.set(
      "reference",
      paymentRecord
        .special_reference
    );

    resultUrl.searchParams.set(
      "payment_success",
      isSuccessful
        ? "true"
        : "false"
    );

    return NextResponse.redirect(
      resultUrl,
      303
    );
  } catch (error) {
    console.error(
      "Unexpected Paymob response callback error:",
      error
    );

    resultUrl.searchParams.set(
      "verified",
      "false"
    );

    resultUrl.searchParams.set(
      "verification_error",
      "unexpected_error"
    );

    return NextResponse.redirect(
      resultUrl,
      303
    );
  }
}
