const DEFAULT_FAVICON = "/icon-192.png";

let originalFavicon = null;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function setFaviconBadge(count) {
  if (typeof document === "undefined") return;

  const link = document.querySelector("link[rel*='icon']");
  if (!link) return;

  if (originalFavicon === null) {
    originalFavicon = link.href;
  }

  if (!count || count <= 0) {
    link.href = originalFavicon || DEFAULT_FAVICON;
    return;
  }

  try {
    const img = await loadImage(originalFavicon || DEFAULT_FAVICON);

    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(img, 0, 0, size, size);

    const radius = 18;
    const cx = size - radius - 2;
    const cy = radius + 2;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#dc2626";
    ctx.fill();

    const label = count > 99 ? "99+" : String(count);
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${label.length > 2 ? 16 : 22}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, cx, cy + 1);

    link.href = canvas.toDataURL("image/png");
  } catch (err) {
    console.error("Favicon badge error:", err);
  }
}

export function resetFavicon() {
  if (typeof document === "undefined") return;
  const link = document.querySelector("link[rel*='icon']");
  if (!link) return;
  if (originalFavicon) {
    link.href = originalFavicon;
  } else {
    link.href = DEFAULT_FAVICON;
  }
}