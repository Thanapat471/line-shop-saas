// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FlexBubble = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FlexMessage = any;

type Product = {
  id: string;
  name: string;
  description: string | null;
  price_amount: number;
  image_url: string | null;
};

function buildProductBubble(product: Product): FlexBubble {
  const priceText = `฿${Number(product.price_amount).toLocaleString("th-TH", {
    minimumFractionDigits: 0,
  })}`;

  const bubble: FlexBubble = {
    type: "bubble",
    size: "kilo",
    ...(product.image_url
      ? {
          hero: {
            type: "image",
            url: product.image_url,
            size: "full",
            aspectRatio: "4:3",
            aspectMode: "cover",
          },
        }
      : {}),
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "16px",
      contents: [
        {
          type: "text",
          text: product.name,
          weight: "bold",
          size: "md",
          wrap: true,
          color: "#111111",
        },
        ...(product.description
          ? [
              {
                type: "text" as const,
                text: product.description,
                size: "xs",
                color: "#888888",
                wrap: true,
                maxLines: 2,
              },
            ]
          : []),
        {
          type: "text",
          text: priceText,
          weight: "bold",
          size: "lg",
          color: "#00B900",
          margin: "md",
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#00B900",
          height: "sm",
          action: {
            type: "postback",
            label: "สั่งซื้อเลย",
            data: `action=order&productId=${product.id}`,
            displayText: `สั่งซื้อ ${product.name}`,
          },
        },
      ],
    },
  };

  return bubble;
}

export function buildProductCatalogMessage(products: Product[]): FlexMessage {
  const bubbles = products.slice(0, 10).map(buildProductBubble);

  const carousel = {
    type: "carousel" as const,
    contents: bubbles,
  };

  return {
    type: "flex",
    altText: "รายการสินค้า — กดเพื่อดูและสั่งซื้อ",
    contents: carousel,
  };
}

export function parsePostbackData(data: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(data));
}

export function buildLiffCatalogButton(liffId: string, channelId: string): FlexMessage {
  return {
    type: "flex",
    altText: "กดเพื่อดูสินค้าและสั่งซื้อได้เลยค่ะ",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: "🛍 ดูสินค้าของเรา",
            weight: "bold",
            size: "lg",
            color: "#111111",
          },
          {
            type: "text",
            text: "กดปุ่มด้านล่างเพื่อเลือกสินค้าและสั่งซื้อได้เลยค่ะ",
            size: "sm",
            color: "#888888",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#00B900",
            action: {
              type: "uri",
              label: "เปิดร้านค้า",
              uri: `https://liff.line.me/${liffId}?channelId=${channelId}`,
            },
          },
        ],
      },
    },
  };
}
