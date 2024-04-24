import "@/styles/globals.css";
import type {AppProps} from "next/app";
import Provider from "./Provider";
import {PrivyProvider} from "@privy-io/react-auth";
import {useRouter} from "next/router";
import {PrivyWagmiConnector} from "@privy-io/wagmi-connector";
import {sepolia} from "@wagmi/chains";
import {configureChains} from "wagmi";
import {publicProvider} from "wagmi/providers/public";
import {SmartAccountContextProvider} from "./context/SmartAccountContext";

export default function App({Component, pageProps}: AppProps) {
  const router = useRouter();
  const configureChainsConfig = configureChains([sepolia], [publicProvider()]);

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      onSuccess={() => router.push("/dashboard")}
      config={{
        // Customize Privy's appearance in your app
        appearance: {
          theme: "light",
          accentColor: "#676FFF",
        },

        embeddedWallets: {
          createOnLogin: "users-without-wallets",
          noPromptOnSignature: true,
        },
      }}
    >
      <PrivyWagmiConnector wagmiChainsConfig={configureChainsConfig}>
        <Provider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SmartAccountContextProvider>
            <Component {...pageProps} />
          </SmartAccountContextProvider>
        </Provider>
      </PrivyWagmiConnector>
    </PrivyProvider>
  );
}
