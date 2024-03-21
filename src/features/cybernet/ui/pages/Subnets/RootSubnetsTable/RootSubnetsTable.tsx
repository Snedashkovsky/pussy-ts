import React, { useMemo } from 'react';
import { SubnetInfo } from '../../../../types';
import { createColumnHelper } from '@tanstack/react-table';
import Table from 'src/components/Table/Table';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from 'src/routes';
import { Account, Cid } from 'src/components';
import NProvider from './NProvider/NProvider';

type Props = {
  data: SubnetInfo[];
};

const columnHelper = createColumnHelper<any>();

function RootSubnetsTable({ data }: Props) {
  const navigate = useNavigate();

  return (
    <div>
      <Table
        // onSelect={(row) => navigate(`./subnets/${row}`)}
        columns={useMemo(
          () => [
            columnHelper.accessor('netuid', {
              header: 'netuid',
              cell: (info) => (
                <Link to={'./' + info.getValue()}>{info.getValue()}</Link>
              ),
            }),
            columnHelper.accessor('subnetwork_n', {
              header: 'N',
              cell: (info) => info.getValue(),
            }),
            columnHelper.accessor('emission_values', {
              header: 'Emission',
              cell: (info) => info.getValue() / 10000000 + '%',
            }),
            columnHelper.accessor('owner', {
              header: 'owner',
              cell: (info) => (
                <Link to={routes.neuron.getLink(info.getValue())}>
                  {/* // <Link to={'../delegators/' + info.getValue()}> */}
                  {/* <NProvider address={info.getValue()} /> */}
                  <Account address={info.getValue()} />
                  {/* {info.getValue().substr(0, 10) + '...'} */}
                </Link>
              ),
            }),
            // columnHelper.accessor('netuid', {
            //   header: 'link',
            //   cell: (info) => <Link to={'./' + info.getValue()}>link</Link>,
            // }),

            columnHelper.accessor('tempo', {
              header: 'tempo',
              cell: (info) => info.getValue(),
            }),

            columnHelper.accessor('max_allowed_validators', {
              header: 'Max validators',
              cell: (info) => info.getValue(),
            }),
            columnHelper.accessor('max_allowed_uids', {
              header: 'Max operators',
              cell: (info) => info.getValue(),
            }),

            columnHelper.accessor('metadata', {
              header: 'metadata',
              cell: (info) => (
                <Link to={routes.oracle.ask.getLink(info.getValue())}>
                  {/* <Cid cid={info.getValue()} /> */}
                  {info.getValue().substr(0, 10) + '...'}
                </Link>
              ),
            }),
          ],
          []
        )}
        data={data}
      />
    </div>
  );
}

export default RootSubnetsTable;