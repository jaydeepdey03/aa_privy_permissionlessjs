import {usePrivy} from "@privy-io/react-auth";
import {useSmartAccountContextHook} from "./context/SmartAccountContext";

export default function Dashbaord() {
  const {smartAccountClient, smartAccountAddress, smartAccountReady} =
    useSmartAccountContextHook();
  const {logout} = usePrivy();
  return (
    <div>
      <p>State: {smartAccountReady.toString()}</p>
      <p>{smartAccountAddress && smartAccountAddress}</p>
      {/* <pre>{smartAccountClient && smartAccountClient}</pre> */}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
