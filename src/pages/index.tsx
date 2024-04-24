import {Inter} from "next/font/google";
import {useSmartAccountContextHook} from "./context/SmartAccountContext";
import {usePrivy} from "@privy-io/react-auth";
const inter = Inter({subsets: ["latin"]});

export default function Home() {
  const {login} = usePrivy();
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
    >
      <button onClick={login}>Login</button>
    </main>
  );
}
