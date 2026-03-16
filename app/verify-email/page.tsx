import Link from "next/link";
import { inter, oswald } from "@/lib/fonts";

type VerifyEmailPageProps = {
  searchParams: Promise<{ email?: string; success?: string; info?: string }>;
};

function obfuscateEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  if (name.length <= 2) return `${name[0] ?? "*"}*@${domain}`;
  return `${name[0]}${"*".repeat(Math.max(1, name.length - 2))}${name[name.length - 1]}@${domain}`;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const safeEmail = params.email?.trim() ?? "";

  return (
    <section className={`${inter.className} min-h-[calc(100vh-78px)] bg-[#111111] text-white`}>
      <div className="mx-auto flex min-h-[calc(100vh-78px)] w-full max-w-[1400px] flex-col lg:flex-row">
        <aside className="flex w-full flex-col justify-center gap-8 bg-[#FACC15] px-8 py-14 text-[#0D0D0D] lg:w-1/2 lg:px-20">
          <p className="text-xs font-black tracking-[0.22em]">AUTH STEP 2 / VERIFY ID</p>
          <h1 className={`${oswald.className} text-6xl uppercase leading-none lg:text-8xl`}>VERIFY FIRST.</h1>
          <p className="max-w-xl text-sm font-semibold tracking-[0.06em]">
            Before you can sign in, verify your email ID using the confirmation link we sent you.
          </p>
          {safeEmail ? (
            <p className="inline-flex w-fit border-[3px] border-[#0D0D0D] bg-white px-4 py-2 text-xs font-bold tracking-[0.12em]">
              SENT TO: {obfuscateEmail(safeEmail)}
            </p>
          ) : null}
        </aside>

        <div className="flex w-full items-center border-l-0 border-[#0D0D0D] bg-[#F5F5F0] px-8 py-14 text-[#0D0D0D] lg:w-1/2 lg:border-l-4 lg:px-20">
          <div className="w-full space-y-6">
            <h2 className={`${oswald.className} text-5xl uppercase leading-none lg:text-6xl`}>CHECK YOUR INBOX</h2>
            {params.success ? (
              <p className="border-[3px] border-[#0D0D0D] bg-white px-4 py-3 text-sm font-semibold">{params.success}</p>
            ) : null}
            {params.info ? (
              <p className="border-[3px] border-[#0D0D0D] bg-white px-4 py-3 text-sm font-semibold">{params.info}</p>
            ) : null}
            <ol className="space-y-3 text-sm font-semibold tracking-[0.04em]">
              <li>1. Open your confirmation email.</li>
              <li>2. Click the verification link.</li>
              <li>3. Return here and sign in.</li>
            </ol>
            <div className="h-px w-full bg-[#B5B5B5]" />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-14 items-center justify-center border-[3px] border-[#0D0D0D] bg-[#111111] px-8 text-xs font-black tracking-[0.2em] text-white transition hover:opacity-90"
              >
                GO TO LOGIN
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-14 items-center justify-center border-[3px] border-[#0D0D0D] bg-transparent px-8 text-xs font-black tracking-[0.2em] text-[#0D0D0D] transition hover:bg-[#0D0D0D] hover:text-white"
              >
                BACK TO SIGN UP
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
