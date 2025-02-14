import { PUB_BLOCKSCOUT_URL } from "@/constants";

export async function fetchBlockscoutLogs({
    fromBlock,
    toBlock,
    address,
    topics,
    topicOpr = "and",
  }: {
    fromBlock: string;
    toBlock: string;
    address: string;
    topics?: (string | null)[];
    topicOpr?: string;
  }): Promise<any[]> {
    const url = new URL("/api", PUB_BLOCKSCOUT_URL);
    url.searchParams.set("module", "logs");
    url.searchParams.set("action", "getLogs");
    url.searchParams.set("fromBlock", fromBlock);
    url.searchParams.set("toBlock", toBlock);
    url.searchParams.set("address", address);
  
    if (topics && topics.length > 0) {
      topics.forEach((topic, index) => {
        if (topic !== null) {
          url.searchParams.set(`topic${index}`, topic);
        }
      });
    }
    url.searchParams.set("topic0_1_opr", topicOpr);
  
    const response = await fetch(url.toString());
    const data = await response.json();
    if (data.status !== "1") {
      throw new Error(`Blockscout API error: ${data.message || data.result}`);
    }
    return data.result;
  }
  