import { selectCurrentAddress } from 'src/redux/features/pocket';
import { useAppSelector } from 'src/redux/hooks';

import Message from './Message';
import useParticleDetails from '../../../../../particle/useParticleDetails';
import ContentIpfs from 'src/components/contentIpfs/contentIpfs';
import { Dots } from 'src/components';
import { SenseItem } from 'src/features/sense/redux/sense.redux';
import { formatSenseItemDataToUI } from '../../../utils/format';
import { getIpfsHash } from 'src/utils/ipfs/helpers';
import { useEffect, useState } from 'react';
import { PATTERN_IPFS_HASH } from 'src/constants/app';

type Props = {
  senseItem: SenseItem;
};

function MessageContainer({ senseItem, currentChatId }: Props) {
  const [textCid, setTextCid] = useState<string>();

  const address = useAppSelector(selectCurrentAddress);

  const {
    timestamp,
    transactionHash,
    amount,
    from,
    cid,
    text,
    fromLog,
    isAmountSendToMyAddress,
  } = formatSenseItemDataToUI(senseItem, address, currentChatId);

  const particleDetails = useParticleDetails(cid!, {
    skip: Boolean(text && !cid),
  });

  useEffect(() => {
    if (!text || text.match(PATTERN_IPFS_HASH)) {
      return;
    }

    (async () => {
      const cid = await getIpfsHash(text);
      setTextCid(cid);
    })();
  }, [text]);

  let content;

  if (cid) {
    const { data, loading } = particleDetails;

    if (loading) {
      content = (
        <span>
          resolving particle <Dots />
        </span>
      );
    } else if (data) {
      content = (
        <ContentIpfs
          details={data}
          cid={data.cid}
          content={data.content}
          search
        />
      );
    }
  } else if (text) {
    content = text;
  }

  return (
    <Message
      address={from}
      myMessage={address === from}
      fromLog={fromLog}
      from={from}
      transactionHash={transactionHash}
      date={timestamp}
      content={content}
      cid={cid || textCid}
      amountData={{
        amount,
        isAmountSendToMyAddress,
      }}
      status={senseItem.status}
    />
  );
}

export default MessageContainer;
