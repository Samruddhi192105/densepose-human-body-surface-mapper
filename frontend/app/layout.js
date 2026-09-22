import "./globals.css";

export const metadata = {
  title: "DensePose Human Body Surface Mapper",
  description:
    "Human body surface mapping using DensePose, IUV coordinates, and body-part analysis.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Questrial&display=block" />
      </head>
      <body>{children}</body>
    </html>
  );
}