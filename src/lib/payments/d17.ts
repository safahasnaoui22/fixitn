export async function createD17Payment(input: {
  amount: number;       // in millimes (1 DT = 1000)
  orderId: string;      // your requestId
  returnUrl: string;    // where user lands after payment
  cancelUrl: string;
}) {
  const res = await fetch("https://api.d17.com.tn/payment/init", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.D17_SECRET_KEY}`,
    },
    body: JSON.stringify({
      merchant_id: process.env.D17_MERCHANT_ID,
      amount: input.amount * 1000,
      order_id: input.orderId,
      return_url: input.returnUrl,
      cancel_url: input.cancelUrl,
    }),
  });
  const data = await res.json();
  return data.payment_url as string; // redirect client here
}