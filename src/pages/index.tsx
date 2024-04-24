import {Inter} from "next/font/google";
import {useSmartAccountContextHook} from "./context/SmartAccountContext";
import {usePrivy} from "@privy-io/react-auth";
import {useEffect} from "react";
import {useRouter} from "next/router";
const inter = Inter({subsets: ["latin"]});

export default function Home() {
  const {login, user} = usePrivy();
  const router = useRouter();
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user]);
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
    >
      <button onClick={login}>Login</button>
    </main>
  );
}
