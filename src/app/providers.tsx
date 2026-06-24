"use client";

import { HeroUIProvider } from "@heroui/react";
import { SessionProvider, useSession } from "next-auth/react";
import { gsap } from "gsap";
import { TransitionRouter } from "next-transition-router";
import { useEffect, useRef } from "react";

interface ProvidersProps {
  children: React.ReactNode;
  session?: any; // Adjust type if you have a specific type for the session
}

export function Providers({ children, session }: ProvidersProps) {
  const firstLayer = useRef<HTMLDivElement | null>(null);



  return (
    <SessionProvider session={session}>
      <HeroUIProvider>
        <TransitionRouter
          auto={true}
          leave={(next, from, to) => {
            console.log({ from, to });
            const tl = gsap
              .timeline({
                onComplete: next,
              })
              .fromTo(
                firstLayer.current,
                {
                  alpha: 0

                },
                {
                  alpha: 1,
                  duration: 2,
                  ease: "circ.inOut",
                },
              )
              .fromTo(
                firstLayer.current,
                { y: "100%" },
                {
                  y: "0",
                  duration: 0,
                  delay: 0,
                  ease: "circ.inOut",
                },
              )
            return () => {
              tl.kill();
            };
          }}
          enter={(next) => {
            const tl = gsap
              .timeline()
              .fromTo(
                firstLayer.current,
                {
                  alpha: 1

                },
                {
                  alpha: 0,
                  duration: 3,
                  ease: "circ.inOut",
                },
              )
              .fromTo(
                firstLayer.current,
                { y: "100%" },
                {
                  y: "0",
                  duration: 0,
                  delay: 5,
                  ease: "circ.inOut",
                },
              )
              .call(next, undefined, "<50%");

            return () => {
              tl.kill();
            };
          }}
        >
          {children}

          <div
            ref={firstLayer}
            className="fixed inset-0 z-50 translate-y-full"
            style={{
              backgroundImage: "url('/tardis-transition.gif')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              pointerEvents: "none",
            }}
          >
          </div>
        </TransitionRouter>
      </HeroUIProvider>
    </SessionProvider>
  );
}
