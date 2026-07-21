import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonRecord = Record<
  string,
  unknown
>;

type PaymentRecord = {
  id: string;
  amount_cents: number;
  currency: string;
  special_reference: string;
  is_test: boolean;
};

function asRecord(
  value: unknown
): JsonRecord | null {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as JsonRecord;
}

function getTextValue(
  ...values: unknown[]
): string {
  for (const value of values) {
    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }

    if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      return String(value);
    }
  }

  return "";
}

function toBoolean(
  value: unknown
): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    return (
      value
        .trim()
        .toLowerCase() === "true"
    );
  }

  return false;
}

function toHmacValue(
  value: unknown
): string {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  if (typeof value === "boolean") {
    return value
      ? "true"
      : "false";
  }

  if (typeof value === "object") {
    const record =
      asRecord(value);

    if (
      record?.id !== undefined &&
      record.id !== null
    ) {
      return String(record.id);
    }

    return "";
  }

  return String(value);
}

function uniqueHmacValues(
  ...values: unknown[]
): string[] {
  return [
    ...new Set(
      values.map(toHmacValue)
    ),
  ];
}

function createCallbackHmacCandidates(
  transaction: JsonRecord
): string[] {
  const order =
    asRecord(
      transaction.order
    );

  const integration =
    asRecord(
      transaction.integration
    );

  const sourceData =
    asRecord(
      transaction.source_data
    );

  const amountValues =
    uniqueHmacValues(
      transaction.amount_cents,
      transaction.amount
    );

  const integrationValues =
    uniqueHmacValues(
      transaction.integration,
      transaction.integration_id,
      integration?.id
    );

  const orderValues =
    uniqueHmacValues(
      order?.id,
      transaction.order
    );

  const panValues =
    uniqueHmacValues(
      sourceData?.pan,
      transaction.source_data_pan
    );

  const subTypeValues =
    uniqueHmacValues(
      sourceData?.sub_type,
      transaction.source_data_sub_type
    );

  const sourceTypeValues =
    uniqueHmacValues(
      sourceData?.type,
      transaction.source_data_type
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
              const sourceTypeValue of
              sourceTypeValues
            ) {
              const values = [
                amountValue,
                transaction.created_at,
                transaction.currency,
                transaction.error_occured,
                transaction.has_parent_transaction,
                transaction.id,
                integrationValue,
                transaction.is_3d_secure,
                transaction.is_auth,
                transaction.is_capture,
                transaction.is_refunded,
                transaction.is_standalone_payment,
                transaction.is_voided,
                orderValue,
                transaction.owner,
                transaction.pending,
                panValue,
                subTypeValue,
                sourceTypeValue,
                transaction.success,
              ];

              candidates.add(
                values
                  .map(toHmacValue)
                  .join("")
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

function verifyCallbackHmac(
  transaction: JsonRecord,
  receivedHmac: string,
  hmacSecret: string
): boolean {
  const normalizedReceivedHmac =
    receivedHmac
      .trim()
      .toLowerCase();

  if (
    !/^[a-f0-9]{128}$/.test(
      normalizedReceivedHmac
    )
  ) {
    return false;
  }

  const candidates =
    createCallbackHmacCandidates(
      transaction
    );

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
        normalizedReceivedHmac
      );
    }
  );
}

function getIntegrationId(
  transaction: JsonRecord
): string {
  const integration =
    asRecord(
      transaction.integration
    );

  return getTextValue(
    transaction.integration_id,
    integration?.id,
    transaction.integration
  );
}

function getSpecialReference(
  transaction: JsonRecord
): string {
  const order =
    asRecord(
      transaction.order
    );

  const intention =
    asRecord(
      transaction.intention
    );

  const paymentIntention =
    asRecord(
      transaction.payment_intention
    );

  const paymentKeyClaims =
    asRecord(
      transaction.payment_key_claims
    );

  const claimsExtra =
    asRecord(
      paymentKeyClaims?.extra
    );

  const extras =
    asRecord(
      transaction.extras
    );

  return getTextValue(
    transaction.special_reference,
    transaction.merchant_order_id,

    order?.special_reference,
    order?.merchant_order_id,

    intention?.special_reference,
    intention?.merchant_order_id,

    paymentIntention?.special_reference,
    paymentIntention?.merchant_order_id,

    claimsExtra?.special_reference,
    claimsExtra?.merchant_order_id,

    extras?.special_reference,
    extras?.merchant_order_id
  );
}

function getIntentionId(
  transaction: JsonRecord
): string {
  const intention =
    asRecord(
      transaction.intention
    );

  const paymentIntention =
    asRecord(
      transaction.payment_intention
    );

  const paymentKeyClaims =
    asRecord(
      transaction.payment_key_claims
    );

  const claimsExtra =
    asRecord(
      paymentKeyClaims?.extra
    );

  const intentionString =
    typeof transaction.intention ===
    "string"
      ? transaction.intention
      : "";

  const paymentIntentionString =
    typeof transaction.payment_intention ===
    "string"
      ? transaction.payment_intention
      : "";

  return getTextValue(
    transaction.intention_id,
    transaction.payment_intention_id,

    intention?.id,
    paymentIntention?.id,

    intentionString,
    paymentIntentionString,

    claimsExtra?.intention_id,
    claimsExtra?.payment_intention_id
  );
}

async function findPaymentRecord(
  transaction: JsonRecord,
  callbackAmount: number,
  callbackCurrency: string
): Promise<PaymentRecord | null> {
  const adminSupabase =
    createAdminClient();

  const selectedColumns = `
    id,
    amount_cents,
    currency,
    special_reference,
    is_test
  `;

  const transactionId =
    getTextValue(
      transaction.id
    );

  if (transactionId) {
    const {
      data,
      error,
    } = await adminSupabase
      .from(
        "payment_transactions"
      )
      .select(selectedColumns)
      .eq(
        "paymob_transaction_id",
        transactionId
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return data as PaymentRecord;
    }
  }

  const specialReference =
    getSpecialReference(
      transaction
    );

  if (specialReference) {
    const {
      data,
      error,
    } = await adminSupabase
      .from(
        "payment_transactions"
      )
      .select(selectedColumns)
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

  const intentionId =
    getIntentionId(
      transaction
    );

  if (intentionId) {
    const {
      data,
      error,
    } = await adminSupabase
      .from(
        "payment_transactions"
      )
      .select(selectedColumns)
      .eq(
        "paymob_intention_id",
        intentionId
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return data as PaymentRecord;
    }
  }

  const oldestAllowedDate =
    new Date(
      Date.now() -
        2 * 60 * 60 * 1000
    ).toISOString();

  const {
    data: pendingPayments,
    error: pendingPaymentsError,
  } = await adminSupabase
    .from(
      "payment_transactions"
    )
    .select(selectedColumns)
    .eq(
      "status",
      "pending"
    )
    .eq(
      "amount_cents",
      callbackAmount
    )
    .eq(
      "currency",
      callbackCurrency
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

  if (pendingPaymentsError) {
    throw pendingPaymentsError;
  }

  if (
    pendingPayments &&
    pendingPayments.length === 1
  ) {
    return pendingPayments[0] as PaymentRecord;
  }

  return null;
}

export async function POST(
  request: NextRequest
) {
  const hmacSecret =
    process.env.PAYMOB_HMAC
      ?.trim();

  const expectedIntegrationId =
    Number(
      process.env
        .PAYMOB_INTEGRATION_ID
    );

  if (
    !hmacSecret ||
    !Number.isInteger(
      expectedIntegrationId
    ) ||
    expectedIntegrationId <= 0
  ) {
    console.error(
      "Paymob webhook environment variables are missing."
    );

    return NextResponse.json(
      {
        error:
          "إعدادات Webhook غير مكتملة.",
      },
      {
        status: 500,
      }
    );
  }

  let payload: unknown;

  try {
    payload =
      await request.json();
  } catch {
    console.error(
      "Invalid Paymob webhook JSON."
    );

    return NextResponse.json(
      {
        error:
          "بيانات Webhook غير صحيحة.",
      },
      {
        status: 400,
      }
    );
  }

  const payloadRecord =
    asRecord(payload);

  if (!payloadRecord) {
    return NextResponse.json(
      {
        error:
          "بيانات Webhook غير مكتملة.",
      },
      {
        status: 400,
      }
    );
  }

  const transaction =
    asRecord(
      payloadRecord.obj
    ) ?? payloadRecord;

  const receivedHmac =
    request.nextUrl.searchParams
      .get("hmac") ??
    getTextValue(
      payloadRecord.hmac
    );

  const transactionId =
    getTextValue(
      transaction.id
    );

  const callbackAmount =
    Number(
      transaction.amount_cents ??
        transaction.amount
    );

  const callbackCurrency =
    getTextValue(
      transaction.currency
    ).toUpperCase();

  const callbackIntegrationId =
    Number(
      getIntegrationId(
        transaction
      )
    );

  if (
    !transactionId ||
    !Number.isInteger(
      callbackAmount
    ) ||
    callbackAmount <= 0 ||
    !callbackCurrency
  ) {
    console.error(
      "Incomplete Paymob transaction data.",
      {
        transactionId,
        callbackAmount,
        callbackCurrency,
        transactionKeys:
          Object.keys(
            transaction
          ),
      }
    );

    return NextResponse.json(
      {
        error:
          "بيانات العملية غير مكتملة.",
      },
      {
        status: 400,
      }
    );
  }

  const isHmacValid =
    verifyCallbackHmac(
      transaction,
      receivedHmac,
      hmacSecret
    );

  if (!isHmacValid) {
    console.error(
      "Invalid Paymob callback HMAC.",
      {
        transactionId,
        callbackIntegrationId,

        receivedHmacLength:
          receivedHmac.length,

        callbackShape: {
          hasAmountCents:
            transaction.amount_cents !==
            undefined,

          hasAmount:
            transaction.amount !==
            undefined,

          hasIntegration:
            transaction.integration !==
            undefined,

          hasIntegrationId:
            transaction.integration_id !==
            undefined,

          hasNestedSourceData:
            asRecord(
              transaction.source_data
            ) !== null,

          hasFlatSourceData:
            transaction.source_data_type !==
              undefined ||
            transaction.source_data_pan !==
              undefined,
        },
      }
    );

    return NextResponse.json(
      {
        error:
          "توقيع Webhook غير صحيح.",
      },
      {
        status: 401,
      }
    );
  }

  if (
    !Number.isInteger(
      callbackIntegrationId
    ) ||
    callbackIntegrationId !==
      expectedIntegrationId
  ) {
    console.error(
      "Paymob integration ID mismatch.",
      {
        expectedIntegrationId,
        callbackIntegrationId,
      }
    );

    return NextResponse.json(
      {
        error:
          "تكامل الدفع غير مطابق.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const paymentRecord =
      await findPaymentRecord(
        transaction,
        callbackAmount,
        callbackCurrency
      );

    if (!paymentRecord) {
      console.error(
        "Paymob payment record was not found.",
        {
          transactionId,

          specialReference:
            getSpecialReference(
              transaction
            ),

          intentionId:
            getIntentionId(
              transaction
            ),

          callbackAmount,
          callbackCurrency,
        }
      );

      return NextResponse.json(
        {
          error:
            "عملية الدفع غير موجودة.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      callbackAmount !==
      Number(
        paymentRecord.amount_cents
      )
    ) {
      console.error(
        "Paymob callback amount mismatch.",
        {
          callbackAmount,

          storedAmount:
            paymentRecord.amount_cents,
        }
      );

      return NextResponse.json(
        {
          error:
            "قيمة عملية الدفع غير مطابقة.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      callbackCurrency !==
      paymentRecord.currency
        .toUpperCase()
    ) {
      console.error(
        "Paymob callback currency mismatch.",
        {
          callbackCurrency,

          storedCurrency:
            paymentRecord.currency,
        }
      );

      return NextResponse.json(
        {
          error:
            "عملة عملية الدفع غير مطابقة.",
        },
        {
          status: 400,
        }
      );
    }

    const order =
      asRecord(
        transaction.order
      );

    const sourceData =
      asRecord(
        transaction.source_data
      );

    const orderId =
      getTextValue(
        order?.id,
        transaction.order
      );

    const paymentMethod = [
      getTextValue(
        sourceData?.type,
        transaction.source_data_type
      ),

      getTextValue(
        sourceData?.sub_type,
        transaction.source_data_sub_type
      ),
    ]
      .filter(Boolean)
      .join(" - ");

    const isSuccessful =
      toBoolean(
        transaction.success
      ) &&
      !toBoolean(
        transaction.pending
      ) &&
      !toBoolean(
        transaction.error_occured
      ) &&
      !toBoolean(
        transaction.is_refunded
      ) &&
      !toBoolean(
        transaction.is_voided
      );

    const adminSupabase =
      createAdminClient();

    const {
      data,
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
          payloadRecord,
      }
    );

    if (error) {
      console.error(
        "Paymob payment processing error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "تعذر تحديث عملية الدفع.",
        },
        {
          status: 500,
        }
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

      return NextResponse.json(
        {
          error:
            "تعذر تحديث استخدام كود الخصم.",
        },
        {
          status: 500,
        }
      );
    }

    console.log(
      "Paymob webhook processed successfully.",
      {
        transactionId,

        specialReference:
          paymentRecord
            .special_reference,

        isSuccessful,
      }
    );

    return NextResponse.json({
      received: true,
      processed: true,
      success: isSuccessful,
      result: data,
    });
  } catch (error) {
    console.error(
      "Paymob webhook processing error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "حدث خطأ أثناء معالجة Webhook.",
      },
      {
        status: 500,
      }
    );
  }
}