import {usePrivy} from "@privy-io/react-auth";
import {useSmartAccountContextHook} from "./context/SmartAccountContext";
import {useRouter} from "next/router";
import {useEffect} from "react";

export default function Dashbaord() {
  const {smartAccountClient, smartAccountAddress, smartAccountReady} =
    useSmartAccountContextHook();
  const {logout, user} = usePrivy();
  const router = useRouter();
  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user]);
  return (
    <div>
      <p>State: {smartAccountReady.toString()}</p>
      <p>{smartAccountAddress && smartAccountAddress}</p>
      {/* <pre>{smartAccountClient && smartAccountClient}</pre> */}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
