"use client";

import Image from "next/image";
import {
  useEffect,
  useState,
} from "react";
import {
  LoaderCircle,
  QrCode,
} from "lucide-react";
import QRCode from "qrcode";

type CertificateQRCodeProps = {
  verificationCode: string;
  size?: number;
  className?: string;
  showLabel?: boolean;
};

export default function CertificateQRCode({
  verificationCode,
  size = 120,
  className = "",
  showLabel = true,
}: CertificateQRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] =
    useState("");

  const [hasError, setHasError] =
    useState(false);

  useEffect(() => {
    let isMounted = true;

    const generateQRCode = async () => {
      const cleanCode =
        verificationCode
          .trim()
          .toUpperCase();

      if (!cleanCode) {
        setHasError(true);
        return;
      }

      setHasError(false);
      setQrCodeUrl("");

      try {
        const configuredSiteUrl =
          process.env
            .NEXT_PUBLIC_SITE_URL
            ?.trim();

        const siteOrigin = (
          configuredSiteUrl ||
          window.location.origin
        ).replace(/\/+$/, "");

        const verificationUrl =
          `${siteOrigin}` +
          `/verify-certificate?code=` +
          encodeURIComponent(cleanCode);

        const dataUrl =
          await QRCode.toDataURL(
            verificationUrl,
            {
              errorCorrectionLevel: "H",
              margin: 1,

              width: Math.max(
                size * 2,
                240
              ),

              color: {
                dark: "#111111",
                light: "#FFFFFF",
              },
            }
          );

        if (isMounted) {
          setQrCodeUrl(dataUrl);
        }
      } catch (error) {
        console.error(
          "تعذر إنشاء رمز QR:",
          error
        );

        if (isMounted) {
          setHasError(true);
        }
      }
    };

    void generateQRCode();

    return () => {
      isMounted = false;
    };
  }, [verificationCode, size]);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-4 text-center ${className}`}
      >
        <QrCode
          size={28}
          className="text-red-400"
        />

        <p className="mt-2 text-xs font-bold text-red-300">
          تعذر إنشاء رمز QR
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center text-center ${className}`}
    >
      <div
        className="flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white p-2 print:border-black/20"
        style={{
          width: size + 16,
          height: size + 16,
        }}
      >
        {qrCodeUrl ? (
          <Image
            src={qrCodeUrl}
            alt="رمز التحقق من الشهادة"
            width={size}
            height={size}
            unoptimized
            className="h-auto w-auto"
          />
        ) : (
          <LoaderCircle
            size={28}
            className="animate-spin text-purple-600"
          />
        )}
      </div>

      {showLabel && (
        <div className="mt-3">
          <p className="text-xs font-black text-zinc-300 print:text-black">
            امسح للتحقق
          </p>

          <p
            dir="ltr"
            className="mt-1 font-mono text-[10px] text-zinc-500 print:text-zinc-700"
          >
            {verificationCode}
          </p>
        </div>
      )}
    </div>
  );
}