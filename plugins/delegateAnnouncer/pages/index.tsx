import { useReadContract } from "wagmi";
import { useAccount } from "wagmi";
import { parseAbi, Address } from "viem";
import { ReactNode, useMemo, useState } from "react";
import { If } from "@/components/if";
import { SelfDelegationProfileCard } from "../components/UserDelegateCard";
import { getTokenAddressByChainId, PUB_CHAIN, PUB_DELEGATION_CONTRACT_ADDRESS } from "@/constants";

export default function DelegateAnnouncements() {
  const account = useAccount();
  const [selectedChainId, setSelectedChainId] = useState<number>(PUB_CHAIN.id);

  const tokenAddress = useMemo(() => getTokenAddressByChainId(selectedChainId), [selectedChainId]);

  const { data: delegates } = useReadContract({
    abi: iVotesAbi,
    address: tokenAddress,
    functionName: "delegates",
    args: account.address ? [account.address as Address] : undefined,
    chainId: selectedChainId,
    query: {
      enabled: !!account.address && !!tokenAddress && tokenAddress !== "0x",
    },
  });

  return (
    <MainSection>
      <SectionView>
        <If condition={account?.address}>
          <div className="w-full">
            <h2 className="pb-3 text-xl font-semibold text-neutral-700">Your profile</h2>
            <SelfDelegationProfileCard
              address={account.address!}
              delegates={delegates as Address}
              selectedChainId={selectedChainId}
              setSelectedChainId={setSelectedChainId}
            />
          </div>
        </If>

        {/* <div className="w-full">
          <h2 className="mb-4 text-3xl font-semibold text-neutral-700">Delegates</h2>
          <If condition={delegateAnnouncements.length}>
            <Then>
              <div className="mb-14 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {delegateAnnouncements.map((announcement) => (
                  <DelegateCard
                    key={announcement.logIndex}
                    delegates={(delegates as Address) || (account.address as Address) || ("0x" as Address)}
                    delegate={announcement.delegate}
                    message={announcement.message}
                    tokenAddress={PUB_TOKEN_ADDRESS}
                  />
                ))}
              </div>
            </Then>
            <ElseIf condition={delegateAnnouncementsIsLoading}>
              <div className="my-3">
                <PleaseWaitSpinner />
              </div>
            </ElseIf>
            <Else>
              <p className="my-3 text-neutral-600">There are no delegate announcements on the DAO</p>
            </Else>
          </If>
        </div> */}
      </SectionView>
    </MainSection>
  );
}

function MainSection({ children }: { children: ReactNode }) {
  return <main className="w-full p-4 md:px-6 md:pb-20 xl:pt-10">{children}</main>;
}

function SectionView({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex w-full max-w-[1024px] flex-col items-center gap-y-6 md:px-6">{children}</div>;
}

const iVotesAbi = parseAbi([
  "function getVotes(address owner) view returns (uint256)",
  "function delegate(address delegatee) external",
  "function delegates(address account) public view returns (address)",
]);
