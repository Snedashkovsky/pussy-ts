/* eslint-disable import/no-unused-modules */
import { AddResult, IPFSPath } from 'kubo-rpc-client/types';

import { ImportCandidate } from 'ipfs-core-types/src/utils';
import { Option } from 'src/types';
import {
  getIpfsUserGatewanAndNodeType,
  IPFSContentMaybe,
  IPFSContentMeta,
  CallBackFuncStatus,
  IpfsContentSource,
  AppIPFS,
} from './ipfs.d';

import {
  toReadableStreamWithMime,
  getMimeFromUint8Array,
  toAsyncIterableWithMime,
} from './stream-utils';

import { CYBER } from '../config';

// import { addDataChunksToIpfsCluster, pinToIpfsCluster } from './cluster-utils';
import { getIpfsContentFromDb } from './db-utils';
import { addDataChunksToIpfsCluster } from './cluster-utils';

// Get IPFS node from local storage
// TODO: refactor
const getIpfsUserGatewanAndNodeType = (): getIpfsUserGatewanAndNodeType => {
  const LS_IPFS_STATE = localStorage.getItem('ipfsState');

  if (LS_IPFS_STATE !== null) {
    const lsTypeIpfsData = JSON.parse(LS_IPFS_STATE);
    if (lsTypeIpfsData?.userGateway) {
      const { userGateway, ipfsNodeType } = lsTypeIpfsData;
      return { userGateway, ipfsNodeType };
    }
  }

  return { ipfsNodeType: undefined, userGateway: undefined };
};

// Get data by CID from local storage
const loadIPFSContentFromDb = async (
  cid: IPFSPath
): Promise<IPFSContentMaybe> => {
  // TODO: use cursor
  const data = await getIpfsContentFromDb(cid.toString());
  if (data && data.length) {
    // TODO: use cursor
    const mime = await getMimeFromUint8Array(data);

    const meta: IPFSContentMeta = {
      type: 'file', // dir support ?
      size: data.length,
      mime,
    };
    return { result: data, cid, meta, source: 'db' };
  }

  return undefined;
};

const emptyMeta: IPFSContentMeta = {
  type: 'file',
  size: -1,
  local: undefined,
};

const fetchIPFSContentMeta = async (
  node: AppIPFS | undefined | null,
  cid: IPFSPath,
  signal?: AbortSignal
): Promise<IPFSContentMeta> => {
  if (node) {
    const path = `/ipfs/${cid}`;

    const { type, size, local, blocks } = await node.files.stat(path, {
      signal,
    });
    return {
      type,
      size: size || -1,
      local,
      blocks,
    };
  }
  return emptyMeta;
};

const fetchIPFSContentFromNode = async (
  node: AppIPFS | undefined | null,
  cid: IPFSPath,
  controller?: AbortController
): Promise<IPFSContentMaybe> => {
  const controllerLegacy = controller || new AbortController();
  const { signal } = controllerLegacy;
  let timer: NodeJS.Timeout | undefined;

  if (!node) {
    console.log('--------fetchIPFSContentFromNode NO NODE INTIALIZED--------');
    return undefined;
  }

  if (!controller) {
    timer = setTimeout(() => {
      controllerLegacy.abort();
    }, 1000 * 60 * 1);
  } // 1 min

  // TODO: cover ipns case
  const path = `/ipfs/${cid}`;

  try {
    // const stat = await node.files.stat(path, { signal });
    const meta = await fetchIPFSContentMeta(node, cid, signal);

    timer && clearTimeout(timer);

    switch (meta.type) {
      case 'directory': {
        // TODO: return directory structure
        return { cid, availableDownload: true, source: 'node', meta };
      }
      default: {
        // if (!meta.size || meta.size < FILE_SIZE_DOWNLOAD) {
        // const flushResults = (chunks, mime) =>
        //   addDataChunksToIpfsCluster(cid, chunks, mime);

        const { mime, result: stream } = await toAsyncIterableWithMime(
          node.cat(path, { signal })
          // flushResults
        );

        // TODO: add to db flag that content is pinned TO local node

        node.pin.add(cid);

        return { result: stream, cid, meta: { ...meta, mime }, source: 'node' };
        // }
      }
    }
  } catch (error) {
    console.log('error fetch stat', error);
    return { cid, availableDownload: true, source: 'node', meta: emptyMeta };
  }
};

const fetchIPFSContentFromGateway = async (
  node: AppIPFS | undefined | null,
  cid: string,
  controller?: AbortController
): Promise<IPFSContentMaybe> => {
  // TODO: Should we use Cyber Gateway?
  // const { userGateway } = getIpfsUserGatewanAndNodeType();

  // fetch META only from external node(toooo slow), TODO: fetch meta from cybernode
  const isExternalNode = node?.nodeType === 'external';
  const meta = isExternalNode
    ? await fetchIPFSContentMeta(node, cid, controller?.signal)
    : emptyMeta;

  const contentUrl = `${CYBER.CYBER_GATEWAY}/ipfs/${cid}`;
  const response = await fetch(contentUrl, {
    method: 'GET',
    signal: controller?.signal,
  });

  if (response && response.body) {
    // fetch doesn't provide any headers in our case :(

    // const contentLength = parseInt(
    //   response.headers['content-length'] || '-1',
    //   10
    // );
    // const contentType = response.headers['content-type'];

    // Extract meta if ipfs prob/node not started yet
    // if (!meta.mime) {
    //   meta = { ...meta, mime: contentType };
    // }

    // TODO: fix
    const flushResults = (chunks, mime) => null;
    // !isExternalNode && addIpfsContentToDb(cid, chunksToBlob(chunks, mime));

    const { mime, result } = await toReadableStreamWithMime(
      response.body,
      flushResults
    );

    return {
      cid,
      meta: { ...meta, mime },
      result,
      source: 'gateway',
      contentUrl,
    };
  }

  return undefined;
};

type fetchContentOptions = {
  controller?: AbortController;
  node?: AppIPFS;
};

async function fetchIpfsContent<T>(
  cid: string,
  source: IpfsContentSource,
  options: fetchContentOptions
): Promise<T | undefined> {
  const { node, controller } = options;
  try {
    switch (source) {
      case 'db':
        return loadIPFSContentFromDb(cid) as T;
      case 'node':
        return fetchIPFSContentFromNode(node, cid, controller) as T;
      case 'gateway':
        return fetchIPFSContentFromGateway(node, cid, controller) as T;
      default:
        return undefined;
    }
  } catch (e) {
    console.log('----fetchIpfsContent error', e);
    return undefined;
  }
}

const getIPFSContent = async (
  node: AppIPFS,
  cid: string,
  controller?: AbortController,
  callBackFuncStatus?: CallBackFuncStatus
): Promise<IPFSContentMaybe> => {
  const dataRsponseDb = await loadIPFSContentFromDb(cid);
  if (dataRsponseDb !== undefined) {
    return dataRsponseDb;
  }

  if (node) {
    callBackFuncStatus && callBackFuncStatus('trying to get with a node');
    // console.log('----Fetch from node', cid);
    const ipfsContent = await fetchIPFSContentFromNode(node, cid, controller);

    return ipfsContent;
  }

  callBackFuncStatus && callBackFuncStatus('trying to get with a gatway');
  // console.log('----Fetch from gateway', cid);
  const respnseGateway = await fetchIPFSContentFromGateway(
    node,
    cid,
    controller
  );

  return respnseGateway;
};

const catIPFSContentFromNode = (
  node: AppIPFS,
  cid: IPFSPath,
  offset: number,
  controller?: AbortController
): AsyncIterable<Uint8Array> | undefined => {
  if (!node) {
    console.log(
      '--------fetchIPFSContentFromNode NO NODE INTIALIZED TODO: cover case--------'
    );
    return undefined;
  }

  // TODO: cover ipns case
  const path = `/ipfs/${cid}`;

  return node.cat(path, { offset, signal: controller?.signal });
};

// const nodeContentFindProvs = async (
//   node: AppIPFS,
//   cid: IPFSPath,
//   offset: number,
//   controller?: AbortController
// ): AsyncIterable<number> | undefined => {
//   if (!node) {
//     console.log(
//       '--------fetchIPFSContentFromNode NO NODE INTIALIZED TODO: cover case--------'
//     );
//     return undefined;
//   }

//   // TODO: cover ipns case
//   const path = `/ipfs/${cid}`;

//   const providers = node.dht.findProvs(path, {
//     signal: controller?.signal,
//   });

//   let count = 0;
//   for await (const provider of providers) {
//     //  console.log(provider.id.toString())
//     //  id: PeerId
//     // multiaddrs: Multiaddr[]
//     // protocols: string[]
//     count++;
//   }

//   return count;
// };

const addContenToIpfs = async (
  node: AppIPFS,
  content: ImportCandidate
): Promise<Option<string>> => {
  let cid: AddResult;
  let arrayBuffer: Buffer | ArrayBuffer | undefined;

  if (node) {
    if (typeof content === 'string') {
      cid = await node.add(Buffer.from(content), { pin: true });
      arrayBuffer = Buffer.from(content);
    } else {
      cid = await node.add(content, { pin: true });
      if (content instanceof File) {
        arrayBuffer = await content.arrayBuffer();
      }
    }

    if (arrayBuffer) {
      const raw = new Uint8Array(arrayBuffer);
      const result = await addDataChunksToIpfsCluster(
        cid.cid,
        raw,
        node.nodeType === 'embedded'
      );

      console.log('result', result);
    }
    return cid.path;
  }
  return undefined;
};

export {
  getIPFSContent,
  getIpfsUserGatewanAndNodeType,
  catIPFSContentFromNode,
  fetchIpfsContent,
  addContenToIpfs,
};
