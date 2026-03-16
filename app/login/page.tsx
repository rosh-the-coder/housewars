import Link from "next/link";
import { inter } from "@/lib/fonts";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <section className={`${inter.className} min-h-[calc(100vh-78px)] bg-[#111111]`}>
      <div className="mx-auto flex min-h-[calc(100vh-78px)] w-full max-w-[1440px] flex-col lg:flex-row">
        <aside className="flex w-full flex-col items-center justify-center gap-8 bg-[#DC2626] px-8 py-16 text-center text-white lg:w-1/2 lg:gap-12 lg:px-20">
          <h1 className="text-5xl font-bold tracking-[-0.04em] lg:text-7xl">HOUSEWARS</h1>
          <div className="h-1 w-full max-w-[560px] bg-white" />
          <p className="text-xl font-bold tracking-[0.2em] lg:text-[28px]">FIGHT FOR YOUR HOUSE.</p>
          <p className="text-[11px] font-medium tracking-[0.2em] text-white/75">
            4 HOUSES - 1,200 PLAYERS - INFINITE GLORY
          </p>
        </aside>

        <div className="flex w-full items-center bg-white px-8 py-14 lg:w-1/2 lg:border-l-4 lg:border-[#0D0D0D] lg:px-20">
          <div className="w-full space-y-8">
            <h2 className="text-5xl font-bold tracking-[-0.04em] text-[#0D0D0D] lg:text-6xl">LOGIN</h2>

            {params.error ? (
              <p className="border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{params.error}</p>
            ) : null}
            {params.success ? (
              <p className="border border-green-300 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{params.success}</p>
            ) : null}

            <form action="/api/auth/login" method="post" className="space-y-6">
              <label className="block space-y-2">
                <span className="block text-[11px] font-semibold tracking-[0.14em] text-[#0D0D0D]">
                  USERNAME / EMAIL
                </span>
                <input
                  name="email"
                  type="email"
                  placeholder="ENTER EMAIL ADDRESS"
                  required
                  className="h-[52px] w-full border-[3px] border-[#0D0D0D] px-4 text-[13px] tracking-[0.03em] text-[#0D0D0D] placeholder:text-[#CCCCCC] focus:outline-none"
                />
              </label>

              <label className="block space-y-2">
                <span className="block text-[11px] font-semibold tracking-[0.14em] text-[#0D0D0D]">PASSWORD</span>
                <input
                  name="password"
                  type="password"
                  placeholder="************"
                  required
                  className="h-[52px] w-full border-[3px] border-[#0D0D0D] px-4 text-lg tracking-[0.22em] text-[#0D0D0D] placeholder:text-[#CCCCCC] focus:outline-none"
                />
              </label>

              <button
                type="submit"
                className="flex h-14 w-full items-center justify-center bg-[#0D0D0D] text-sm font-semibold tracking-[0.28em] text-white transition hover:opacity-90"
              >
                ENTER
              </button>
            </form>

            <div className="h-px w-full bg-[#CCCCCC]" />
            <p className="text-center text-xs font-semibold tracking-[0.12em] text-[#0D0D0D]">
              NO ACCOUNT?{" "}
              <Link href="/signup" className="underline underline-offset-2">
                SIGN UP
              </Link>{" "}
              {String.fromCharCode(8594)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
