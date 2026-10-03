export const createImageFixture = async (width: number, height: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  const tokens = getComputedStyle(document.documentElement);
  context.fillStyle = tokens.getPropertyValue("--primary-color");
  context.fillRect(0, 0, width / 2, height);
  context.fillStyle = tokens.getPropertyValue("--font-color");
  context.fillRect(width / 2, 0, width / 2, height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("Image fixture unavailable"));
    }, "image/png");
  });
  return new File([blob], "photo.png", { type: "image/png" });
};
