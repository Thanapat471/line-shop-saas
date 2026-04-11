export type SlipVerifyResult = {
  transRef: string;
  amount: number;
  receiverAccount: string;
  transDate: string;
};

/**
 * ส่ง base64 slip image ไป EasySlip API เพื่อตรวจสอบ
 * คืนค่า null ถ้าไม่ได้ตั้งค่า API key หรือ slip ไม่ valid
 */
export async function verifySlipWithEasySlip(
  imageBase64: string,
): Promise<SlipVerifyResult | null> {
  const apiKey = process.env.EASYSLIP_API_KEY;
  if (!apiKey) return null;

  let res: Response;
  try {
    res = await fetch("https://developer.easyslip.com/api/v1/verify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload: imageBase64 }),
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  const json = await res.json();
  if (json.status !== 200 || !json.data) return null;

  const d = json.data;
  return {
    transRef: d.transRef ?? "",
    amount: d.amount?.amount ?? 0,
    receiverAccount: d.receiver?.account?.value ?? "",
    transDate: `${d.date ?? ""} ${d.time ?? ""}`.trim(),
  };
}
