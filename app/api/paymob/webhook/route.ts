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

type JsonRecord = Record<string, unknown>;

type PaymentRecord = {
  id: string;
  amount_cents: number;
  currency: string;
  special_reference: string;
  is_test: boolean;
};

/*
 * ترتيب الحقول الرسمي لحساب HMAC
 * في Transaction Processed Callback الحالي.
 */
const HMAC_FIELDS = [
  "amount",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order",
  "owner",
  "pending",
  "source_data_pan",
  "source_data_sub_type",
  "source_data_type",
  "success",
] as const;

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
      value.trim().toLowerCase() ===
      "true"
    );
  }

  return false;
}

/*
 * تحويل قيمة الحقل إلى النص المستخدم
 * داخل حساب HMAC.
 *
 * حقل order قد يصل ككائن يحتوي على id.
 */
function toHmacValue(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "object") {
    const record = asRecord(value);

    if (
      record &&
      record.id !== null &&
      record.id !== undefined
    ) {
      return String(record.id);
    }

    return JSON.stringify(value);
  }

  return String(value);
}

function createCallbackHmacString(
  transaction: JsonRecord
): string {
  return HMAC_FIELDS
    .map((field) => {
      return toHmacValue(
        transaction[field]
      );
    })
    .join("");
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

  /*
   * SHA-512 ينتج 128 حرفًا Hex.
   */
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

  const receivedBuffer =
    Buffer.from(
      normalizedReceivedHmac,
      "hex"
    );

  const calculatedBuffer =
    Buffer.from(
      calculatedHmac,
      "hex"
    );

  if (
    receivedBuffer.length !==
    calculatedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    receivedBuffer,
    calculatedBuffer
  );
}

function getIntegrationId(
  transaction: JsonRecord
): string {
  const integrationObject =
    asRecord(
      transaction.integration
    );

  return getTextValue(
    transaction.integration_id,
    integrationObject?.id,
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

  const paymentKeyClaims =
    asRecord(
      transaction.payment_key_claims
    );

  const extra =
    asRecord(
      paymentKeyClaims?.extra
    );

  const transactionExtras =
    asRecord(
      transaction.extras
    );

  return getTextValue(
    transaction.special_reference,
    transaction.merchant_order_id,

    order?.merchant_order_id,
    order?.special_reference,

    intention?.special_reference,
    intention?.merchant_order_id,

    extra?.special_reference,
    extra?.merchant_order_id,

    transactionExtras?.special_reference,
    transactionExtras?.merchant_order_id
  );
}

function getIntentionId(
  transaction: JsonRecord
): string {
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
    transaction.intention_id,
    transaction.payment_intention_id,
    intention?.id,

    /*
     * يدعم وصول intention كسلسلة نصية.
     */
    transaction.intention,

    extra?.intention_id,
    extra?.payment_intention_id
  );
}

async function findPaymentRecord(
  transaction: JsonRecord
): Promise<PaymentRecord | null> {
  const adminSupabase =
    createAdminClient();

  const transactionId =
    getTextValue(
      transaction.id
    );

  /*
   * أولًا: البحث برقم معاملة Paymob.
   * يفيد عند إعادة إرسال نفس Webhook.
   */
  if (transactionId) {
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
          special_reference,
          is_test
        `
      )
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

  /*
   * ثانيًا: البحث بالمرجع الخاص بالموقع.
   */
  const specialReference =
    getSpecialReference(
      transaction
    );

  if (specialReference) {
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
          special_reference,
          is_test
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

  /*
   * ثالثًا: البحث برقم Payment Intention.
   */
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
        special_reference,
        is_test
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

  /*
   * الشكل المعتاد:
   *
   * {
   *   type: "TRANSACTION",
   *   obj: { ... }
   * }
   */
  const transaction =
    asRecord(
      payloadRecord.obj
    ) ?? payloadRecord;

  /*
   * Paymob ترسل hmac داخل Query Parameters.
   */
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

  /*
   * Intention Callback الحالي يستخدم amount.
   * amount_cents موجود كاحتياط لقراءة القيمة فقط،
   * لكنه لا يدخل في HMAC الحالي.
   */
  const callbackAmount =
    Number(
      transaction.amount ??
      transaction.amount_cents
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
          Object.keys(transaction),
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
        hmacFields:
          HMAC_FIELDS,
        transactionKeys:
          Object.keys(transaction),
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
        transaction
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
        transaction.source_data_type,
        sourceData?.type
      ),

      getTextValue(
        transaction.source_data_sub_type,
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
          transactionId,

        p_paymob_order_id:
          orderId || null,

        p_payment_method:
          paymentMethod || null,

        /*
         * نستخدم القيمة المخزنة عند إنشاء الدفع،
         * وليس قيمة قادمة من Callback.
         */
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

    console.log(
      "Paymob webhook processed successfully.",
      {
        transactionId,
        specialReference:
          paymentRecord.special_reference,
        isSuccessful,
      }
    );

    return NextResponse.json({
      received: true,
      processed: true,
      success:
        isSuccessful,
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