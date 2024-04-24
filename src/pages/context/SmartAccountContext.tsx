import {createContext, ReactNode, useContext, useState} from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  createClient,
} from "viem";
import {ConnectedWallet, useWallets} from "@privy-io/react-auth";
import {useEffect} from "react";
import {
  createSmartAccountClient,
  ENTRYPOINT_ADDRESS_V06,
  walletClientToSmartAccountSigner,
} from "permissionless";
import {signerToSimpleSmartAccount} from "permissionless/accounts";
import {sepolia} from "viem/chains";
import {
  SEPOLIA_ENTRYPOINT_ADDRESS,
  SMART_ACCOUNT_FACTORY_ADDRESS,
} from "../constants/constants";
import {
  createPimlicoBundlerClient,
  createPimlicoPaymasterClient,
} from "permissionless/clients/pimlico";

interface SmartAccountInterface {
  /** Privy embedded wallet, used as a signer for the smart account */
  eoa: ConnectedWallet | undefined;
  /** Smart account client to send signature/transaction requests to the smart account */
  smartAccountClient: any;
  /** Smart account address */
  smartAccountAddress: `0x${string}` | undefined;
  /** Boolean to indicate whether the smart account state has initialized */
  smartAccountReady: boolean;
}

const SmartAccountContext = createContext<SmartAccountInterface>({
  eoa: undefined,
  smartAccountClient: undefined,
  smartAccountAddress: undefined,
  smartAccountReady: false,
});

export const SmartAccountContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const {wallets} = useWallets();
  // Find the embedded wallet by finding the entry in the list with a `walletClientType` of 'privy'
  const embeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy"
  );

  // States to store the smart account and its status
  const [eoa, setEoa] = useState<ConnectedWallet | undefined>();
  const [smartAccountClient, setSmartAccountClient] = useState<any>();
  const [smartAccountAddress, setSmartAccountAddress] = useState<
    `0x${string}` | undefined
  >();
  const [smartAccountReady, setSmartAccountReady] = useState(false);

  useEffect(() => {
    // Creates a smart account given a Privy `ConnectedWallet` object representing
    // the  user's EOA.
    const createSmartWallet = async (eoa: ConnectedWallet) => {
      setEoa(eoa);
      // Get an EIP1193 provider and viem WalletClient for the EOA
      const eip1193provider = await eoa.getEthereumProvider();

      const privyClient = createWalletClient({
        account: eoa.address as `0x${string}`,
        chain: sepolia,
        transport: custom(eip1193provider),
      });

      const customSigner = walletClientToSmartAccountSigner(privyClient);

      const publicClient = createPublicClient({
        chain: sepolia, // Replace this with the chain of your app
        transport: http(),
      });

      const simpleSmartAccountClient = await signerToSimpleSmartAccount(
        publicClient,
        {
          entryPoint: SEPOLIA_ENTRYPOINT_ADDRESS,
          signer: customSigner,
          factoryAddress: SMART_ACCOUNT_FACTORY_ADDRESS,
        }
      );

      const bundlerClient = createPimlicoBundlerClient({
        transport: http(
          `https://api.pimlico.io/v2/sepolia/rpc?apikey=${process.env.NEXT_PUBLIC_PIMILICO_API_KEY}`
        ),
        entryPoint: ENTRYPOINT_ADDRESS_V06,
      });

      const paymasterClient = createPimlicoPaymasterClient({
        transport: http(
          `https://api.pimlico.io/v2/sepolia/rpc?apikey=${process.env.NEXT_PUBLIC_PIMILICO_API_KEY}`
        ),
        entryPoint: ENTRYPOINT_ADDRESS_V06,
      });

      const smartAccountClient = createSmartAccountClient({
        account: simpleSmartAccountClient,
        entryPoint: SEPOLIA_ENTRYPOINT_ADDRESS,
        chain: sepolia, // Replace this with the chain for your app
        bundlerTransport: http(
          `https://api.pimlico.io/v2/sepolia/rpc?apikey=${process.env.NEXT_PUBLIC_PIMILICO_API_KEY}`
        ),
        middleware: {
          gasPrice: async () =>
            (await bundlerClient.getUserOperationGasPrice()).fast, // use pimlico bundler to get gas prices
          sponsorUserOperation: paymasterClient.sponsorUserOperation, // optional
        },
      });

      const smartAccountAddress = smartAccountClient.account?.address;

      setSmartAccountClient(smartAccountClient);
      setSmartAccountAddress(smartAccountAddress);
      setSmartAccountReady(true);
    };

    if (embeddedWallet) createSmartWallet(embeddedWallet);
  }, [embeddedWallet?.address]);

  const buildUserOperation = async () => {};
  return (
    <SmartAccountContext.Provider
      value={{
        smartAccountReady: smartAccountReady,
        smartAccountClient: smartAccountClient,
        smartAccountAddress: smartAccountAddress,
        eoa: eoa,
      }}
    >
      {children}
    </SmartAccountContext.Provider>
  );
};

export const useSmartAccountContextHook = () => {
  return useContext(SmartAccountContext);
};
