import Link from "next/link";
import { inter, jetMono } from "@/lib/fonts";

export const dynamic = "force-dynamic";

type SignupPageProps = {
  searchParams: Promise<{ error?: string; success?: string; info?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  return (
    <section className={`${inter.className} min-h-[calc(100vh-78px)] bg-[#111111]`}>
      <div className="mx-auto flex min-h-[calc(100vh-78px)] w-full max-w-[1440px] flex-col lg:flex-row">
        <aside className="flex w-full flex-col justify-center gap-8 bg-[#2563EB] px-8 py-14 text-white lg:w-[42%] lg:gap-10 lg:px-14">
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-[-0.03em] lg:text-7xl">HOUSE</h1>
            <h1 className="text-5xl font-black tracking-[-0.03em] text-black lg:text-7xl">WARS</h1>
          </div>
          <p className="max-w-[460px] whitespace-pre-line text-lg font-extrabold leading-[1.4] tracking-[0.06em] lg:text-[22px]">
            PICK YOUR HOUSE.{"\n"}EARN POINTS.{"\n"}DESTROY THE REST.
          </p>
          <div className="h-1 w-full max-w-[460px] bg-white" />
          <div className="space-y-3">
            <p className="text-sm font-bold tracking-[0.14em] text-white/80">4 HOUSES IN BATTLE</p>
            <p className="text-sm font-bold tracking-[0.14em] text-white/80">1,200+ PLAYERS</p>
            <p className="text-sm font-bold tracking-[0.14em] text-white/80">INFINITE GLORY</p>
          </div>
        </aside>

        <div className="flex w-full items-center bg-[#111111] px-8 py-14 text-white lg:w-[58%] lg:px-[72px]">
          <div className="w-full space-y-8">
            <div>
              <h2 className="text-5xl font-black tracking-[-0.03em] lg:text-[52px]">SIGN UP</h2>
              <p className="mt-2 text-[13px] font-semibold tracking-[0.16em] text-[#999999]">
                CREATE YOUR ACCOUNT. JOIN THE WAR.
              </p>
            </div>

            {params.error ? (
              <p className="border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{params.error}</p>
            ) : null}
            {params.success ? (
              <p className="border border-green-300 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{params.success}</p>
            ) : null}
            {params.info ? (
              <p className="border border-blue-300 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">{params.info}</p>
            ) : null}

            <div className="h-[3px] w-full bg-white" />

            <form action="/api/auth/signup" method="post" className="space-y-5">
              <label className="block space-y-2">
                <span className="text-[11px] font-bold tracking-[0.18em] text-[#999999]">USERNAME</span>
                <input
                  name="username"
                  type="text"
                  placeholder="e.g. DESTROYER_99"
                  required
                  className={`${jetMono.className} h-[52px] w-full border-[3px] border-white bg-black px-4 text-sm text-white placeholder:text-[#444444] focus:outline-none`}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-[11px] font-bold tracking-[0.18em] text-[#999999]">EMAIL</span>
                <input
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  className={`${jetMono.className} h-[52px] w-full border-[3px] border-white bg-black px-4 text-sm text-white placeholder:text-[#444444] focus:outline-none`}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-[11px] font-bold tracking-[0.18em] text-[#999999]">PASSWORD</span>
                  <input
                    name="password"
                    type="password"
                    placeholder="********"
                    required
                    minLength={6}
                    className={`${jetMono.className} h-[52px] w-full border-[3px] border-white bg-black px-4 text-sm text-white placeholder:text-[#444444] focus:outline-none`}
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-[11px] font-bold tracking-[0.18em] text-[#999999]">CONFIRM PASSWORD</span>
                  <input
                    name="confirm_password"
                    type="password"
                    placeholder="********"
                    required
                    className={`${jetMono.className} h-[52px] w-full border-[3px] border-white bg-black px-4 text-sm text-white placeholder:text-[#444444] focus:outline-none`}
                  />
                </label>
              </div>

              <button
                type="submit"
                className="flex h-[60px] w-full items-center justify-center bg-[#DC2626] text-lg font-black tracking-[0.18em] text-white transition hover:opacity-90"
              >
                JOIN THE WAR {String.fromCharCode(8594)}
              </button>
            </form>

            <div className="h-px w-full bg-[#333333]" />
            <p className="flex items-center justify-center gap-2 text-center">
              <span className="text-xs font-semibold tracking-[0.08em] text-[#666666]">ALREADY HAVE AN ACCOUNT?</span>
              <Link href="/login" className="text-xs font-extrabold tracking-[0.08em] text-white">
                LOGIN {String.fromCharCode(8594)}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
