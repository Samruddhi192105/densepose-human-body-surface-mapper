import "./globals.css";

export const metadata = {
  title: "DensePose Human Body Surface Mapper",
  description:
    "Human body surface mapping using DensePose, IUV coordinates, and body-part analysis.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}