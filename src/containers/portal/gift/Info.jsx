import React from 'react';
import { InfoCard } from '../components';
import { STEP_INFO } from './utils';
import { PATTERN_CYBER } from '../../../utils/config';
import { trimString } from '../../../utils/utils';

const {
  STATE_INIT_NULL,
  STATE_INIT_PROVE,
  STATE_INIT_CLAIM,
  STATE_INIT_RELEASE,
  STATE_PROVE,
  STATE_CONNECT,
  STATE_SIGN_MM,
  STATE_SIGN_KEPLR,
  STATE_GIFT_NULL,
  STATE_GIFT_NULL_ALL,
  STATE_GIFT_CLAIME,
  STATE_CLAIME_ALL,
  STATE_RELEASE,
} = STEP_INFO;

const infoTextFnc = (step, selectedAddress) => {
  let address = '';
  if (selectedAddress && !selectedAddress.match(PATTERN_CYBER)) {
    address = trimString(selectedAddress, 10, 3);
  } else {
    address = '';
  }
  switch (step) {
    case STATE_INIT_NULL:
      return (
        <span>
          Check gift & basic information. <br />
          Hurry up! <br />
          Get citizenship to be able to claim
        </span>
      );

    case STATE_INIT_PROVE:
      return (
        <span>
          Check gift & basic information. <br />
          Hurry up! <br />
          Prove address to claim the gift
        </span>
      );

    case STATE_INIT_CLAIM:
      return (
        <span>
          You have unclaimed gifts - <br />
          go to claim
        </span>
      );

    case STATE_INIT_RELEASE:
      return (
        <span>
          You claimed all gifts. <br />
          Go to release <br />
          or prove another address.
        </span>
      );

    case STATE_PROVE:
      return (
        <span>
          Prove ethereum, cosmos, osmosis, <br /> terra or bostrom signatures by{' '}
          <br />
          selecting signer to check the gift
        </span>
      );

    case STATE_CONNECT:
      return <span>Select signer</span>;

    case STATE_SIGN_MM:
      return <span>Sign message in metamask</span>;

    case STATE_SIGN_KEPLR:
      return <span>sign message in keplr</span>;

    case STATE_GIFT_NULL:
      return (
        <span>
          Address{' '}
          {address !== '' && (
            <span style={{ color: '#38d6ae' }}>{address}</span>
          )}{' '}
          has no gift <br /> 
          Prove another to try your luck
        </span>
      );

    case STATE_GIFT_NULL_ALL:
      return (
        <span>
          You have nothing to claim. Prove another address with the gift.
        </span>
      );

    case STATE_GIFT_CLAIME:
      return (
        <span>
          You have unclaimed gifts. <br />
          Claim now, br // or prove another address
        </span>
      );

    case STATE_CLAIME_ALL:
      return (
        <span>
          Chose bostrom address <br />
          to claim all gifts, <br />
          or claim one by one
        </span>
      );

    case STATE_RELEASE:
      return (
        <span>
          You claimed all gifts. <br />
          Go to release <br />
          or prove another address.
        </span>
      );

    default:
      return null;
  }
};

function Info({ stepCurrent, selectedAddress }) {
  try {
    return (
      <InfoCard>
        <div style={{ textAlign: 'center' }}>
          {infoTextFnc(stepCurrent, selectedAddress)}
        </div>
      </InfoCard>
    );
  } catch (error) {
    console.log('error', error);
    return null;
  }
}

export default Info;
