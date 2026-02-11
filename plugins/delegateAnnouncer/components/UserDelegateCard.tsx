import { useEffect, useRef, useState } from "react";
import { If } from "@/components/if";
import Image from "next/image";
import { AlertInline, Button, Card, InputText, Link } from "@aragon/ods";
import { Address, formatUnits, isAddress } from "viem";
import { useEnsName, useEnsAvatar } from "wagmi";
import { normalize } from "viem/ens";
import { mainnet } from "wagmi/chains";
import {
  useChainId,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { iVotesAbi } from "../artifacts/iVotes.sol";
import { formatHexString } from "@/utils/evm";
import DOMPurify from "dompurify";
import {
  getTokenAddressByChainId,
  PUB_CHAIN,
  PUB_CHAIN_NAME,
  PUB_L2_CHAIN,
  PUB_L2_CHAIN_NAME,
  PUB_L2_CHAIN_OP,
  PUB_L2_CHAIN_NAME_OP,
} from "@/constants";
import { pegasus } from "@/utils/chains";
import { readableChainName } from "@/utils/chains";
import { useAlerts } from "@/context/Alerts";

const CHAIN_OPTIONS = [
  { name: readableChainName(PUB_CHAIN_NAME), chainId: PUB_CHAIN.id },
  { name: readableChainName(PUB_L2_CHAIN_NAME), chainId: PUB_L2_CHAIN.id },
  { name: readableChainName(PUB_L2_CHAIN_NAME_OP), chainId: PUB_L2_CHAIN_OP.id },
];

type SelfDelegationProfileCardProps = {
  address: Address;
  tokenAddress: Address;
  loading: boolean;
  message: string | undefined;
  delegates: Address;
};

export const SelfDelegationProfileCard = ({
  address,
  tokenAddress: _tokenAddressProp,
  message,
  loading,
  delegates,
}: SelfDelegationProfileCardProps) => {
  const [to, setTo] = useState<Address>();
  const [selectedChainId, setSelectedChainId] = useState<number>(PUB_CHAIN.id);

  const tokenAddress = getTokenAddressByChainId(selectedChainId);

  const result = useEnsName({
    chainId: mainnet.id,
    address,
    query: {
      enabled: !!address && address !== "0x",
    },
  });
  const avatarResult = useEnsAvatar({
    name: result.data ? normalize(result.data) : undefined,
    chainId: mainnet.id,
    gatewayUrls: ["https://cloudflare-ipfs.com"],
    query: {
      enabled: !!result.data,
    },
  });
  const { data: votingPower, refetch: refetchVotingPower } = useReadContract({
    abi: iVotesAbi,
    address: tokenAddress,
    functionName: "getVotes",
    args: [address],
    chainId: selectedChainId,
    query: {
      enabled: !!tokenAddress && tokenAddress !== "0x" && !!address && address !== "0x",
    },
  });
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: selectedChainId });
  const {
    writeContract: delegateWrite,
    data: delegateTxHash,
    status: delegateStatus,
    error: delegateError,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: delegateTxHash,
  });

  const { addAlert } = useAlerts();
  const lastTxHashRef = useRef<string | undefined>();
  const lastErrorMsgRef = useRef<string | null>(null);

  useEffect(() => {
    if (delegateError) {
      const msg = delegateError.message;
      if (lastErrorMsgRef.current !== msg) {
        lastErrorMsgRef.current = msg;
        addAlert(msg, { type: "error" });
      }
    } else {
      lastErrorMsgRef.current = null;
    }
  }, [delegateError?.message]);

  useEffect(() => {
    if (delegateTxHash && isConfirmed && delegateTxHash !== lastTxHashRef.current) {
      lastTxHashRef.current = delegateTxHash;
      addAlert("Delegation confirmed on chain.", {
        type: "success",
        description: "Your voting power has been delegated.",
        txHash: delegateTxHash,
      });
      refetchVotingPower();
    }
  }, [delegateTxHash, isConfirmed, refetchVotingPower]);

  const isDelegating = delegateStatus === "pending" || isConfirming;

  const delegateTo = async () => {
    if (!tokenAddress || tokenAddress === "0x" || !address || address === "0x" || !to || to === "0x") return;
    try {
      if (chainId !== selectedChainId && switchChainAsync) {
        await switchChainAsync({ chainId: selectedChainId });
      }
      const args = [to] as [Address];
      if (selectedChainId === pegasus.id && publicClient) {
        const fees = await publicClient.estimateFeesPerGas({ type: "legacy" });
        const gasPrice = fees?.gasPrice ?? 1n * 10n ** 9n;
        delegateWrite({
          abi: iVotesAbi,
          address: tokenAddress,
          functionName: "delegate",
          args,
          chainId: selectedChainId,
          type: "legacy",
          gasPrice,
        });
      } else {
        delegateWrite({
          abi: iVotesAbi,
          address: tokenAddress,
          functionName: "delegate",
          args,
          chainId: selectedChainId,
        });
      }
    } catch (e) {
      if (e instanceof Error) addAlert(e.message, { type: "error" });
    }
  };

  const handleTo = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTo(event?.target?.value as Address);
  };

  return (
    <Card className="flex flex-col gap-6 p-5">
      {/* Profile */}
      <div className="flex flex-row items-center gap-3">
        <Image
          src={avatarResult.data ?? "/profile.jpg"}
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 rounded-xl object-cover"
          alt="Profile"
        />
        <div className="flex min-w-0 flex-col justify-center">
          <Link className="truncate text-lg font-semibold text-primary-500">
            {result.data ?? formatHexString(address)}
          </Link>
          <p className="text-sm text-neutral-500">{votingPower ? formatUnits(votingPower, 18) : "0"} Voting Power</p>
        </div>
      </div>

      <If condition={message}>
        <div
          className="text-sm text-neutral-600"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message ?? "") }}
        />
      </If>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-medium block text-sm leading-normal text-neutral-700">Network</label>
          <select
            className="focus:ring-1 focus:ring-primary-500 h-10 w-full rounded-lg border border-neutral-300 bg-neutral-0 px-3 py-2 text-sm font-normal leading-normal text-neutral-800 outline-none transition-colors focus:border-primary-500"
            value={selectedChainId}
            onChange={(e) => setSelectedChainId(Number(e.target.value))}
          >
            {CHAIN_OPTIONS.map((opt) => (
              <option key={opt.chainId} value={opt.chainId}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-medium block text-sm leading-normal text-neutral-700">Delegatee address</label>
          <InputText
            placeholder="0x..."
            helpText="Enter the address to delegate your voting power to"
            variant={to && !isAddress(to) ? "critical" : "default"}
            value={to}
            onChange={handleTo}
          />
        </div>
        {to && !isAddress(to) && <AlertInline message="Please enter a valid Ethereum address" variant="critical" />}
      </div>

      <div className="flex flex-row gap-2">
        <Button
          className="mt-3"
          size="lg"
          variant="primary"
          disabled={!address || !to || !isAddress(to) || isDelegating}
          onClick={() => delegateTo()}
        >
          {delegateStatus === "pending" || isConfirming ? "Delegating..." : "Delegate"}
        </Button>
      </div>
    </Card>
  );
};
