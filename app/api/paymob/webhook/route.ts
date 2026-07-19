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

function toHmacValue(
  value: unknown
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
}

function toBoolean(
  value: unknown
) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return (
      value.trim().toLowerCase() ===
      "true"
    );
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return false;
}

function getTextValue(
  ...values: unknown[]
) {
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

function createCallbackHmacString(
  transaction: JsonRecord
) {
  const order =
    asRecord(transaction.order);

  const sourceData =
    asRecord(
      transaction.source_data
    );

  const values = [
    transaction.amount_cents,
    transaction.created_at,
    transaction.currency,
    transaction.error_occured,
    transaction.has_parent_transaction,
    transaction.id,
    transaction.integration,
    transaction.is_3d_secure,
    transaction.is_auth,
    transaction.is_capture,
    transaction.is_refunded,
    transaction.is_standalone_payment,
    transaction.is_voided,
    order?.id ??
      transaction.order,
    transaction.owner,
    transaction.pending,
    sourceData?.pan,
    sourceData?.sub_type,
    sourceData?.type,
    transaction.success,
  ];

  return values
    .map(toHmacValue)
    .join("");
}

function verifyCallbackHmac(
  transaction: JsonRecord,
  receivedHmac: string,
  hmacSecret: string
) {
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

  const calculatedHmac =
    createHmac(
      "sha512",
      hmacSecret
    )
      .update(
        createCallbackHmacString(
          transaction
        )
      )
      .digest("hex");

  const calculatedBuffer =
    Buffer.from(
      calculatedHmac,
      "hex"
    );

  const receivedBuffer =
    Buffer.from(
      normalizedReceivedHmac,
      "hex"
    );

  if (
    calculatedBuffer.length !==
    receivedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    calculatedBuffer,
    receivedBuffer
  );
}

function getSpecialReference(
  transaction: JsonRecord
) {
  const order =
    asRecord(transaction.order);

  const intention =
    asRecord(
      transaction.intention
    );

  const paymentKeyClaims =
    asRecord(
      transaction.payment_key_claims
    );

  const extra =
    asRecord(
      paymentKeyClaims?.extra
    );

  return getTextValue(
    transaction.special_reference,
    transaction.merchant_order_id,
    order?.merchant_order_id,
    order?.special_reference,
    intention?.special_reference,
    extra?.special_reference,
    extra?.merchant_order_id
  );
}

function getIntentionId(
  transaction: JsonRecord
) {
  const intention =
    asRecord(
      transaction.intention
    );

  return getTextValue(
    transaction.intention_id,
    transaction.payment_intention_id,
    intention?.id
  );
}

async function findPaymentRecord(
  transaction: JsonRecord
) {
  const adminSupabase =
    createAdminClient();

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
      .select(
        `
          id,
          amount_cents,
          currency,
          special_reference
        `
      )
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

  if (!intentionId) {
    return null;
  }

  const {
    data,
    error,
  } = await adminSupabase
    .from("payment_transactions")
    .select(
      `
        id,
        amount_cents,
        currency,
        special_reference
      `
    )
    .eq(
      "paymob_intention_id",
      intentionId
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data
    ? (data as PaymentRecord)
    : null;
}

export async function POST(
  request: NextRequest
) {
  const hmacSecret =
    process.env.PAYMOB_HMAC?.trim();

  const integrationId =
    Number(
      process.env
        .PAYMOB_INTEGRATION_ID
    );

  if (
    !hmacSecret ||
    !Number.isInteger(
      integrationId
    ) ||
    integrationId <= 0
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

  const receivedHmac =
    request.nextUrl.searchParams
      .get("hmac") ?? "";

  let payload: unknown;

  try {
    payload =
      await request.json();
  } catch {
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

  const transaction =
    asRecord(
      payloadRecord?.obj
    );

  if (!payloadRecord || !transaction) {
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
      "Invalid Paymob callback HMAC."
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

  try {
    const paymentRecord =
      await findPaymentRecord(
        transaction
      );

    if (!paymentRecord) {
      console.error(
        "Paymob payment record was not found."
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

    const callbackAmount =
      Number(
        transaction.amount_cents
      );

    const callbackCurrency =
      getTextValue(
        transaction.currency
      ).toUpperCase();

    const callbackIntegrationId =
      Number(
        transaction.integration
      );

    if (
      !Number.isInteger(
        callbackAmount
      ) ||
      callbackAmount !==
        Number(
          paymentRecord.amount_cents
        )
    ) {
      console.error(
        "Paymob callback amount mismatch."
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
      paymentRecord.currency.toUpperCase()
    ) {
      console.error(
        "Paymob callback currency mismatch."
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

    if (
      !Number.isInteger(
        callbackIntegrationId
      ) ||
      callbackIntegrationId !==
        integrationId
    ) {
      console.error(
        "Paymob integration ID mismatch."
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

    const order =
      asRecord(
        transaction.order
      );

    const sourceData =
      asRecord(
        transaction.source_data
      );

    const transactionId =
      getTextValue(
        transaction.id
      );

    const orderId =
      getTextValue(
        order?.id,
        transaction.order
      );

    const paymentMethod =
      [
        getTextValue(
          sourceData?.type
        ),
        getTextValue(
          sourceData?.sub_type
        ),
      ]
        .filter(Boolean)
        .join(" - ");

    const success =
      toBoolean(
        transaction.success
      );

    const pending =
      toBoolean(
        transaction.pending
      );

    const errorOccurred =
      toBoolean(
        transaction.error_occured
      );

    const isRefunded =
      toBoolean(
        transaction.is_refunded
      );

    const isVoided =
      toBoolean(
        transaction.is_voided
      );

    const isSuccessful =
      success &&
      !pending &&
      !errorOccurred &&
      !isRefunded &&
      !isVoided;

    const isTest =
      toBoolean(
        transaction.is_test
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
          paymentRecord.special_reference,

        p_success:
          isSuccessful,

        p_paymob_transaction_id:
          transactionId || null,

        p_paymob_order_id:
          orderId || null,

        p_payment_method:
          paymentMethod || null,

        p_is_test:
          isTest,

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

    return NextResponse.json({
      received: true,
      processed: true,
      success:
        isSuccessful,
      result: data,
    });
  } catch (error) {
    console.error(
      "Paymob webhook error:",
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