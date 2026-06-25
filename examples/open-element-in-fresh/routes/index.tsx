/** @jsxImportSource preact */

import type { JSX } from "preact";
import { Head } from "fresh/runtime";
import PreactCounter from "../islands/PreactCounter.tsx";
import OpenElements from "../islands/OpenElements.tsx";

// Augment Preact's JSX types so TypeScript accepts openElement custom element
// tags (<open-button>, <open-card>) as valid JSX intrinsic elements.
declare module "preact" {
  namespace JSX {
    interface IntrinsicElements {
      "open-button": Omit<JSX.HTMLAttributes<HTMLElement>, "size"> & {
        variant?: string;
        /** open-button size: sm | md | lg (overrides HTML size) */
        size?: string;
        disabled?: boolean;
      };
      "open-card": JSX.HTMLAttributes<HTMLElement> & {
        variant?: string;
      };
    }
  }
}

export default function Home() {
  return (
    <>
      <Head>
        <title>openElement in Fresh — alpha.4 Interop Proof</title>
        <meta
          name="description"
          content="Demonstrates openElement custom elements running inside a Fresh app with Preact islands."
        />
      </Head>

      <main
        style={{
          maxWidth: "720px",
          margin: "2rem auto",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1>openElement + Fresh alpha.4</h1>
        <p>
          This page renders <code>&lt;open-button&gt;</code> and{" "}
          <code>&lt;open-card&gt;</code>{" "}
          as standard HTML custom elements. They are registered and hydrated by
          the <code>OpenElements</code> island which imports{" "}
          <code>@openelement/ui</code>.
        </p>

        {/* openElement custom elements rendered as standard HTML tags */}
        <h2>open-button</h2>
        <open-button variant="primary">Primary Button</open-button>
        <open-button>Default Button</open-button>
        <open-button variant="ghost" size="sm">Ghost Small</open-button>

        <h2>open-card</h2>
        <open-card>
          <h3 slot="header">Card with Slots</h3>
          <p>This card content is rendered in the default slot.</p>
          <p slot="footer">Footer slot content</p>
        </open-card>

        {/* Fresh Preact island — proves bilateral interop */}
        <h2>Preact Island Counter</h2>
        <p>
          The counter below is a Fresh <em>island</em>{" "}
          backed by a Preact functional component. It proves Preact islands work
          alongside openElement custom elements in the same page.
        </p>
        <PreactCounter />

        {/* openElement boot island — registers and hydrates custom elements */}
        <OpenElements />
      </main>
    </>
  );
}
