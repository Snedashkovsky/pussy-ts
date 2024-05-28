import Display from 'src/components/containerGradient/Display/Display';
import {
  Input,
  LinkWindow,
  MainContainer,
  OptionSelect,
  Select,
} from 'src/components';
import DisplayTitle from 'src/components/containerGradient/DisplayTitle/DisplayTitle';
import { Link } from 'react-router-dom';
import useAdviserTexts from 'src/features/cybernet/_move/useAdviserTexts';
import { cybernetRoutes } from '../../routes';
import useCurrentAddress from 'src/features/cybernet/_move/useCurrentAddress';
import styles from './Main.module.scss';
import useCurrentAccountStake from '../../hooks/useCurrentAccountStake';
import useDelegate from '../../hooks/useDelegate';
import { routes } from 'src/routes';
import ContractsTable from './ContractsTable/ContractsTable';
import useCybernetTexts from '../../useCybernetTexts';
import { useCybernet } from '../../cybernet.context';
import Banner from './Banner/Banner';
import { Stars } from 'src/containers/portal/components';

function Main() {
  const address = useCurrentAddress();

  const { getText } = useCybernetTexts();

  useAdviserTexts({
    defaultText: 'welcome to Cyberver 🤖',
  });

  const { data } = useDelegate(address);
  const currentAddressIsDelegator = !!data;

  const { data: currentStake } = useCurrentAccountStake();
  const haveStake = currentStake?.some(({ stake }) => stake > 0);

  const { selectedContract } = useCybernet();

  const {
    metadata: { name } = {},
    address: contractAddress,
    network = 'pussy',
  } = selectedContract || {};

  return (
    <MainContainer resetMaxWidth>
      <Stars />
      <Banner />

      <Display noPaddingX title={<DisplayTitle title="choose verse" />}>
        <ContractsTable />
      </Display>

      <div className={styles.actions}>
        <div className={styles.bgWrapper}>
          <Display
            title={
              <DisplayTitle
                title={
                  <div className={styles.actionTitle}>
                    <h3>stake</h3>
                    <div className={styles.apr}>
                      yield up to <br />
                      <span>
                        {Number(selectedContract?.economy?.staker_apr).toFixed(
                          2
                        )}
                        %
                      </span>
                    </div>
                  </div>
                }
              />
            }
          >
            <p className={styles.actionText}>
              learn by staking on {getText('delegate', true)}
            </p>
            <div className={styles.links}>
              <Link to={cybernetRoutes.delegators.getLink('pussy', name)}>
                {getText('delegate', true)}
              </Link>

              <button disabled type="button" className={styles.delegatorsBtn}>
                {getText('delegator', true)}
              </button>

              {haveStake && (
                <Link to={cybernetRoutes.myLearner.getLink('pussy', name)}>
                  my {getText('delegator')}
                </Link>
              )}
            </div>
          </Display>
        </div>

        <div className={styles.bgWrapper}>
          <Display
            title={
              <DisplayTitle
                title={
                  <div className={styles.actionTitle}>
                    <h3>mine</h3>
                    <div className={styles.apr}>
                      yield up to
                      <span>
                        {Number(
                          selectedContract?.economy?.validator_apr
                        ).toFixed(2)}
                        %
                      </span>
                    </div>
                  </div>
                }
              />
            }
          >
            <p className={styles.actionText}>teach by linking content</p>

            <div className={styles.links}>
              <Link to={cybernetRoutes.subnet.getLink('pussy', name, 0)}>
                {getText('root')}
              </Link>

              <Link to={cybernetRoutes.subnets.getLink(network, name)}>
                {getText('subnetwork', true)}
              </Link>

              {currentAddressIsDelegator && (
                <Link
                  to={cybernetRoutes.delegator.getLink(network, name, address)}
                >
                  my {getText('delegate')}
                </Link>
              )}
            </div>
          </Display>
        </div>

        <div className={styles.bgWrapper}>
          <Display
            title={
              <DisplayTitle
                title={
                  <div className={styles.actionTitle}>
                    <h3>deploy</h3>
                  </div>
                }
              />
            }
          >
            <div className={styles.links}>
              <LinkWindow to="https://github.com/cybercongress/cybertensor">
                cli and python package
              </LinkWindow>

              <LinkWindow to="https://github.com/cybercongress/cybertensor-subnet-template">
                subnet template
              </LinkWindow>

              <LinkWindow to="https://github.com/cybercongress/cybernet">
                cosmwasm contract
              </LinkWindow>

              <LinkWindow to="https://docs.spacepussy.ai">docs</LinkWindow>
            </div>
          </Display>
        </div>
      </div>
    </MainContainer>
  );
}

export default Main;
