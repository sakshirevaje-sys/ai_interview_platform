import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 800, margin: "40px auto", padding: 20, background: "#fff", borderRadius: 12 }}>
      <h1>NEXTHIRE-AI</h1>
      <p>Secure exam mode is enabled for assessments.</p>
      <ul>
        <li>
          <Link href="/assessment/sample-test">Open secure assessment sample</Link>
        </li>
        <li>
          <Link href="/admin/secure-exam">Open admin secure exam dashboard</Link>
        </li>
      </ul>
    </main>
  );
}
