import collection from "../collection.config.js";
import "./search.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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
          // The traditional Cambodian photo stays, but warm overlays darken
          // it just enough to keep text readable and give the site a cozy
          // terracotta-brown base, with a subtle gold glow near the top.
          backgroundImage:
            "radial-gradient(circle at 50% -10%, rgba(201, 162, 39, 0.14), transparent 56%), linear-gradient(rgba(43, 27, 18, 0.58), rgba(31, 21, 12, 0.72)), url('https://png.pngtree.com/thumb_back/fh260/background/20221102/pngtree-country-life-of-asia-children-play-water-and-build-sand-pagoda-image_1434723.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          color: "#F1E8D8",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          minHeight: "100vh",
        }}
      >
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
