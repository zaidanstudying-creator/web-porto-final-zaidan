import { notFound } from "next/navigation";
import ReactBitsLab from "./react-bits-lab";

export const metadata = {
  title: "React Bits Smoke Test",
  robots: { index: false, follow: false },
};

export default function ReactBitsSmokeTestPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <ReactBitsLab />;
}
