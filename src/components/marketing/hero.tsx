"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useDyRouter, ROUTES } from "@/lib/router";
import { useSite, usePublicStats } from "@/hooks/use-site";
import { HeroScene3D } from "@/components/three/scene-loader";
import { PhoneHero } from "@/components/three/phone-scene";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

export function Hero() {
  const { navigate } = useDyRouter();
  const { settings, content } = useSite();
  const stats = usePublicStats();
  const reduced = useReducedMotion();

  const eyebrow =
    content["home.hero.eyebrow"]?.visible && content["home.hero.eyebrow"]?.value
      ? content["home.hero.eyebrow"].value
      : "AI employees for real conversations";
  const titleLines =
    content["home.hero.title"]?.visible && content["home.hero.title"]?.value
      ? content["home.hero.title"].value.split("\n")
      : ["Hire intelligence that", "never puts a caller on hold."];
  const accentWord =
    content["home.hero.title.accent"]?.visible && content["home.hero.title.accent"]?.value
      ? content["home.hero.title.accent"].value
      : "never";
  const sub =
    content["home.hero.sub"]?.visible && content["home.hero.sub"]?.value
      ? content["home.hero.sub"].value
      : "AI employees that answer every call and chat, know your business, and hand off to humans when it matters. For companies and individuals alike: you bring nothing, we provide everything.";

  // Accent the matching word wherever it appears in the title.
  const accentLines = titleLines.map((l) => {
    const idx = accentWord.length > 0 ? l.toLowerCase().indexOf(accentWord.toLowerCase()) : -1;
    return { line: l, idx };
  });
  const accentLineIdx = accentLines.findIndex((a) => a.idx >= 0);
  const hasAccent = accentLineIdx >= 0;

  const scrollToPipeline = () => {
    document.getElementById("architecture")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-ink text-white grain-dy">
      {/* 3D signal field · ambient on mobile, full presence on desktop. Never fully hidden. */}
      <HeroScene3D
        className="pointer-events-none absolute -right-[130px] top-1/2 h-[380px] w-[380px] -translate-y-1/2 opacity-25 md:h-[460px] md:w-[460px] md:opacity-40 lg:-right-[150px] lg:h-[560px] lg:w-[560px] lg:opacity-80"
        fallbackClassName="pointer-events-none absolute -right-[130px] top-1/2 h-[380px] w-[380px] -translate-y-1/2 opacity-20 md:h-[460px] md:w-[460px] md:opacity-30 lg:-right-[150px] lg:h-[560px] lg:w-[560px] lg:opacity-50"
      />
      <div className="absolute inset-0 dy-grid-bg opacity-60" aria-hidden="true" />
      <div className="absolute inset-0 dy-radial-fade" aria-hidden="true" />

      <div className="container-dy relative">
        <div className="grid grid-cols-1 gap-8 pb-16 pt-14 md:pb-24 md:pt-28 lg:grid-cols-12 lg:gap-8">
          {/* Left: statement */}
          <div className="lg:col-span-7">
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.7, 0, 0.2, 1] }}
            >
              <span className="eyebrow-dy text-neutral-400">{eyebrow.toUpperCase()}</span>
            </motion.div>

            <motion.h1
              className="font-display-strong mt-5 text-[clamp(2.3rem,5.6vw,4.75rem)] leading-[1.02] tracking-[-0.045em] text-balance-dy md:mt-7"
              initial={reduced ? false : { opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.08, ease: [0.7, 0, 0.2, 1] }}
            >
              {hasAccent
                ? accentLines.map((a, i) => (
                    <span key={i}>
                      {i === accentLineIdx ? (
                        <>
                          {a.line.slice(0, a.idx)}
                          <span className="text-flare">{accentWord}</span>
                          {a.line.slice(a.idx + accentWord.length)}
                        </>
                      ) : (
                        a.line
                      )}
                      {i < accentLines.length - 1 && <br />}
                    </span>
                  ))
                : titleLines.map((l, i) => (
                  <span key={i}>
                    {l}
                    {i < titleLines.length - 1 && <br />}
                  </span>
                ))}
            </motion.h1>

            <motion.p
              className="mt-5 max-w-xl text-[17.5px] leading-[1.55] tracking-[-0.01em] text-neutral-300 text-pretty-dy md:mt-7 md:text-[18.5px] md:leading-[1.6]"
              initial={reduced ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.18, ease: [0.7, 0, 0.2, 1] }}
            >
              {sub}
            </motion.p>

            <motion.div
              className="mt-6 flex flex-wrap items-center gap-3 md:mt-9"
              initial={reduced ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.28, ease: [0.7, 0, 0.2, 1] }}
            >
              <Button
                onClick={() => navigate(ROUTES.signup)}
                className="btn-flare h-12 px-8 text-[14.5px]"
              >
                Start building free
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
              <Button
                onClick={scrollToPipeline}
                variant="outline"
                className="btn-glass h-12 px-7 text-[14.5px]"
              >
                <Play className="mr-2 h-3.5 w-3.5 text-flare" />
                See the pipeline
              </Button>
            </motion.div>

            <motion.div
              className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono-dy text-[10.5px] tracking-[0.16em] text-neutral-600 md:mt-10"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <span>NO FAKE NUMBERS</span>
              <span className="text-brand">/</span>
              <span>BARGE-IN NATIVE</span>
              <span className="text-brand">/</span>
              <span>KNOWLEDGE GROUNDED</span>
              <span className="text-brand">/</span>
              <span>CANCEL ANYTIME</span>
            </motion.div>
          </div>

          {/* Right: the 3D phone. Visible at every breakpoint · never hidden on mobile. */}
          <div className="relative lg:col-span-5">
            <PhoneHero
              stats={stats}
              className="relative mx-auto h-[420px] w-full max-w-[340px] sm:h-[500px] lg:h-[560px] lg:max-w-none pointer-events-none lg:pointer-events-auto"
            />
            {settings.flagShowStats && (
              <motion.p
                className="relative z-[1] mt-2 text-center font-mono-dy text-[10.5px] leading-relaxed tracking-[0.04em] text-neutral-600 lg:mt-3"
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.45 }}
              >
                {(content["home.stats.honest_note"]?.value ||
                  "These counters are live. They read from the database: zero until real work happens here.").toUpperCase()}
              </motion.p>
            )}
          </div>
        </div>
      </div>

      {/* Standards marquee */}
      <div className="hairline-t relative border-t border-white/8">
        <div className="overflow-hidden py-4">
          <div className="marquee-dy items-center gap-10 pr-10">
            {Array.from({ length: 2 }).map((_, dup) => (
              <div key={dup} className="flex items-center gap-10 pr-10">
                {[
                  "STREAMING SPEECH",
                  "LLM REASONING",
                  "EMOTION IN THE VOICE",
                  "BARGE-IN",
                  "HUMAN HANDOFF",
                  "KNOWLEDGE GROUNDED",
                  "FULL AUDIT TRAIL",
                  "WE PROVIDE EVERYTHING",
                ].map((s) => (
                  <span
                    key={`${dup}-${s}`}
                    className="flex items-center gap-3 font-mono-dy text-[11px] font-medium tracking-[0.2em] text-neutral-500"
                  >
                    <span className="h-1 w-1 rounded-full bg-brand" />
                    {s}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
