import collection from "../collection.config.js";

export const metadata = {
  title: `${collection.name} — Khmer Living Archive`,
  description: collection.description,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          // backgroundColor: "#14181F",
          backgroundImage: "url('https://png.pngtree.com/thumb_back/fh260/background/20221102/pngtree-country-life-of-asia-children-play-water-and-build-sand-pagoda-image_1434723.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          color: "#E8EDF2",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          minHeight: "100vh",
        }}
      >
        {children}
      </body>
    </html>
  );
}
