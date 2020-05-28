import React, { Component } from 'react';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import { Link } from 'react-router-dom';
import { Pane, Text, ActionBar, Button } from '@cybercongress/gravity';
import { connect } from 'react-redux';
import { CosmosDelegateTool } from '../../utils/ledger';
import {
  ConnectLadger,
  JsonTransaction,
  TransactionSubmitted,
  Confirmed,
  StartStageSearchActionBar,
  Cyberlink,
  TransactionError,
  ActionBarContentText,
  CheckAddressInfo,
} from '../../components';

import {
  getIpfsHash,
  getPin,
  statusNode,
  getAccountBandwidth,
  getCurrentBandwidthPrice,
} from '../../utils/search/utils';

import { LEDGER, CYBER, PATTERN_IPFS_HASH } from '../../utils/config';
import { trimString } from '../../utils/utils';

const {
  MEMO,
  HDPATH,
  LEDGER_OK,
  LEDGER_NOAPP,
  STAGE_INIT,
  STAGE_LEDGER_INIT,
  STAGE_READY,
  STAGE_WAIT,
  STAGE_SUBMITTED,
  STAGE_CONFIRMING,
  STAGE_CONFIRMED,
  STAGE_ERROR,
  LEDGER_VERSION_REQ,
} = LEDGER;

const CREATE_LINK = 10;
const ADD_ADDRESS = 11;
const LEDGER_TX_ACOUNT_INFO = 12;

class ActionBarContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stage: STAGE_INIT,
      init: false,
      ledger: null,
      address: null,
      addressLocalStor: null,
      returnCode: null,
      addressInfo: null,
      ledgerVersion: [0, 0, 0],
      time: 0,
      bandwidth: {
        remained: 0,
        max_value: 0,
      },
      linkPrice: 0,
      contentHash: '',
      txMsg: null,
      txContext: null,
      txBody: null,
      txHeight: null,
      txHash: null,
      error: null,
      errorMessage: null,
      file: null,
      connectLedger: null,
      fromCid: null,
      toCid: null,
    };
    this.timeOut = null;
    this.inputOpenFileRef = React.createRef();
  }

  async componentDidMount() {
    console.warn('Looking for Ledger Nano');
    await this.checkAddressLocalStorage();
  }

  componentDidUpdate() {
    const { stage, address, addressInfo, fromCid, toCid } = this.state;
    if (stage === STAGE_LEDGER_INIT || stage === LEDGER_TX_ACOUNT_INFO) {
      if (
        address !== null &&
        addressInfo !== null &&
        toCid !== null &&
        fromCid !== null
      ) {
        this.stageReady();
      }
    }
  }

  getLedgerAddress = async () => {
    const { stage } = this.state;

    this.transport = await TransportWebUSB.create(120 * 1000);
    this.ledger = new CosmosDelegateTool(this.transport);

    const connectLedger = await this.ledger.connect();
    console.log(connectLedger, stage);
    if (connectLedger.return_code === LEDGER_OK) {
      this.setState({
        connectLedger: true,
      });
      if (stage === STAGE_LEDGER_INIT) {
        const address = await this.ledger.retrieveAddressCyber(HDPATH);
        console.log('address', address);
        this.setState({
          address,
        });
        this.getAddressInfo();
        this.calculationIpfsFrom();
        this.calculationIpfsTo();
      }
    } else {
      this.setState({
        connectLedger: false,
      });
    }
  };

  getAddAddress = async () => {
    try {
      const accounts = {};

      const addressLedgerCyber = await this.ledger.retrieveAddressCyber(HDPATH);
      const addressLedgerCosmos = await this.ledger.retrieveAddress(HDPATH);

      accounts.cyber = addressLedgerCyber;
      accounts.cosmos = addressLedgerCosmos;

      localStorage.setItem('ledger', JSON.stringify(addressLedgerCyber));
      localStorage.setItem('pocket', JSON.stringify(accounts));

      this.setState({
        address: addressLedgerCyber,
        stage: STAGE_INIT,
      });
      this.checkAddressLocalStorage();
    } catch (error) {
      const { message, statusCode } = error;
      if (message !== "Cannot read property 'length' of undefined") {
        // this just means we haven't found the device yet...
        // eslint-disable-next-line
        console.error('Problem reading address data', message, statusCode);
      }
      this.setState({ time: Date.now() }); // cause componentWillUpdate to call again.
    }
  };

  checkAddressLocalStorage = async () => {
    let address = [];

    const localStorageStory = await localStorage.getItem('ledger');
    if (localStorageStory !== null) {
      address = JSON.parse(localStorageStory);
      console.log('address', address);
      this.setState({ addressLocalStor: address });
      this.getBandwidth();
      this.getLinkPrice();
    } else {
      this.setState({
        addressLocalStor: null,
      });
    }
  };

  calculationIpfsTo = async () => {
    const { contentHash, file } = this.state;
    const { node } = this.props;

    let toCid = contentHash;
    if (file !== null) {
      toCid = file;
    }

    if (file !== null) {
      toCid = await getPin(node, toCid);
    } else if (!toCid.match(PATTERN_IPFS_HASH)) {
      toCid = await getPin(node, toCid);
    }

    this.setState({
      toCid,
    });
  };

  calculationIpfsFrom = async () => {
    const { keywordHash, node } = this.props;

    let fromCid = keywordHash;

    if (!fromCid.match(PATTERN_IPFS_HASH)) {
      fromCid = await getPin(node, fromCid);
    }

    this.setState({
      fromCid,
    });
  };

  stageReady = () => {
    this.setState({
      stage: STAGE_READY,
    });
  };

  getNetworkId = async () => {
    const data = await statusNode();
    return data.node_info.network;
  };

  getAddressInfo = async () => {
    try {
      const { address } = this.state;
      this.setState({
        stage: LEDGER_TX_ACOUNT_INFO,
      });
      const addressInfo = await this.ledger.getAccountInfoCyber(address);
      const chainId = await this.getNetworkId();

      addressInfo.chainId = chainId;

      this.setState({
        addressInfo,
      });
    } catch (error) {
      const { message, statusCode } = error;
      if (message !== 'getAddressInfo') {
        // this just means we haven't found the device yet...
        // eslint-disable-next-line
        console.error('getAddressInfo', message, statusCode);
      }
      this.setState({ time: Date.now() }); // cause componentWillUpdate to call again.
    }
  };

  getLinkPrice = async () => {
    let linkPrice = 0;

    const data = await getCurrentBandwidthPrice();

    if (data !== null) {
      linkPrice = data * 400;
    }

    this.setState({
      linkPrice,
    });
  };

  getBandwidth = async () => {
    try {
      const { addressLocalStor } = this.state;

      const bandwidth = {
        remained: 0,
        max_value: 0,
      };

      let data = null;

      if (addressLocalStor !== null) {
        data = await getAccountBandwidth(addressLocalStor.bech32);

        if (data !== null) {
          bandwidth.remained = data.remained;
          bandwidth.max_value = data.max_value;
        }
      }
      this.setState({
        bandwidth,
      });
    } catch (error) {
      const { message, statusCode } = error;
      if (message !== 'getBandwidth') {
        console.error('getBandwidth', message, statusCode);
      }
      this.setState({ time: Date.now() }); // cause componentWillUpdate to call again.
    }
  };

  link = async () => {
    const { address, addressInfo, fromCid, toCid } = this.state;

    const txContext = {
      accountNumber: addressInfo.accountNumber,
      chainId: addressInfo.chainId,
      sequence: addressInfo.sequence,
      bech32: address.bech32,
      pk: address.pk,
      path: address.path,
    };

    const tx = await this.ledger.txCreateLink(
      txContext,
      address.bech32,
      fromCid,
      toCid,
      MEMO
    );
    console.log('tx', tx);

    await this.setState({
      txMsg: tx,
      txContext,
      txBody: null,
      error: null,
    });
    // debugger;
    this.signTx();
  };

  signTx = async () => {
    const { txMsg, txContext } = this.state;
    // console.log('txContext', txContext);
    this.setState({ stage: STAGE_WAIT });
    const sing = await this.ledger.sign(txMsg, txContext);
    console.log('sing', sing);
    if (sing.return_code === LEDGER.LEDGER_OK) {
      const applySignature = await this.ledger.applySignature(
        sing,
        txMsg,
        txContext
      );
      if (applySignature !== null) {
        this.setState({
          txMsg: null,
          txBody: applySignature,
          stage: STAGE_SUBMITTED,
        });
        await this.injectTx();
      }
    } else {
      this.setState({
        stage: STAGE_ERROR,
        txBody: null,
        errorMessage: sing.error_message,
      });
    }
  };

  injectTx = async () => {
    const { txBody } = this.state;
    const txSubmit = await this.ledger.txSubmitCyber(txBody);
    const data = txSubmit;
    console.log('data', data);
    if (data.error) {
      // if timeout...
      // this.setState({stage: STAGE_CONFIRMING})
      // else
      this.setState({ stage: STAGE_ERROR, errorMessage: data.error });
    } else {
      this.setState({ stage: STAGE_SUBMITTED, txHash: data.data.txhash });
      this.timeOut = setTimeout(this.confirmTx, 1500);
    }
  };

  confirmTx = async () => {
    const { update } = this.props;
    if (this.state.txHash !== null) {
      this.setState({ stage: STAGE_CONFIRMING });
      const status = await this.ledger.txStatusCyber(this.state.txHash);
      console.log('status', status);
      const data = await status;
      if (data.logs) {
        this.setState({
          stage: STAGE_CONFIRMED,
          txHeight: data.height,
        });
        if (update) {
          update();
        }
        return;
      }
      if (data.code) {
        this.setState({
          stage: STAGE_ERROR,
          txHeight: data.height,
          errorMessage: data.raw_log,
        });
        return;
      }
    }
    this.timeOut = setTimeout(this.confirmTx, 1500);
  };

  onChangeInput = async e => {
    const { value } = e.target;
    this.setState({
      contentHash: value,
    });
  };

  cleatState = () => {
    this.setState({
      stage: STAGE_INIT,
      init: false,
      ledger: null,
      address: null,
      returnCode: null,
      addressInfo: null,
      ledgerVersion: [0, 0, 0],
      time: 0,
      linkPrice: 0,
      contentHash: '',
      txMsg: null,
      txContext: null,
      txBody: null,
      txHeight: null,
      txHash: null,
      error: null,
      errorMessage: null,
      file: null,
      fromCid: null,
      toCid: null,
    });
    this.timeOut = null;
  };

  onClickInitStage = () => {
    this.cleatState();
    this.setState({
      stage: STAGE_INIT,
    });
  };

  onClickUsingLedger = () => {
    // this.init();
    this.setState({
      stage: CREATE_LINK,
    });
  };

  onClickInitLedger = async () => {
    // this.init();
    await this.setState({
      stage: STAGE_LEDGER_INIT,
    });
    this.getLedgerAddress();
  };

  onClickClear = () => {
    this.setState({
      file: null,
    });
  };

  hasKey() {
    return this.state.address !== null;
  }

  hasWallet() {
    return this.state.addressInfo !== null;
  }

  showOpenFileDlg = () => {
    this.inputOpenFileRef.current.click();
  };

  onFilePickerChange = files => {
    const file = files.current.files[0];

    this.setState({
      file,
    });
  };

  addAddressOnClick = () => {
    this.setState({
      stage: ADD_ADDRESS,
    });
  };

  render() {
    const {
      address,
      connectLedger,
      bandwidth,
      contentHash,
      returnCode,
      ledgerVersion,
      stage,
      txMsg,
      txHeight,
      txHash,
      errorMessage,
      file,
      linkPrice,
      addressLocalStor,
    } = this.state;

    const { valueSearchInput } = this.props;

    if (stage === STAGE_INIT && addressLocalStor === null) {
      return (
        <ActionBar>
          <ActionBarContentText>
            Play Game of Links. Get EUL with
            <Link
              style={{
                paddingTop: 10,
                margin: '0 15px',
                paddingBottom: 10,
                display: 'block',
              }}
              className="btn"
              to="/gol/faucet"
            >
              ETH
            </Link>{' '}
            or
            <Link
              style={{
                paddingTop: 10,
                margin: '0 15px',
                paddingBottom: 10,
                display: 'block',
              }}
              className="btn"
              to="/gol/takeoff"
            >
              ATOM
            </Link>
          </ActionBarContentText>
        </ActionBar>
      );
    }

    if (stage === ADD_ADDRESS) {
      return (
        <ConnectLadger
          pin={returnCode >= LEDGER_NOAPP}
          app={returnCode === LEDGER_OK}
          onClickBtnCloce={this.onClickInitStage}
          version={
            returnCode === LEDGER_OK &&
            this.compareVersion(ledgerVersion, LEDGER_VERSION_REQ)
          }
        />
      );
    }

    if (stage === STAGE_INIT) {
      return (
        <StartStageSearchActionBar
          valueSearchInput={valueSearchInput}
          onClickBtn={this.onClickUsingLedger}
          contentHash={
            file !== null && file !== undefined ? file.name : contentHash
          }
          onChangeInputContentHash={this.onChangeInput}
          inputOpenFileRef={this.inputOpenFileRef}
          showOpenFileDlg={this.showOpenFileDlg}
          onChangeInput={this.onFilePickerChange}
          onClickClear={this.onClickClear}
          file={file}
        />
      );
    }

    if (stage === CREATE_LINK) {
      // if (stage === STAGE_READY) {
      // if (this.state.stage === STAGE_READY) {
      return (
        <Cyberlink
          onClickBtnCloce={this.onClickInitStage}
          query={valueSearchInput}
          onClickBtn={this.onClickInitLedger}
          bandwidth={bandwidth}
          address={trimString(addressLocalStor.bech32, 9, 4)}
          contentHash={file !== null ? file.name : contentHash}
          disabledBtn={parseFloat(bandwidth.max_value) === 0}
          linkPrice={linkPrice}
        />
      );
    }

    if (stage === STAGE_LEDGER_INIT) {
      return (
        <ConnectLadger
          onClickConnect={() => this.getLedgerAddress()}
          connectLedger={connectLedger}
        />
      );
    }

    if (stage === LEDGER_TX_ACOUNT_INFO) {
      return <CheckAddressInfo />;
    }

    if (stage === STAGE_READY && this.hasKey() && this.hasWallet()) {
      return (
        <ActionBar>
          <Pane
            display="flex"
            fontSize="20px"
            justifyContent="center"
            alignItems="center"
            flexGrow={1}
            marginRight="15px"
          >
            please press cyberlink and confirm the transaction on Ledger
          </Pane>
          <button type="button" className="btn" onClick={e => this.link(e)}>
            Cyberlink
          </button>
        </ActionBar>
      );
    }

    if (stage === STAGE_WAIT) {
      return (
        <JsonTransaction
          txMsg={txMsg}
          onClickBtnCloce={this.onClickInitStage}
        />
      );
    }

    if (stage === STAGE_SUBMITTED || stage === STAGE_CONFIRMING) {
      return <TransactionSubmitted onClickBtnCloce={this.onClickInitStage} />;
    }

    if (stage === STAGE_CONFIRMED) {
      return (
        <Confirmed
          txHash={txHash}
          txHeight={txHeight}
          onClickBtn={this.onClickInitStage}
          onClickBtnCloce={this.onClickInitStage}
        />
      );
    }

    if (stage === STAGE_ERROR && errorMessage !== null) {
      return (
        <TransactionError
          errorMessage={errorMessage}
          onClickBtn={this.onClickInitStage}
          onClickBtnCloce={this.onClickInitStage}
        />
      );
    }

    return null;
  }
}

const mapStateToProps = store => {
  return {
    node: store.ipfs.ipfs,
  };
};

export default connect(mapStateToProps)(ActionBarContainer);
