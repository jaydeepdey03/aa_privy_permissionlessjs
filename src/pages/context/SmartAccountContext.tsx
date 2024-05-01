import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
} from "viem";
import { useWalletClient } from "wagmi";
import { ConnectedWallet, useWallets } from "@privy-io/react-auth";
import { usePrivyWagmi } from "@privy-io/wagmi-connector";
import { createSmartAccountClient, walletClientToSmartAccountSigner } from "permissionless";
import { signerToSafeSmartAccount } from "permissionless/accounts";
import { sepolia } from "viem/chains";
import { 
  SEPOLIA_ENTRYPOINT_ADDRESS,
  SMART_ACCOUNT_FACTORY_ADDRESS,
} from "../constants/constants";
import {
  createPimlicoBundlerClient,
  createPimlicoPaymasterClient,
} from "permissionless/clients/pimlico";

interface SmartAccountInterface {
  eoa: ConnectedWallet | undefined;
  smartAccountClient: any;
  smartAccountAddress: `0x${string}` | undefined;
  smartAccountReady: boolean;
}

const SmartAccountContext = createContext<SmartAccountInterface>({
  eoa: undefined,
  smartAccountClient: undefined,
  smartAccountAddress: undefined,
  smartAccountReady: false,
});

export const SmartAccountContextProvider = ({ children }: { children: ReactNode; }) => {
  const { wallets } = useWallets();
  const { data: walletClient } = useWalletClient();

  const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === "privy");
  const { setActiveWallet } = usePrivyWagmi();

  useEffect(() => {
    setActiveWallet(embeddedWallet);
  }, [embeddedWallet]);

  const [eoa, setEoa] = useState<ConnectedWallet | undefined>();
  const [smartAccountClient, setSmartAccountClient] = useState<any>();
  const [smartAccountAddress, setSmartAccountAddress] = useState<`0x${string}` | undefined>();
  const [smartAccountReady, setSmartAccountReady] = useState(false);

  useEffect(() => {
    const createSmartWallet = async (eoa: ConnectedWallet) => {
      setEoa(eoa);

      if (!walletClient) return;

      const eip1193provider = await eoa.getEthereumProvider();
      const privyClient = createWalletClient({
        account: eoa.address as `0x${string}`,
        chain: sepolia,
        transport: custom(eip1193provider),
      });

      const signer = walletClientToSmartAccountSigner(privyClient);
      const publicClient = createPublicClient({
        transport: http("https://rpc.ankr.com/eth_sepolia"),
      });

      const safeAccount = await signerToSafeSmartAccount(publicClient, {
        entryPoint:SEPOLIA_ENTRYPOINT_ADDRESS,
        signer: signer,
        safeVersion: "1.4.1",
        address: "0x...",
      });

      const bundlerClient = createPimlicoBundlerClient({
        transport: http(`https://api.pimlico.io/v2/sepolia/rpc?apikey=${process.env.NEXT_PUBLIC_PIMILICO_API_KEY}`),
        entryPoint: SEPOLIA_ENTRYPOINT_ADDRESS,
      });

      const paymasterClient = createPimlicoPaymasterClient({
        transport: http(`https://api.pimlico.io/v2/sepolia/rpc?apikey=${process.env.NEXT_PUBLIC_PIMILICO_API_KEY}`),
        entryPoint: SEPOLIA_ENTRYPOINT_ADDRESS,
      });

      const smartAccountClient = createSmartAccountClient({
        account: safeAccount,
        entryPoint: SEPOLIA_ENTRYPOINT_ADDRESS,
        chain: sepolia,
        bundlerTransport: http(`https://api.pimlico.io/v2/sepolia/rpc?apikey=${process.env.NEXT_PUBLIC_PIMILICO_API_KEY}`),
        middleware: {
          gasPrice: async () => (await bundlerClient.getUserOperationGasPrice()).fast,
          sponsorUserOperation: paymasterClient.sponsorUserOperation,
        },
      });

      const smartAccountAddress = smartAccountClient.account?.address;

      setSmartAccountClient(smartAccountClient);
      setSmartAccountAddress(smartAccountAddress);
      setSmartAccountReady(true);
    };

    if (embeddedWallet) createSmartWallet(embeddedWallet);
  }, [embeddedWallet?.address, walletClient]);

  // Function to send a transaction using the smart account client
  const sendTransaction = async (to: string, value: string) => {
    if (!smartAccountClient) return; // Check if smart account client is available

    const txHash = await smartAccountClient.sendTransaction({
      to: to,
      value: value,
    });

    return txHash; // Return transaction hash
  };

  return (
    <SmartAccountContext.Provider
      value={{
        smartAccountReady: smartAccountReady,
        smartAccountClient: smartAccountClient,
        smartAccountAddress: smartAccountAddress,
        eoa: eoa,
        // sendTransaction: sendTransaction, // Include sendTransaction function in the context value
      }}
    >
      {children}
    </SmartAccountContext.Provider>
  );
};

export const useSmartAccountContextHook = () => {
  return useContext(SmartAccountContext);
};
