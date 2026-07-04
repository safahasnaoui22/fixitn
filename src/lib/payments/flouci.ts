export async function createFlouciPayment(input: {
  amount: number;     // in millimes
  orderId: string;
  successUrl: string;
  failUrl: string;
}) {
  const res = await fetch("https://developers.flouci.com/api/generate_payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_token: process.env.FLOUCI_APP_TOKEN,
      app_secret: process.env.FLOUCI_APP_SECRET,
      amount: input.amount * 1000,
      accept_card: true,
      session_timeout_secs: 1200,
      success_link: input.successUrl,
      fail_link: input.failUrl,
      developer_tracking_id: input.orderId,
    }),
  });
  const data = await res.json();
  return data.result?.link as string; // redirect client here
}

export async function verifyFlouciPayment(paymentId: string) {
  const res = await fetch(
    `https://developers.flouci.com/api/verify_payment/${paymentId}`,
    {
      headers: {
        "apppublic": process.env.FLOUCI_APP_TOKEN!,
        "appsecret": process.env.FLOUCI_APP_SECRET!,
      },
    }
  );
  return res.json();
}