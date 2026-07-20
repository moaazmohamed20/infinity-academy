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
  special_reference: string;
  amount_cents: number;
  currency: string;
  status: string;
  is_test: boolean;
};

function toBoolean(
  value: string | null
) {
  return (
    value?.trim().toLowerCase() ===
    "true"
  );
}

function getParameter(
  request: NextRequest,
  name: string
) {
  return (
    request.nextUrl.searchParams.get(
      name
    ) ?? ""
  );
}

function createHmacString(
  request: NextRequest
) {
  const parameters =
    request.nextUrl.searchParams;

  const integration =
    parameters.get("integration") ??
    parameters.get(
      "integration_id"
    ) ??
    "";

  const values = [
    parameters.get("amount_cents"),
    parameters.get("created_at"),
    parameters.get("currency"),
    parameters.get("error_occured"),
    parameters.get(
      "has_parent_transaction"
    ),
    parameters.get("id"),
    integration,
    parameters.get("is_3d_secure"),
    parameters.get("is_auth"),
    parameters.get("is_capture"),
    parameters.get("is_refunded"),
    parameters.get(
      "is_standalone_payment"
    ),
    parameters.get("is_voided"),
    parameters.get("order"),
    parameters.get("owner"),
    parameters.get("pending"),
    parameters.get("source_data_pan"),
    parameters.get(
      "source_data_sub_type"
    ),
    parameters.get(
      "source_data_type"
    ),
    parameters.get("success"),
  ];

  return values
    .map((value) => value ?? "")
    .join("");
}

function verifyHmac(
  request: NextRequest,
  hmacSecret: string
) {
  const receivedHmac =
    getParameter(
      request,
      "hmac"
    )
      .trim()
      .toLowerCase();

  if (
    !/^[a-f0-9]{128}$/.test(
      receivedHmac
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
        createHmacString(request)
      )
      .digest("hex");

  const receivedBuffer =
    Buffer.from(
      receivedHmac,
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

function redirectToResult(
  request: NextRequest,
  callbackStatus: string
) {
  const resultUrl = new URL(
    "/payment/result",
    request.nextUrl.origin
  );

  resultUrl.searchParams.set(
    "callback",
    callbackStatus
  );

  return NextResponse.redirect(
    resultUrl,
    303
  );
}

export async function GET(
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
      "Paymob return environment variables are missing."
    );

    return NextResponse.json(
      {
        error:
          "إعدادات Paymob غير مكتملة.",
      },
      {
        status: 500,
      }
    );
  }

  if (
    !verifyHmac(
      request,
      hmacSecret
    )
  ) {
    console.error(
      "Invalid Paymob return HMAC."
    );

    return NextResponse.json(
      {
        error:
          "توقيع نتيجة الدفع غير صحيح.",
      },
      {
        status: 401,
      }
    );
  }

  const callbackAmount = Number(
    getParameter(
      request,
      "amount_cents"
    )
  );

  const callbackCurrency =
    getParameter(
      request,
      "currency"
    ).toUpperCase();

  const callbackIntegrationId =
    Number(
      getParameter(
        request,
        "integration"
      ) ||
        getParameter(
          request,
          "integration_id"
        )
    );

  const transactionId =
    getParameter(
      request,
      "id"
    );

  const orderId =
    getParameter(
      request,
      "order"
    );

  if (
    !Number.isInteger(
      callbackAmount
    ) ||
    callbackAmount <= 0 ||
    !callbackCurrency ||
    !transactionId
  ) {
    return NextResponse.json(
      {
        error:
          "بيانات نتيجة الدفع غير مكتملة.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    callbackIntegrationId !==
    expectedIntegrationId
  ) {
    console.error(
      "Paymob return integration mismatch."
    );

    return NextResponse.json(
      {
        error:
          "رقم تكامل الدفع غير مطابق.",
      },
      {
        status: 400,
      }
    );
  }

  const supabase =
    await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  if (
    claimsError ||
    !claimsData?.claims
  ) {
    const loginUrl = new URL(
      "/login",
      request.nextUrl.origin
    );

    loginUrl.searchParams.set(
      "next",
      "/payment/result"
    );

    return NextResponse.redirect(
      loginUrl,
      303
    );
  }

  const claims =
    claimsData.claims as Record<
      string,
      unknown
    >;

  const userId =
    typeof claims.sub === "string"
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

  const adminSupabase =
    createAdminClient();

  const merchantReference =
    getParameter(
      request,
      "merchant_order_id"
    ) ||
    getParameter(
      request,
      "special_reference"
    );

  let payment:
    | PaymentRecord
    | null = null;

  if (merchantReference) {
    const {
      data,
      error,
    } = await adminSupabase
      .from("payment_transactions")
      .select(
        `
          id,
          user_id,
          special_reference,
          amount_cents,
          currency,
          status,
          is_test
        `
      )
      .eq(
        "user_id",
        userId
      )
      .eq(
        "special_reference",
        merchantReference
      )
      .maybeSingle();

    if (error) {
      console.error(
        "Payment reference lookup error:",
        error
      );
    }

    payment =
      data as PaymentRecord | null;
  }

  if (!payment) {
    const oldestAllowedDate =
      new Date(
        Date.now() -
          24 * 60 * 60 * 1000
      ).toISOString();

    const {
      data,
      error,
    } = await adminSupabase
      .from("payment_transactions")
      .select(
        `
          id,
          user_id,
          special_reference,
          amount_cents,
          currency,
          status,
          is_test
        `
      )
      .eq(
        "user_id",
        userId
      )
      .eq(
        "amount_cents",
        callbackAmount
      )
      .eq(
        "currency",
        callbackCurrency
      )
      .in(
        "status",
        ["pending", "paid"]
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
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        "Pending payment lookup error:",
        error
      );
    }

    payment =
      data as PaymentRecord | null;
  }

  if (!payment) {
    console.error(
      "Payment record was not found for Paymob return."
    );

    return redirectToResult(
      request,
      "payment-not-found"
    );
  }

  if (
    Number(
      payment.amount_cents
    ) !== callbackAmount
  ) {
    console.error(
      "Paymob return amount mismatch."
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
    payment.currency.toUpperCase() !==
    callbackCurrency
  ) {
    console.error(
      "Paymob return currency mismatch."
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

  const {
    data: duplicateTransaction,
    error: duplicateError,
  } = await adminSupabase
    .from("payment_transactions")
    .select(
      `
        id,
        user_id
      `
    )
    .eq(
      "paymob_transaction_id",
      transactionId
    )
    .maybeSingle();

  if (duplicateError) {
    console.error(
      "Duplicate transaction check error:",
      duplicateError
    );

    return NextResponse.json(
      {
        error:
          "تعذر التحقق من رقم المعاملة.",
      },
      {
        status: 500,
      }
    );
  }

  if (
    duplicateTransaction &&
    duplicateTransaction.id !==
      payment.id
  ) {
    console.error(
      "Paymob transaction ID was already used."
    );

    return NextResponse.json(
      {
        error:
          "رقم المعاملة مستخدم بالفعل.",
      },
      {
        status: 409,
      }
    );
  }

  const success =
    toBoolean(
      request.nextUrl.searchParams.get(
        "success"
      )
    );

  const pending =
    toBoolean(
      request.nextUrl.searchParams.get(
        "pending"
      )
    );

  const errorOccurred =
    toBoolean(
      request.nextUrl.searchParams.get(
        "error_occured"
      )
    );

  const isRefunded =
    toBoolean(
      request.nextUrl.searchParams.get(
        "is_refunded"
      )
    );

  const isVoided =
    toBoolean(
      request.nextUrl.searchParams.get(
        "is_voided"
      )
    );

  const isSuccessful =
    success &&
    !pending &&
    !errorOccurred &&
    !isRefunded &&
    !isVoided;

  const sourceType =
    getParameter(
      request,
      "source_data_type"
    );

  const sourceSubtype =
    getParameter(
      request,
      "source_data_sub_type"
    );

  const paymentMethod = [
    sourceType,
    sourceSubtype,
  ]
    .filter(Boolean)
    .join(" - ");

  const rawPayload =
    Object.fromEntries(
      request.nextUrl.searchParams.entries()
    );

  const {
    error: processingError,
  } = await adminSupabase.rpc(
    "process_paymob_payment",
    {
      p_special_reference:
        payment.special_reference,

      p_success:
        isSuccessful,

      p_paymob_transaction_id:
        transactionId,

      p_paymob_order_id:
        orderId || null,

      p_payment_method:
        paymentMethod || null,

      p_is_test:
        payment.is_test,

      p_raw_payload:
        rawPayload,
    }
  );

  if (processingError) {
    console.error(
      "Paymob return processing error:",
      processingError
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

  return redirectToResult(
    request,
    isSuccessful
      ? "success"
      : "failed"
  );
}