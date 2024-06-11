/* eslint-disable react/no-unstable-nested-components */
import { Link, useParams } from 'react-router-dom';
import { Account, AmountDenom, MainContainer } from 'src/components';
import Display from 'src/components/containerGradient/Display/Display';
import DisplayTitle from 'src/components/containerGradient/DisplayTitle/DisplayTitle';

import DelegateActionBar from './DelegateActionBar/DelegateActionBar';
import styles from './Delegate.module.scss';
import {
  Delegator,
  Delegator as DelegatorType,
} from 'src/features/cybernet/types';
import useAdviserTexts from 'src/features/cybernet/_move/useAdviserTexts';
import { routes as cybernetRoutes } from '../../routes';
import { useAppSelector } from 'src/redux/hooks';
import { selectCurrentAddress } from 'src/redux/features/pocket';
import Table from 'src/components/Table/Table';
import { createColumnHelper } from '@tanstack/react-table';
import MusicalAddress from 'src/components/MusicalAddress/MusicalAddress';
import subnetStyles from '../Subnet/Subnet.module.scss';
import useDelegate from '../../hooks/useDelegate';
import useCybernetTexts from '../../useCybernetTexts';
import { useCurrentContract, useCybernet } from '../../cybernet.context';
import IconsNumber from 'src/components/IconsNumber/IconsNumber';
import { SubnetPreviewGroup } from '../../components/SubnetPreview/SubnetPreview';

const columnHelper = createColumnHelper<Delegator>();

const config: keyof DelegatorType = {
  take: {
    text: 'Commission',
  },
  validator_permits: {
    text: 'Validator permits',
  },
  total_daily_return: {
    text: 'Total daily return',
  },
  return_per_1000: {
    text: 'Return per 1000 🟣',
  },
};

function Delegator() {
  const { id } = useParams();

  const currentAddress = useAppSelector(selectCurrentAddress);

  const f = id !== 'my' ? id : currentAddress;

  const { loading, data, error, refetch } = useDelegate(f);
  const { getText } = useCybernetTexts();

  const { subnetsQuery } = useCybernet();
  const { network, contractName } = useCurrentContract();

  useAdviserTexts({
    isLoading: loading,
    error,
    defaultText: `${getText('delegate')} info`,
  });

  const myStake = data?.nominators.find(
    ([address]) => address === currentAddress
  )?.[1];

  const nominators = data?.nominators;

  const totalStake = nominators?.reduce((acc, [, stake]) => acc + stake, 0);

  return (
    <>
      {myStake && data.delegate !== currentAddress && (
        <Display title={<DisplayTitle title="My stake" />}>
          <AmountDenom amountValue={myStake} denom="pussy" />
        </Display>
      )}

      <Display
        noPaddingX
        title={
          <DisplayTitle
            inDisplay={false}
            title={
              <MusicalAddress address={id === 'my' ? currentAddress : id} />
            }
          />
        }
      >
        {!loading && !data && (
          <div
            style={{
              textAlign: 'center',
            }}
          >
            no mentor info
          </div>
        )}

        <ul className={subnetStyles.list}>
          {data &&
            Object.keys(data)
              .filter((item) => !['nominators', 'delegate'].includes(item))
              .map((item) => {
                const value = data[item];
                let content = value;

                if (item === 'owner') {
                  content = (
                    <Account avatar address={value} markCurrentAddress />
                  );
                }

                if (item === 'take') {
                  content = <span>{(value / 65535).toFixed(2) * 100}%</span>;
                }

                if (
                  [
                    'total_daily_return',
                    'return_per_1000',
                    'return_per_giga',
                  ].includes(item)
                ) {
                  content = (
                    <div>
                      <IconsNumber value={value.amount} type="pussy" />
                    </div>
                  );
                }

                if (item === 'registrations' || item === 'validator_permits') {
                  content = (
                    <ul className={styles.list}>
                      <SubnetPreviewGroup uids={value} />
                    </ul>
                  );
                }

                return (
                  <li key={item}>
                    {config[item]?.text || item}: {content}
                  </li>
                );
              })}
        </ul>
      </Display>

      {!!nominators?.length && (
        <Display
          noPaddingX
          title={
            <DisplayTitle
              title={
                <div className={styles.nominatorsHeader}>
                  <h3>{getText('delegator', true)}</h3>

                  <div>
                    <IconsNumber value={totalStake} type="pussy" />
                  </div>
                </div>
              }
            />
          }
        >
          <Table
            columns={[
              columnHelper.accessor('address', {
                header: getText('delegator'),
                enableSorting: false,
                cell: (info) => (
                  <Account
                    address={info.getValue()}
                    avatar
                    markCurrentAddress
                  />
                ),
              }),
              columnHelper.accessor('amount', {
                header: 'teaching power',
                cell: (info) => {
                  const value = info.getValue();

                  return (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <IconsNumber value={value} type="pussy" />
                    </div>
                  );
                },
              }),
            ]}
            data={nominators.map(([address, amount]) => {
              return {
                address,
                amount,
              };
            })}
            initialState={{
              sorting: [
                {
                  id: 'amount',
                  desc: true,
                },
              ],
            }}
          />
        </Display>
      )}

      <DelegateActionBar
        address={f}
        stakedAmount={myStake}
        onSuccess={refetch}
      />
    </>
  );
}

export default Delegator;
