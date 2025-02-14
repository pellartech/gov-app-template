import { PUB_IPFS_ENDPOINT, PUB_IPFS_API_KEY, PUB_IPFS_GATEWAY_KEY } from "@/constants";
import { CID, IPFSHTTPClient } from "ipfs-http-client";
import { Hex, fromHex } from "viem";

export function fetchJsonFromIpfs(ipfsUri: string) {
  return fetchFromIPFS(ipfsUri).then((res) => res.json());
}

export function uploadToIPFS(client: IPFSHTTPClient, blob: Blob) {
  return client.add(blob).then(({ cid }: { cid: CID }) => {
    return "ipfs://" + cid.toString();
  });
}

export async function uploadToIpfsPinata(file: File) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const pinataMetadata = JSON.stringify({
      name: "File name",
    });
    formData.append("pinataMetadata", pinataMetadata);

    const pinataOptions = JSON.stringify({
      cidVersion: 1,
    });
    formData.append("pinataOptions", pinataOptions);

    const request = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PUB_IPFS_API_KEY}`,
      },
      body: formData,
    });
    const response = await request.json();
    console.log(response);
    return response.IpfsHash;
  } catch (error) {
    console.log(error);
  }
}

async function fetchFromIPFS(ipfsUri: string): Promise<any> {
  try {
    const url = `${PUB_IPFS_ENDPOINT}/ipfs/${ipfsUri}?pinataGatewayToken=${PUB_IPFS_GATEWAY_KEY}`;
    const request = await fetch(url);
    return request;
  } catch (error) {
    console.log(error);
  }
}

function resolvePath(uri: string) {
  const path = uri.includes("ipfs://") ? uri.substring(7) : uri;
  return path;
}
