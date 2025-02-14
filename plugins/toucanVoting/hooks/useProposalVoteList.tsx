import { useState, useEffect, useMemo } from "react";
import { getAbiItem } from "viem";
import { TokenVotingAbi } from "@/plugins/toucanVoting/artifacts/TokenVoting.sol";
import {
  Proposal,
  VoteCastEvent,
  VoteCastRelayEvent,
  VoteCastRelayResponse,
  VoteCastResponse,
} from "@/plugins/toucanVoting/utils/types";
import { usePublicClient } from "wagmi";
import {
  PUB_CHAIN,
  PUB_L2_CHAIN,
  PUB_L2_START_BLOCK,
  PUB_TOUCAN_RECEIVER_ADDRESS,
  PUB_TOUCAN_VOTING_PLUGIN_ADDRESS,
  PUB_TOUCAN_VOTING_PLUGIN_L2_ADDRESS,
} from "@/constants";
import { ToucanRelayAbi } from "../artifacts/ToucanRelay.sol";
import { useProposalRef } from "./useProposalRef";
import { removeDuplicates } from "../utils/array";
import { id, Interface } from "ethers"
import { fetchBlockscoutLogs } from "../utils/blockscout";

const L1VotingEvent = getAbiItem({ abi: TokenVotingAbi, name: "VoteCast" });

export function useProposalVoteList(proposalId: string, proposal: Proposal | null) {
  const publicClient = usePublicClient({
    chainId: PUB_CHAIN.id,
  });
  const [proposalLogs, setLogs] = useState<VoteCastEvent[]>([]);
  // const proposalBlocks = useGetProposalBlocksTimestamp(proposalId, PUB_CHAIN.id);

  async function getLogs() {
    if (!proposal?.parameters?.snapshotBlock) return;
    else if (!publicClient) return;

    const logs: VoteCastResponse[] = (await publicClient.getLogs({
      address: PUB_TOUCAN_VOTING_PLUGIN_ADDRESS,
      event: L1VotingEvent as any,
      args: {
        proposalId,
      } as any,
      // TODO: how can we improve this in a performant way
      fromBlock: BigInt(proposal.parameters.snapshotBlock),
      toBlock: "latest",
    })) as any;

    const newLogs = logs.flatMap((log) => log.args);
    if (newLogs.length > proposalLogs.length) setLogs(newLogs);
  }

  useEffect(() => {
    getLogs();
  }, [proposalId, proposal?.parameters?.snapshotBlock]);

  return proposalLogs;
}


const L2VotingEventInterface = new Interface(ToucanRelayAbi);
export function useRelayVotesList(proposalId: string, proposal: Proposal | null) {
  const { proposalRef } = useProposalRef(Number(proposalId));
  const publicClient = usePublicClient({ chainId: PUB_L2_CHAIN.id });
  const [proposalLogs, setLogs] = useState<VoteCastRelayEvent[]>([]);

  async function getLogs() {
    if (!proposal?.parameters?.snapshotBlock) return;
    if (!publicClient) return;

    try {
      const fromBlock = PUB_L2_START_BLOCK.toString();
      const toBlock = "latest";
      const address = PUB_TOUCAN_VOTING_PLUGIN_L2_ADDRESS;
      const eventSignatureHash = id("VoteCast(uint32,uint256,address,(uint256,uint256,uint256))");
      const topics = [eventSignatureHash, String(proposalRef)];

      const rawLogs = await fetchBlockscoutLogs({
        fromBlock,
        toBlock,
        address,
        topics,
        topicOpr: "and",
      });

      const parsedLogs = rawLogs
        .map((log: any) => {
          try {
            return L2VotingEventInterface.parseLog({
              data: log.data,
              topics: log.topics,
            });
          } catch (error) {
            console.error("Error parsing log:", error, log);
            return null;
          }
        })
        .filter((log: any) => log !== null);

      const newLogs = parsedLogs.map((log: any) => log.args).filter((log: any) => log.proposalRef === proposalRef);
      const lastLogForEachAddress = [...newLogs]
        .reverse()
        .filter((log, index, self) => self.findIndex((l) => l.voter === log.voter) === index);

      if (lastLogForEachAddress.length > proposalLogs.length) {
        setLogs(lastLogForEachAddress as VoteCastRelayEvent[]);
      }
    } catch (error) {
      console.error("Error fetching logs from Blockscout:", error);
    }
  }

  useEffect(() => {
    getLogs();
  }, [proposalId, proposal?.parameters?.snapshotBlock, proposalRef]);

  return proposalLogs;
}

// performance wise, this is O(n^2) and should be optimized
// so we disable it as the number of votes grows super large
// and we memoize the result to be safe
export function useCombinedVotesList(proposalId: string, proposal: Proposal | null) {
  const votes = useProposalVoteList(proposalId, proposal);
  const l2Votes = useRelayVotesList(proposalId, proposal);

  return useMemo(() => {
    // remove the receiver as it's a proxy
    const votesNoReceiver = votes.filter((vote) => vote.voter !== PUB_TOUCAN_RECEIVER_ADDRESS);

    // filter the L1 votes
    const l1Filtered = votesNoReceiver.length <= 1000 ? removeDuplicates(votesNoReceiver, "voter") : votesNoReceiver;

    return l1Filtered;
  }, [votes, l2Votes, proposalId, proposal]);
}
